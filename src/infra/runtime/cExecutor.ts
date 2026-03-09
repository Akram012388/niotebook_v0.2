import type {
  RuntimeExecutor,
  RuntimeRunInput,
  RuntimeRunResult,
} from "./types";

/**
 * C executor — interprets C code in-browser using JSCPP running inside a Web Worker.
 *
 * 2F-1: JSCPP runs off the main thread — infinite loops no longer hang the browser tab.
 * 2F-2: 5-second timeout via setTimeout guard; resolves with timedOut: true + exitCode 124.
 * 2F-3: stop() calls worker.terminate() for immediate OS-level kill; worker re-spawns on next run.
 *
 * COOP/COEP headers are NOT required — JSCPP uses no SharedArrayBuffer or Atomics.
 * VirtualFS is stripped from the worker message — JSCPP C execution does not use the VFS
 * (include resolution is done before calling run(), in the main thread by resolveIncludes).
 */

const C_TIMEOUT_MS = 5_000;

type WorkerOutgoing =
  | { type: "stdout"; id: string; chunk: string }
  | { type: "stderr"; id: string; chunk: string }
  | { type: "result"; id: string; stdout: string; stderr: string; exitCode: number; runtimeMs: number }
  | { type: "error"; id: string; message: string };

type PendingRun = {
  resolve: (r: RuntimeRunResult) => void;
  reject: (e: Error) => void;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  startMs: number;
  timeoutHandle: ReturnType<typeof setTimeout>;
};

const initCExecutor = async (): Promise<RuntimeExecutor> => {
  let worker: Worker | null = null;
  const pendingRuns = new Map<string, PendingRun>();
  let runCounter = 0;

  const initWorker = (): Worker => {
    const w = new Worker(
      new URL("./workers/cExecutorWorker.ts", import.meta.url),
      { type: "module" },
    );

    w.onmessage = (event: MessageEvent<WorkerOutgoing>): void => {
      const msg = event.data;
      const pending = pendingRuns.get(msg.id);
      if (!pending) return;

      if (msg.type === "stdout") {
        pending.onStdout?.(msg.chunk);
        return;
      }

      if (msg.type === "stderr") {
        pending.onStderr?.(msg.chunk);
        return;
      }

      if (msg.type === "result") {
        clearTimeout(pending.timeoutHandle);
        pendingRuns.delete(msg.id);
        pending.resolve({
          stdout: msg.stdout,
          stderr: msg.stderr,
          exitCode: msg.exitCode,
          runtimeMs: msg.runtimeMs,
          timedOut: false,
        });
        return;
      }

      if (msg.type === "error") {
        clearTimeout(pending.timeoutHandle);
        pendingRuns.delete(msg.id);
        const errMsg = msg.message + "\n";
        pending.onStderr?.(errMsg);
        pending.resolve({
          stdout: "",
          stderr: errMsg,
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - pending.startMs),
          timedOut: false,
        });
        return;
      }
    };

    w.onerror = (event: ErrorEvent): void => {
      // Reject all pending runs on a worker crash
      for (const [id, pending] of pendingRuns) {
        clearTimeout(pending.timeoutHandle);
        pendingRuns.delete(id);
        pending.reject(
          new Error(event.message ?? "C worker crashed unexpectedly"),
        );
      }
      worker = null;
    };

    return w;
  };

  const getWorker = (): Worker => {
    if (!worker) {
      worker = initWorker();
    }
    return worker;
  };

  const init = async (): Promise<void> => {
    // Eagerly spawn the worker so it's ready before the first run
    getWorker();
  };

  const run = async (input: RuntimeRunInput): Promise<RuntimeRunResult> => {
    // Resolve includes on the main thread before sending to the worker —
    // the VirtualFS class instance cannot be cloned across the message boundary.
    let code = input.code.replace(
      /\bmain\s*\(\s*void\s*\)/g,
      "main()",
    );

    if (input.filesystem) {
      const { resolveIncludes } = await import("./imports/cIncludes");
      const mainPath = input.filesystem.getMainFilePath() ?? "/project/main.c";
      code = resolveIncludes(code, mainPath, input.filesystem);
    }

    const id = `c-run-${++runCounter}`;
    const startMs = performance.now();

    return new Promise<RuntimeRunResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        pendingRuns.delete(id);
        // Terminate the worker — JSCPP runs synchronously, so there is no way
        // to interrupt it mid-execution other than killing the entire Worker.
        // A fresh Worker will be spawned lazily on the next run() call.
        worker?.terminate();
        worker = null;
        const msg = "C runtime timed out after 5s\n";
        input.onStderr?.(msg);
        resolve({
          stdout: "",
          stderr: msg,
          exitCode: 124,
          runtimeMs: Math.round(performance.now() - startMs),
          timedOut: true,
        });
      }, C_TIMEOUT_MS);

      pendingRuns.set(id, {
        resolve,
        reject,
        onStdout: input.onStdout,
        onStderr: input.onStderr,
        startMs,
        timeoutHandle,
      });

      getWorker().postMessage({ type: "run", id, code, stdin: input.stdin ?? "" });
    });
  };

  const stop = (): void => {
    // Snapshot and clear pendingRuns BEFORE calling terminate() to avoid a
    // potential double-resolve if the worker's onerror handler fires synchronously
    // during terminate() and iterates the same map.
    const snapshot = [...pendingRuns.entries()];
    pendingRuns.clear();

    if (worker) {
      worker.terminate();
      worker = null;
    }

    // Resolve all snapshotted runs — callers get a clean stopped result, not a hang
    const now = performance.now();
    for (const [, pending] of snapshot) {
      clearTimeout(pending.timeoutHandle);
      pending.resolve({
        stdout: "",
        stderr: "C runtime stopped.\n",
        exitCode: 130,
        runtimeMs: Math.round(now - pending.startMs),
        timedOut: false,
      });
    }
  };

  return { init, run, stop };
};

export { initCExecutor };
