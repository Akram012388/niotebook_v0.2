import { makeRequireShim } from "./imports/jsModules";
import { runInSandboxedIframe, type ExternalModuleRef } from "./jsSandbox";
import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

const DEFAULT_TIMEOUT_MS = 5_000;
const EXTERNAL_CDN_BASE = "https://esm.sh/";

const REQUIRE_REGEX = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
const DYNAMIC_IMPORT_REGEX = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function isExternalSpecifier(specifier: string): boolean {
  if (specifier.startsWith(".")) return false;
  if (specifier.startsWith("/")) return false;
  if (specifier.startsWith("http://") || specifier.startsWith("https://")) {
    return true;
  }
  if (specifier.startsWith("data:")) return true;
  return true;
}

function resolveExternalUrl(specifier: string): string {
  if (specifier.startsWith("http://") || specifier.startsWith("https://")) {
    return specifier;
  }
  if (specifier.startsWith("data:")) return specifier;
  return `${EXTERNAL_CDN_BASE}${specifier}`;
}

function collectExternalSpecifiers(code: string, into: Set<string>): void {
  let match: RegExpExecArray | null;
  while ((match = REQUIRE_REGEX.exec(code)) !== null) {
    const spec = match[1];
    if (spec && isExternalSpecifier(spec)) {
      into.add(spec);
    }
  }
  while ((match = DYNAMIC_IMPORT_REGEX.exec(code)) !== null) {
    const spec = match[1];
    if (spec && isExternalSpecifier(spec)) {
      into.add(spec);
    }
  }
}

function resolveExternalModules(
  code: string,
  filesystem?: import("../vfs/VirtualFS").VirtualFS,
): ExternalModuleRef[] {
  const specifiers = new Set<string>();
  collectExternalSpecifiers(code, specifiers);

  if (filesystem) {
    const jsFiles = [
      ...filesystem.glob("**/*.js"),
      ...filesystem.glob("**/*.mjs"),
      ...filesystem.glob("**/*.cjs"),
    ];
    for (const file of jsFiles) {
      collectExternalSpecifiers(file.content, specifiers);
    }
  }

  return Array.from(specifiers).map((specifier) => ({
    specifier,
    url: resolveExternalUrl(specifier),
  }));
}

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
      const mainPath = input.filesystem.getMainFilePath() ?? "/project/main.js";
      const shim = makeRequireShim(mainPath, input.filesystem);
      if (shim) {
        code = shim + "\n" + code;
      }
    }

    const externalModules = resolveExternalModules(code, input.filesystem);

    // Run in a sandboxed iframe for DOM isolation
    const result = await runInSandboxedIframe(
      code,
      timeoutMs,
      input.onStdout,
      input.onStderr,
      externalModules,
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
