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
