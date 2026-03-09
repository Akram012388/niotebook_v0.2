import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

/* ------------------------------------------------------------------ */
/*  WebR types — only what we use from the public API                 */
/* ------------------------------------------------------------------ */

type OutputEntry = { type: string; data: string };

type CaptureResult = {
  output: OutputEntry[];
  images: ImageBitmap[];
  result: { type: string };
};

type Shelter = {
  captureR: (
    code: string,
    options?: { withAutoprint?: boolean },
  ) => Promise<CaptureResult>;
  purge: () => void;
};

type ShelterConstructor = new () => Promise<Shelter>;

type WebRInstance = {
  init: () => Promise<void>;
  FS: {
    writeFile: (path: string, content: string) => void;
    mkdirTree: (path: string) => void;
  };
  destroy: () => void;
  Shelter: ShelterConstructor;
};

type WebRClass = new (options?: {
  baseUrl?: string;
  interactive?: boolean;
  channelType?: number;
}) => WebRInstance;

type WebRGlobal = {
  WebR?: WebRClass;
  ChannelType?: { PostMessage: number };
  __webr_loaded__?: boolean;
};

/* Pin CDN to same major version as package.json (webr@^0.5.8) */
const WEBR_CDN = "https://webr.r-wasm.org/v0.5.8/";
const WEBR_SCRIPT_URL = `${WEBR_CDN}webr.mjs`;
// Fallback CDN option: https://cdn.jsdelivr.net/npm/webr@0.5.8/dist/
// Currently unused — if primary CDN fails, consider implementing CDN fallback

const WEBR_LOAD_TIMEOUT_MS = 60_000;
const WEBR_EVAL_TIMEOUT_MS = 30_000;

let webrPromise: Promise<{ webr: WebRInstance; shelter: Shelter }> | null =
  null;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

/**
 * Load WebR from CDN via inline <script type="module">.
 * Cross-origin dynamic import() fails in many browsers, so we inject
 * a module script that assigns WebR to globalThis (same pattern as Pyodide).
 */
function loadWebR(): Promise<{ webr: WebRInstance; shelter: Shelter }> {
  if (webrPromise) return webrPromise;

  webrPromise = withTimeout(
    (async () => {
      const g = globalThis as unknown as WebRGlobal;

      if (!g.WebR) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.type = "module";
          script.textContent = `
            import { WebR, ChannelType } from "${WEBR_SCRIPT_URL}";
            globalThis.WebR = WebR;
            globalThis.ChannelType = ChannelType;
            globalThis.__webr_loaded__ = true;
            document.dispatchEvent(new Event("webr-loaded"));
          `;
          script.onerror = (event) => {
            document.removeEventListener("webr-loaded", onLoaded);
            console.error("[rExecutor] WebR CDN load failed:", event);
            reject(
              new Error(
                `WebR failed to load from CDN (${WEBR_CDN}). Check your network connection.`,
              ),
            );
          };

          const onLoaded = () => {
            document.removeEventListener("webr-loaded", onLoaded);
            resolve();
          };
          document.addEventListener("webr-loaded", onLoaded);
          document.head.appendChild(script);
        });
      }

      const WebR = g.WebR;
      if (!WebR) throw new Error("WebR module did not export WebR class");

      const channelType = g.ChannelType?.PostMessage ?? 3;
      const webr = new WebR({
        baseUrl: WEBR_CDN,
        interactive: false,
        channelType,
      });
      await webr.init();

      // Create a shelter for captureR — must be constructed async
      const shelter = await new webr.Shelter();

      return { webr, shelter };
    })(),
    WEBR_LOAD_TIMEOUT_MS,
    "WebR load",
  );

  webrPromise.catch((err: unknown) => {
    console.error("[rExecutor] WebR load failed, clearing cached promise:", err);
    webrPromise = null;
  });
  return webrPromise;
}

function mountRFiles(
  webr: WebRInstance,
  filesystem: import("../vfs/VirtualFS").VirtualFS,
): void {
  const allFiles = [
    ...filesystem.glob("/project/**/*.R"),
    ...filesystem.glob("/project/**/*.r"),
  ];
  for (const file of allFiles) {
    const dir = file.path.substring(0, file.path.lastIndexOf("/"));
    if (dir && dir !== "/") {
      try {
        webr.FS.mkdirTree(dir);
      } catch {
        /* exists */
      }
    }
    try {
      webr.FS.writeFile(file.path, file.content);
    } catch {
      /* skip */
    }
  }
}

async function initRExecutor(): Promise<RuntimeExecutor> {
  const executor: RuntimeExecutor = {
    async init() {
      void loadWebR();
    },

    async run(input: RuntimeRunInput): Promise<RuntimeRunResult> {
      const start = performance.now();
      let stdout = "";
      let stderr = "";

      try {
        const { webr, shelter } = await loadWebR();

        if (input.filesystem) {
          mountRFiles(webr, input.filesystem);
        }

        // Use shelter.captureR — the correct way to capture stdout/stderr.
        // It returns { output: [{type, data}, ...], images, result }.
        const captured = await withTimeout(
          shelter.captureR(input.code, { withAutoprint: true }),
          WEBR_EVAL_TIMEOUT_MS,
          "R execution",
        );

        // Drain output array → stream to terminal
        for (const entry of captured.output) {
          if (entry.type === "stdout") {
            stdout += entry.data + "\n";
            input.onStdout?.(entry.data + "\n");
          } else if (
            entry.type === "stderr" ||
            entry.type === "message" ||
            entry.type === "warning" ||
            entry.type === "error"
          ) {
            stderr += entry.data + "\n";
            input.onStderr?.(entry.data + "\n");
          }
        }

        // Clean up shelter objects
        try {
          shelter.purge();
        } catch {
          /* ignore */
        }

        return {
          stdout,
          stderr,
          exitCode: stderr ? 1 : 0,
          runtimeMs: Math.round(performance.now() - start),
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const errLine = `[R error] ${msg}\n`;
        stderr += errLine;
        input.onStderr?.(errLine);
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
