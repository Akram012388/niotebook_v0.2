/**
 * Types for Wasmer/WASIX integration via iframe sandbox.
 *
 * The sandbox iframe runs with COOP/COEP headers for SharedArrayBuffer support.
 * Communication between the main app and sandbox uses postMessage.
 */

/** A Wasmer registry package descriptor. */
type WasmerPackage = {
  /** Registry name, e.g. "python/python", "syrusakbary/clang" */
  name: string;
  /** Semver version constraint */
  version: string;
  /** Command entrypoint, e.g. "python3", "clang" */
  entrypoint: string;
  /** Whether the package has been fetched and cached */
  preloaded: boolean;
};

/** Options for executing a command in the sandbox. */
type WasmerExecOptions = {
  args: string[];
  env?: Record<string, string>;
  stdin?: string;
  cwd?: string;
  /** Serialized VFS files to mount before execution */
  files?: ReadonlyArray<SerializedFile>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  timeoutMs?: number;
};

/** Result of a sandbox execution. */
type WasmerExecResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  runtimeMs: number;
};

/** A file serialized for postMessage transfer. */
type SerializedFile = {
  path: string;
  content: string;
};

// ── postMessage protocol ────────────────────────────────────

/** Messages sent from main app → sandbox iframe. */
type SandboxCommand =
  | { type: "run"; id: string; command: string; args: string[]; files: SerializedFile[] }
  | { type: "stdin"; id: string; data: string }
  | { type: "kill"; id: string }
  | { type: "fs-sync"; files: SerializedFile[] };

/** Messages sent from sandbox iframe → main app. */
type SandboxResponse =
  | { type: "ready" }
  | { type: "stdout"; id: string; data: string }
  | { type: "stderr"; id: string; data: string }
  | { type: "exit"; id: string; code: number; runtimeMs: number }
  | { type: "fs-write"; path: string; content: string }
  | { type: "error"; id: string; message: string };

export type {
  WasmerPackage,
  WasmerExecOptions,
  WasmerExecResult,
  SerializedFile,
  SandboxCommand,
  SandboxResponse,
};
