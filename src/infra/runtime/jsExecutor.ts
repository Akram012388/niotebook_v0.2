import { makeRequireShim } from "./imports/jsModules";
import { runInSandboxedIframe } from "./jsSandbox";
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

    // Prepend require() shim if VFS is provided (enables cross-file imports)
    let code = input.code;
    if (input.filesystem) {
      const mainPath =
        input.filesystem.getMainFilePath() ?? "/project/main.js";
      const shim = makeRequireShim(mainPath, input.filesystem);
      if (shim) {
        code = shim + "\n" + code;
      }
    }

    // Run in a sandboxed iframe for DOM isolation
    const result = await runInSandboxedIframe(
      code,
      timeoutMs,
      input.onStdout,
      input.onStderr,
    );

    const runtimeMs = Math.round(performance.now() - start);

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: aborted || result.timedOut || result.stderr ? 1 : 0,
      runtimeMs,
      timedOut: result.timedOut,
    };
  };

  const stop = (): void => {
    aborted = true;
  };

  return { init, run, stop };
};

export { initJsExecutor };
