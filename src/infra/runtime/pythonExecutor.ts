import { mountPythonFiles } from "./imports/pythonImports";
import { RUNTIME_TIMEOUT_MS } from "./runtimeConstants";
import type {
  RuntimePackage,
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

type PyodideInstance = {
  FS: {
    writeFile: (path: string, content: string) => void;
    mkdirTree: (path: string) => void;
  };
  runPython: (code: string) => unknown;
  runPythonAsync?: (code: string) => Promise<unknown>;
  loadPackage?: (packages: string | string[]) => Promise<void>;
  setInterruptBuffer?: (buffer: Int32Array) => void;
};

type LoadPyodide = (options?: {
  indexURL?: string;
}) => Promise<PyodideInstance>;

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/";
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

let pyodidePromise: Promise<PyodideInstance> | null = null;
const installedPackages = new Set<string>();

const loadPyodideInstance = async (): Promise<PyodideInstance> => {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideInstance>((resolve, reject) => {
    const globalLoad = (globalThis as { loadPyodide?: LoadPyodide })
      .loadPyodide;
    if (globalLoad) {
      void globalLoad({ indexURL: PYODIDE_INDEX_URL })
        .then(resolve)
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const loader = (globalThis as { loadPyodide?: LoadPyodide }).loadPyodide;
      if (!loader) {
        reject(new Error("Pyodide loader unavailable"));
        return;
      }
      void loader({ indexURL: PYODIDE_INDEX_URL }).then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(script);
  });

  return pyodidePromise;
};

const getPythonPackages = (packages?: RuntimePackage[]): string[] => {
  if (!packages) return [];
  return packages
    .filter((pkg) => pkg.language === "python")
    .map((pkg) => (pkg.version ? `${pkg.name}==${pkg.version}` : pkg.name));
};

const ensurePythonPackages = async (
  pyodide: PyodideInstance,
  packages?: RuntimePackage[],
): Promise<void> => {
  const requested = getPythonPackages(packages).filter(
    (name) => !installedPackages.has(name),
  );
  if (requested.length === 0) return;

  if (pyodide.loadPackage) {
    await pyodide.loadPackage("micropip");
  }

  if (!pyodide.runPythonAsync) {
    throw new Error("Pyodide async runtime unavailable");
  }

  const installCode = `
import micropip
await micropip.install(${JSON.stringify(requested)})
`;

  await pyodide.runPythonAsync(installCode);
  for (const pkg of requested) {
    installedPackages.add(pkg);
  }
};

const initPythonExecutor = async (): Promise<RuntimeExecutor> => {
  let isReady = false;
  // Shared interrupt buffer for cooperative cancellation across all runs.
  // Initialized once on first run; reused so stop() can signal it too.
  let interruptBuffer: Int32Array | null = null;

  const init = async (): Promise<void> => {
    if (isReady) {
      return;
    }

    // Trigger Pyodide download but don't block — run() will await the promise.
    // This lets the warmup phase complete quickly so the executor is cached,
    // while Pyodide downloads in the background.
    void loadPyodideInstance();
    isReady = true;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    await init();
    // Await Pyodide BEFORE starting the timeout so download time isn't counted
    const pyodide = await loadPyodideInstance();

    // Initialize the shared interrupt buffer once so the timeout handler
    // can signal KeyboardInterrupt to Pyodide. Requires SharedArrayBuffer
    // (COOP/COEP headers — present on /editor-sandbox).
    if (
      !interruptBuffer &&
      typeof SharedArrayBuffer !== "undefined" &&
      pyodide.setInterruptBuffer
    ) {
      interruptBuffer = new Int32Array(new SharedArrayBuffer(4));
      pyodide.setInterruptBuffer(interruptBuffer);
    }
    // Reset so a stale signal from a previous timeout doesn't immediately
    // raise KeyboardInterrupt on this run.
    if (interruptBuffer) {
      Atomics.store(interruptBuffer, 0, 0);
    }

    const start = performance.now();
    const timeoutMs = input.timeoutMs ?? RUNTIME_TIMEOUT_MS;
    let suppressOutput = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const safeStdout = (chunk: string): void => {
      if (!suppressOutput) {
        input.onStdout?.(chunk);
      }
    };

    const safeStderr = (chunk: string): void => {
      if (!suppressOutput) {
        input.onStderr?.(chunk);
      }
    };

    const runPromise = (async (): Promise<RuntimeRunResult> => {
      try {
        if (input.filesystem) {
          mountPythonFiles(pyodide, input.filesystem);
        }

        await ensurePythonPackages(pyodide, input.packages);

        if (!pyodide.runPythonAsync) {
          throw new Error("Pyodide async runtime unavailable");
        }

        const captureCode = `
 import sys, io
 __stdout = io.StringIO()
 __stderr = io.StringIO()
 sys.stdout = __stdout
 sys.stderr = __stderr
 try:
     exec(${JSON.stringify(input.code)})
 except Exception as e:
     print(str(e), file=sys.stderr)
 finally:
     sys.stdout = sys.__stdout__
     sys.stderr = sys.__stderr__
 __result_out = __stdout.getvalue()
 __result_err = __stderr.getvalue()
 `;

        await pyodide.runPythonAsync(captureCode);
        const stdout = String(pyodide.runPython("__result_out") ?? "");
        const stderr = String(pyodide.runPython("__result_err") ?? "");

        if (stdout) safeStdout(stdout);
        if (stderr) safeStderr(stderr);

        return {
          stdout,
          stderr,
          exitCode: stderr ? 1 : 0,
          runtimeMs: Math.round(performance.now() - start),
          timedOut: false,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? "");
        safeStderr(`${message}\n`);
        return {
          stdout: "",
          stderr: message,
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - start),
          timedOut: false,
        };
      }
    })();

    const timeoutPromise = new Promise<RuntimeRunResult>((resolve) => {
      timeoutId = setTimeout(() => {
        suppressOutput = true;
        // Signal KeyboardInterrupt to Pyodide via the interrupt buffer.
        // Value 2 = SIGINT, which Pyodide translates to KeyboardInterrupt.
        if (interruptBuffer) {
          Atomics.store(interruptBuffer, 0, 2);
        }
        const message = "Python runtime timed out";
        input.onStderr?.(`${message}\n`);
        resolve({
          stdout: "",
          stderr: message,
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - start),
          timedOut: true,
        });
      }, timeoutMs);
    });

    const result = await Promise.race([runPromise, timeoutPromise]);
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    // Buffer is reset at the start of the next run() call, so no need
    // to clear it here — stop() may signal after Promise.race resolves.
    return result;
  };

  const stop = (): void => {
    // Signal KeyboardInterrupt via the shared interrupt buffer so Pyodide
    // can cooperatively cancel at the next yield point.
    if (interruptBuffer) {
      Atomics.store(interruptBuffer, 0, 2);
    }
  };

  return { init, run, stop };
};

export { initPythonExecutor };
