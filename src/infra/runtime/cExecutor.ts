import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const initCExecutor = async (): Promise<RuntimeExecutor> => {
  let isReady = false;

  const init = async (): Promise<void> => {
    if (isReady) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    isReady = true;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();
    await init();

    const payload = input.code.trim() ? "Input received." : "No input.";

    return {
      stdout: `C runtime spike placeholder. ${payload}`,
      stderr: "",
      exitCode: 0,
      runtimeMs: Math.round(performance.now() - start),
    };
  };

  const stop = (): void => {
    return;
  };

  return { init, run, stop };
};

export { initCExecutor };
