import { mountPythonFiles } from "./imports/pythonImports";
import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

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

    // Mount VFS Python files to Pyodide FS if VFS is provided.
    // When a real Pyodide instance is available, this enables cross-file imports.
    // Currently the executor is still a stub, so we capture the intent for when
    // Pyodide is integrated (Phase 4+).
    if (input.filesystem) {
      // Pyodide integration point: once `pyodide` is loaded, call:
      // mountPythonFiles(pyodide, input.filesystem);
      void mountPythonFiles;
    }

    const payload = input.code.trim() ? "Input received." : "No input.";

    return {
      stdout: `Python runtime stubbed. ${payload}`,
      stderr: "",
      exitCode: 0,
      runtimeMs: Math.round(performance.now() - start),
      timedOut: false,
    };
  };

  const stop = (): void => {
    return;
  };

  return { init, run, stop };
};

export { initPythonExecutor };
