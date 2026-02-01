import type { RuntimeExecutor, RuntimeRunInput, RuntimeRunResult } from "./types";

type WebRInstance = {
  init: () => Promise<void>;
  evalR: (code: string) => Promise<WebRResult>;
  evalRVoid: (code: string) => Promise<void>;
  FS: {
    writeFile: (path: string, content: string) => void;
    mkdirTree: (path: string) => void;
  };
  destroy: () => void;
};

type WebRResult = {
  type: string;
  values?: unknown[];
  names?: string[];
  toJs: () => Promise<{ values: unknown[] }>;
};

type WebRClass = new (options?: {
  baseUrl?: string;
  interactive?: boolean;
  channelType?: number;
}) => WebRInstance;

type WebRModule = {
  WebR?: WebRClass;
  ChannelType?: { PostMessage: number };
};

const WEBR_CDN = "https://webr.r-wasm.org/v0.5.0/";
const WEBR_SCRIPT_URL = `${WEBR_CDN}webr.mjs`;

let webrPromise: Promise<WebRInstance> | null = null;

/**
 * Load WebR from CDN via dynamic import of the ESM module URL.
 * This avoids the Next.js bundler mangling the Web Worker script paths
 * that WebR needs to spawn its communication channel.
 */
function loadWebR(): Promise<WebRInstance> {
  if (webrPromise) return webrPromise;

  webrPromise = (async () => {
    // Dynamic import from CDN URL — bypasses the bundler entirely.
    // WebR's worker scripts load relative to baseUrl, which stays correct.
    let mod: WebRModule;
    try {
      mod = (await import(/* webpackIgnore: true */ WEBR_SCRIPT_URL)) as WebRModule;
    } catch {
      throw new Error(
        "Failed to load WebR from CDN. Check your network connection.",
      );
    }

    const WebR = mod.WebR;
    if (!WebR) {
      throw new Error("WebR module did not export WebR class");
    }

    // ChannelType.PostMessage (3) — does not require COOP/COEP headers
    // or SharedArrayBuffer on the main page.
    const channelType = mod.ChannelType?.PostMessage ?? 3;

    const webr = new WebR({
      baseUrl: WEBR_CDN,
      interactive: false,
      channelType,
    });
    await webr.init();
    return webr;
  })();

  return webrPromise;
}

/**
 * Mount .R files from VFS into webR's Emscripten filesystem.
 */
function mountRFiles(
  webr: WebRInstance,
  filesystem: import("../vfs/VirtualFS").VirtualFS,
): void {
  const rFiles = filesystem.glob("/project/**/*.R");
  const rFilesLower = filesystem.glob("/project/**/*.r");
  const allFiles = [...rFiles, ...rFilesLower];

  for (const file of allFiles) {
    const dir = file.path.substring(0, file.path.lastIndexOf("/"));
    if (dir && dir !== "/") {
      try {
        webr.FS.mkdirTree(dir);
      } catch {
        // directory may already exist
      }
    }
    try {
      webr.FS.writeFile(file.path, file.content);
    } catch {
      // ignore write errors for individual files
    }
  }
}

async function initRExecutor(): Promise<RuntimeExecutor> {
  const executor: RuntimeExecutor = {
    async init() {
      // Trigger WebR download but don't block warmup.
      // run() will await the promise before executing.
      void loadWebR().catch(() => {
        // Reset promise so next attempt can retry
        webrPromise = null;
      });
    },

    async run(input: RuntimeRunInput): Promise<RuntimeRunResult> {
      const start = performance.now();
      let stdout = "";
      let stderr = "";
      let svgOutput = "";

      try {
        const webr = await loadWebR();

        // Mount VFS files
        if (input.filesystem) {
          mountRFiles(webr, input.filesystem);
        }

        // Set up output capture and SVG device
        const setupCode = `
          .nio_stdout <- ""
          .nio_stderr <- ""
          .nio_svg <- ""

          # Set up SVG capture for plots
          .nio_capture_plot <- function() {
            tmp <- tempfile(fileext = ".svg")
            svg(tmp, width = 7, height = 5)
            tmp
          }

          # Capture output
          .nio_out <- textConnection(".nio_stdout", open = "w")
          .nio_err <- textConnection(".nio_stderr", open = "w")
          sink(.nio_out)
          sink(.nio_err, type = "message")
        `;

        await webr.evalRVoid(setupCode);

        // Check if code contains plot calls
        const hasPlotCalls = /\b(plot|hist|barplot|boxplot|pie|pairs|ggplot|geom_)\b/.test(input.code);

        let userCode = input.code;
        if (hasPlotCalls) {
          userCode = `.nio_plot_file <- .nio_capture_plot()\n${input.code}\ndev.off()`;
        }

        // Execute user code
        try {
          await webr.evalRVoid(userCode);
        } catch (rErr) {
          const msg = rErr instanceof Error ? rErr.message : String(rErr);
          stderr += msg + "\n";
          input.onStderr?.(msg + "\n");
        }

        // Collect output
        const collectCode = `
          sink(type = "message")
          sink()
          close(.nio_out)
          close(.nio_err)
          .nio_stdout
        `;

        try {
          const result = await webr.evalR(collectCode);
          if (result && typeof result === "object" && "type" in result) {
            try {
              const js = await result.toJs();
              if (js.values && js.values.length > 0) {
                const text = String(js.values[0]);
                if (text) {
                  stdout += text;
                  input.onStdout?.(text);
                }
              }
            } catch {
              // toJs conversion failed, output already captured
            }
          }
        } catch {
          // Collection failed
        }

        // Collect stderr
        try {
          const errResult = await webr.evalR(".nio_stderr");
          if (errResult && typeof errResult === "object" && "type" in errResult) {
            try {
              const js = await errResult.toJs();
              if (js.values && js.values.length > 0) {
                const text = String(js.values[0]);
                if (text) {
                  stderr += text;
                  input.onStderr?.(text);
                }
              }
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }

        // Read SVG plot if generated
        if (hasPlotCalls) {
          try {
            const svgResult = await webr.evalR(
              "readLines(.nio_plot_file, warn = FALSE) |> paste(collapse = '\\n')",
            );
            if (svgResult && typeof svgResult === "object" && "type" in svgResult) {
              const js = await svgResult.toJs();
              if (js.values && js.values.length > 0) {
                svgOutput = String(js.values[0]);
              }
            }
          } catch {
            // Plot capture failed — not fatal
          }
        }

        const runtimeMs = Math.round(performance.now() - start);

        // If SVG was generated, emit it as a special stdout marker
        if (svgOutput) {
          const plotMarker = `\x00__plot_svg__${svgOutput}`;
          stdout += plotMarker;
        }

        return {
          stdout,
          stderr,
          exitCode: stderr ? 1 : 0,
          runtimeMs,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        stderr += msg + "\n";
        input.onStderr?.(msg + "\n");
        return {
          stdout,
          stderr,
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - start),
        };
      }
    },

    stop() {
      // webR doesn't support mid-execution abort
    },
  };

  return executor;
}

export { initRExecutor };
