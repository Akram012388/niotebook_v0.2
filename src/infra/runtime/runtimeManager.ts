import { initCExecutor } from "./cExecutor";
import { initCssExecutor } from "./cssExecutor";
import { initHtmlExecutor } from "./htmlExecutor";
import { initJsExecutor } from "./jsExecutor";
import { initPythonExecutor } from "./pythonExecutor";
import { initSqlExecutor } from "./sqlExecutor";
import { initRExecutor } from "./rExecutor";
import type { VirtualFS } from "../vfs/VirtualFS";
import type {
  RuntimeExecutor,
  RuntimeLanguage,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const executorMap: Partial<Record<RuntimeLanguage, RuntimeExecutor>> = {};

/** Whether to try routing through the sandbox bridge first. */
let sandboxEnabled = false;

/**
 * Enable or disable sandbox-first execution.
 * When enabled, runRuntime will attempt the WasmerBridge before falling back
 * to direct executors.
 */
const setSandboxEnabled = (enabled: boolean): void => {
  sandboxEnabled = enabled;
};

const isSandboxEnabled = (): boolean => sandboxEnabled;

const loadExecutor = async (
  language: RuntimeLanguage,
): Promise<RuntimeExecutor> => {
  if (executorMap[language]) {
    return executorMap[language] as RuntimeExecutor;
  }

  let executor: RuntimeExecutor;

  switch (language) {
    case "js":
      executor = await initJsExecutor();
      break;
    case "html":
      executor = await initHtmlExecutor();
      break;
    case "css":
      executor = await initCssExecutor();
      break;
    case "python":
      executor = await initPythonExecutor();
      break;
    case "c":
      executor = await initCExecutor();
      break;
    case "sql":
      executor = await initSqlExecutor();
      break;
    case "r":
      executor = await initRExecutor();
      break;
    default:
      executor = await initJsExecutor();
  }

  executorMap[language] = executor;
  await executor.init();

  return executor;
};

/**
 * Map language to the sandbox command name.
 * Used when sandbox-first execution is enabled.
 */
const LANGUAGE_TO_COMMAND: Partial<Record<RuntimeLanguage, string>> = {
  python: "python3",
  c: "gcc",
};

const runRuntime = async (
  language: RuntimeLanguage,
  input: RuntimeRunInput,
  filesystem?: VirtualFS,
): Promise<RuntimeRunResult> => {
  const streamState = { stdout: false, stderr: false };
  const stdoutHandler = input.onStdout
    ? (chunk: string) => {
        streamState.stdout = true;
        input.onStdout?.(chunk);
      }
    : undefined;
  const stderrHandler = input.onStderr
    ? (chunk: string) => {
        streamState.stderr = true;
        input.onStderr?.(chunk);
      }
    : undefined;

  // Try sandbox bridge first if enabled
  if (sandboxEnabled && filesystem) {
    const sandboxCmd = LANGUAGE_TO_COMMAND[language];
    if (sandboxCmd) {
      try {
        const { getWasmerBridge } = await import("./wasmer/WasmerBridge");
        const bridge = getWasmerBridge();
        if (bridge.getStatus() === "ready") {
          const result = await bridge.sendCommand(
            sandboxCmd,
            ["-c", input.code],
            filesystem,
            {
              onStdout: stdoutHandler,
              onStderr: stderrHandler,
              timeoutMs: input.timeoutMs,
            },
          );
          const finalResult = {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            runtimeMs: result.runtimeMs,
          };
          return {
            ...finalResult,
            stdout: streamState.stdout
              ? "\x00__streamed__"
              : finalResult.stdout,
            stderr: streamState.stderr
              ? "\x00__streamed__"
              : finalResult.stderr,
          };
        }
      } catch {
        // Sandbox failed, fall through to direct executor
      }
    }
  }

  const executor = await loadExecutor(language);
  const result = await executor.run(
    filesystem
      ? {
          ...input,
          filesystem,
          onStdout: stdoutHandler,
          onStderr: stderrHandler,
        }
      : {
          ...input,
          onStdout: stdoutHandler,
          onStderr: stderrHandler,
        },
  );

  return {
    ...result,
    stdout: streamState.stdout ? "\x00__streamed__" : result.stdout,
    stderr: streamState.stderr ? "\x00__streamed__" : result.stderr,
  };
};

const stopRuntime = async (language: RuntimeLanguage): Promise<void> => {
  const executor = executorMap[language];

  if (!executor) {
    return;
  }

  executor.stop();
};

const clearRuntime = (language: RuntimeLanguage): void => {
  if (executorMap[language]) {
    executorMap[language] = undefined;
  }
};

export {
  clearRuntime,
  isSandboxEnabled,
  loadExecutor,
  runRuntime,
  setSandboxEnabled,
  stopRuntime,
};
