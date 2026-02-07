import { resolveIncludes } from "./imports/cIncludes";
import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

/**
 * C executor — interprets C code in-browser using JSCPP.
 * Supports stdio.h, stdlib.h, math.h, string.h, ctype.h, time.h.
 * Ideal for CS50-level code (printf, scanf, variables, loops, arrays, etc).
 */
const initCExecutor = async (): Promise<RuntimeExecutor> => {
  type JSCPP = {
    run: (
      code: string,
      input: string,
      config: Record<string, unknown>,
    ) => { exitCode: number };
  };

  let jscpp: JSCPP | null = null;

  const init = async (): Promise<void> => {
    if (jscpp) return;
    const mod = await import("JSCPP");
    jscpp = (mod.default ?? mod) as unknown as JSCPP;
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    const start = performance.now();

    if (!jscpp) {
      await init();
    }

    if (!jscpp) {
      const msg = "C interpreter failed to load.\n";
      input.onStderr?.(msg);
      return { stdout: "", stderr: msg, exitCode: 1, runtimeMs: 0 };
    }

    // JSCPP doesn't support `void` in main params: main(void) → main()
    let processedCode = input.code.replace(
      /\bmain\s*\(\s*void\s*\)/g,
      "main()",
    );
    if (input.filesystem) {
      const mainPath = input.filesystem.getMainFilePath() ?? "/project/main.c";
      processedCode = resolveIncludes(
        processedCode,
        mainPath,
        input.filesystem,
      );
    }

    let stdout = "";
    let stderr = "";

    try {
      const exitResult = jscpp.run(processedCode, input.stdin ?? "", {
        stdio: {
          write(s: string) {
            stdout += s;
            input.onStdout?.(s);
          },
        },
        unsigned_overflow: "warn",
      });

      const exitCode =
        typeof exitResult === "object" && exitResult !== null
          ? (exitResult.exitCode ?? 0)
          : 0;

      return {
        stdout,
        stderr,
        exitCode: typeof exitCode === "number" ? exitCode : 0,
        runtimeMs: Math.round(performance.now() - start),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stderr = msg + "\n";
      input.onStderr?.(stderr);
      return {
        stdout,
        stderr,
        exitCode: 1,
        runtimeMs: Math.round(performance.now() - start),
      };
    }
  };

  const stop = (): void => {
    return;
  };

  return { init, run, stop };
};

export { initCExecutor };
