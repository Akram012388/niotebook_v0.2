type RuntimeLanguage = "js" | "python" | "html" | "c" | "css" | "sql" | "r";

type RuntimePackage = {
  language: RuntimeLanguage;
  name: string;
  version?: string;
};

type RuntimeRunInput = {
  code: string;
  stdin?: string;
  timeoutMs: number;
  /** Virtual filesystem instance for multi-file support. Optional for backward compatibility. */
  filesystem?: import("../vfs/VirtualFS").VirtualFS;
  /** Optional packages to preinstall for the runtime. */
  packages?: RuntimePackage[];
  /** Streaming stdout callback. Called as output is produced. */
  onStdout?: (chunk: string) => void;
  /** Streaming stderr callback. Called as errors are produced. */
  onStderr?: (chunk: string) => void;
  /** Active lesson identifier. Used by stateful executors (e.g. SQL) to detect lesson changes and reset per-lesson state. */
  lessonId?: string;
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
  RuntimePackage,
  RuntimeRunInput,
  RuntimeRunResult,
  RuntimeState,
  RuntimeStatus,
};
