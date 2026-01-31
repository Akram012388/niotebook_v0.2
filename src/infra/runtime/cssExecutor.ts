import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const initCssExecutor = async (): Promise<RuntimeExecutor> => {
  const init = async (): Promise<void> => {
    return;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();
    void input;
    const message =
      "CSS has no runtime output. Open or run an HTML file to preview styles.\n";

    return {
      stdout: message,
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

export { initCssExecutor };
