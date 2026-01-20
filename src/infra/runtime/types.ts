type RuntimeLanguage = "js" | "python" | "html" | "c";

type RuntimeRunInput = {
  code: string;
  stdin?: string;
  timeoutMs: number;
};

type RuntimeRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
};

type RuntimeExecutor = {
  init: () => Promise<void>;
  run: (input: RuntimeRunInput) => Promise<RuntimeRunResult>;
  stop: () => void;
};

type RuntimeStatus = "idle" | "warming" | "ready" | "running" | "error";

type RuntimeState = {
  language: RuntimeLanguage;
  status: RuntimeStatus;
  message?: string;
};

export type {
  RuntimeExecutor,
  RuntimeLanguage,
  RuntimeRunInput,
  RuntimeRunResult,
  RuntimeState,
  RuntimeStatus,
};
