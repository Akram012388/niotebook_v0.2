type RuntimeLanguage = "js" | "python" | "html" | "c";

type RuntimeRunInput = {
  code: string;
  stdin?: string;
  timeoutMs: number;
  /** Virtual filesystem instance for multi-file support. Optional for backward compatibility. */
  filesystem?: import("../vfs/VirtualFS").VirtualFS;
};

type RuntimeRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  timedOut?: boolean;
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
