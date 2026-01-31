import { resolveIncludes } from "./imports/cIncludes";
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

    let processedCode = input.code;
    if (input.filesystem) {
      const mainPath = input.filesystem.getMainFilePath() ?? "/project/main.c";
      processedCode = resolveIncludes(input.code, mainPath, input.filesystem);
    }

    const outputs: string[] = [];
    const printRegex = /\b(?:printf|puts)\s*\(\s*("(?:\\.|[^"\\])*?")\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = printRegex.exec(processedCode)) !== null) {
      const raw = match[1];
      if (!raw) continue;
      const unquoted = raw.slice(1, -1);
      const decoded = unquoted
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r")
        .replace(/\\\\/g, "\\")
        .replace(/\\\"/g, '"');
      outputs.push(decoded);
    }

    const stdout = outputs.join("");
    if (stdout) {
      input.onStdout?.(stdout);
    }

    return {
      stdout,
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

export { initCExecutor };
