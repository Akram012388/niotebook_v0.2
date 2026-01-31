type RuntimeLanguage = "js" | "python" | "html" | "c" | "css";

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
export { toRuntimeSnapshot };
