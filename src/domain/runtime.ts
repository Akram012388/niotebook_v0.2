const RUNTIME_LANGUAGES = [
  "js",
  "python",
  "html",
  "c",
  "css",
  "sql",
  "r",
] as const;

type RuntimeLanguage = (typeof RUNTIME_LANGUAGES)[number];

const isRuntimeLanguage = (value: string): value is RuntimeLanguage => {
  return (RUNTIME_LANGUAGES as readonly string[]).includes(value);
};

type RuntimeOutput = {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
};

type RuntimeSnapshot = {
  language: RuntimeLanguage;
  output: RuntimeOutput;
};

const toRuntimeSnapshot = (
  language: RuntimeLanguage,
  output: RuntimeOutput,
): RuntimeSnapshot => {
  return {
    language,
    output,
  };
};

export type { RuntimeLanguage, RuntimeOutput, RuntimeSnapshot };
export { isRuntimeLanguage, RUNTIME_LANGUAGES, toRuntimeSnapshot };
