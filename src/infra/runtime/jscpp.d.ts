declare module "JSCPP" {
  interface JSCPPConfig {
    stdio?: {
      drain?: () => string | null;
      write?: (s: string) => void;
    };
    includes?: Record<string, unknown>;
    unsigned_overflow?: "error" | "warn" | "ignore";
  }

  interface JSCPPResult {
    exitCode: number;
  }

  type Run = (code: string, input: string, config?: JSCPPConfig) => JSCPPResult;

  const JSCPP: { run: Run };
  export default JSCPP;
}
