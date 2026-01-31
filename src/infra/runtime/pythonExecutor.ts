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

  const init = async (): Promise<void> => {
    if (isReady) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    isReady = true;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();
    await init();
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
        const pyodide = await loadPyodideInstance();

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
    return result;
  };

  const stop = (): void => {
    return;
  };

  return { init, run, stop };
};

export { initPythonExecutor };
