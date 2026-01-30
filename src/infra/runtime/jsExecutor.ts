import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const DEFAULT_TIMEOUT_MS = 5_000;

const initJsExecutor = async (): Promise<RuntimeExecutor> => {
  let aborted = false;

  const init = async (): Promise<void> => {
    return;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();
    aborted = false;
    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: unknown[]): void => {
      const line = `${args.map(String).join(" ")}\n`;
      stdout += line;
      input.onStdout?.(line);
    };

    console.error = (...args: unknown[]): void => {
      const line = `${args.map(String).join(" ")}\n`;
      stderr += line;
      input.onStderr?.(line);
    };

    try {
      const result = await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          timedOut = true;
          reject(new Error("Runtime timed out."));
        }, timeoutMs);

        try {
          const fn = new Function(input.code);
          fn();
          window.clearTimeout(timer);
          resolve();
        } catch (error) {
          window.clearTimeout(timer);
          reject(error);
        }
      });

      void result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      stderr = stderr ? `${stderr}${message}\n` : `${message}\n`;
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    const runtimeMs = Math.round(performance.now() - start);

    return {
      stdout,
      stderr,
      exitCode: aborted || timedOut || stderr ? 1 : 0,
      runtimeMs,
      timedOut,
    };
  };

  const stop = (): void => {
    aborted = true;
  };

  return { init, run, stop };
};

export { initJsExecutor };
