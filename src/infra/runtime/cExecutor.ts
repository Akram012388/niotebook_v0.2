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

    // Resolve #include "..." directives from VFS before compilation.
    // This inlines user headers for the TCC-WASM fallback compiler.
    let processedCode = input.code;
    if (input.filesystem) {
      const mainPath =
        input.filesystem.getMainFilePath() ?? "/project/main.c";
      processedCode = resolveIncludes(input.code, mainPath, input.filesystem);
    }

    const payload = processedCode.trim() ? "Input received." : "No input.";

    return {
      stdout: `C runtime spike placeholder. ${payload}`,
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
