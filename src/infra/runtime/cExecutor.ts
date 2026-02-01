import { resolveIncludes } from "./imports/cIncludes";
import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

/**
 * C executor — routes through the WasmerBridge for real gcc compilation
 * and execution inside the sandbox iframe. Falls back to an error message
 * when the sandbox is unavailable.
 */
const initCExecutor = async (): Promise<RuntimeExecutor> => {
  const init = async (): Promise<void> => {
    try {
      const { getWasmerBridge } = await import("./wasmer/WasmerBridge");
      const bridge = getWasmerBridge();
      if (bridge.getStatus() !== "ready") {
        await bridge.init();
      }
    } catch {
      // Bridge unavailable — run() will handle the fallback
    }
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();

    // Resolve #include directives so the sandbox receives a single translation unit
    let processedCode = input.code;
    if (input.filesystem) {
      const mainPath =
        input.filesystem.getMainFilePath() ?? "/project/main.c";
      processedCode = resolveIncludes(input.code, mainPath, input.filesystem);
    }

    // Try WasmerBridge for real compilation + execution
    try {
      const { getWasmerBridge } = await import("./wasmer/WasmerBridge");
      const bridge = getWasmerBridge();

      if (bridge.getStatus() !== "ready") {
        await bridge.init();
      }

      if (bridge.getStatus() === "ready") {
        const result = await bridge.sendCommand(
          "gcc",
          ["-c", processedCode],
          input.filesystem,
          {
            onStdout: input.onStdout,
            onStderr: input.onStderr,
            timeoutMs: input.timeoutMs,
          },
        );
        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          runtimeMs: Math.round(result.runtimeMs),
        };
      }
    } catch {
      // Bridge unavailable — fall through to error
    }

    const message =
      "C execution requires the sandbox runtime.\nThe Wasmer sandbox could not be initialized.\n";
    input.onStderr?.(message);
    return {
      stdout: "",
      stderr: message,
      exitCode: 1,
      runtimeMs: Math.round(performance.now() - start),
    };
  };

  const stop = (): void => {
    return;
  };

  return { init, run, stop };
};

export { initCExecutor };
