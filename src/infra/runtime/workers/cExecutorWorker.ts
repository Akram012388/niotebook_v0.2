// No "use client" — this is a Web Worker, not a React module.
// JSCPP is imported lazily on first run and cached for subsequent runs.

type JSCPPConfig = {
  stdio?: {
    drain?: () => string | null;
    write?: (s: string) => void;
  };
  includes?: Record<string, unknown>;
  unsigned_overflow?: "error" | "warn" | "ignore";
};

type JSCPPResult = {
  exitCode: number;
};

type JSCPPModule = {
  run: (code: string, input: string, config?: JSCPPConfig) => JSCPPResult;
};

type WorkerIncoming =
  | { type: "run"; id: string; code: string; stdin?: string }
  | { type: "stop" };

type WorkerOutgoing =
  | { type: "stdout"; id: string; chunk: string }
  | { type: "stderr"; id: string; chunk: string }
  | { type: "result"; id: string; stdout: string; stderr: string; exitCode: number; runtimeMs: number }
  | { type: "error"; id: string; message: string };

let jscpp: JSCPPModule | null = null;

const loadJscpp = async (): Promise<JSCPPModule> => {
  if (jscpp) return jscpp;
  const mod = await import("JSCPP");
  jscpp = (mod.default ?? mod) as unknown as JSCPPModule;
  return jscpp;
};

self.onmessage = (event: MessageEvent<WorkerIncoming>): void => {
  const msg = event.data;

  if (msg.type === "stop") {
    // Stop is handled by the host via worker.terminate(); nothing to do here.
    return;
  }

  if (msg.type === "run") {
    const { id, code, stdin } = msg;
    const start = performance.now();

    void (async () => {
      let interpreter: JSCPPModule;
      try {
        interpreter = await loadJscpp();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const out: WorkerOutgoing = {
          type: "error",
          id,
          message: `Failed to load C interpreter: ${message}`,
        };
        self.postMessage(out);
        return;
      }

      let stdout = "";
      let stderr = "";

      try {
        const exitResult = interpreter.run(code, stdin ?? "", {
          stdio: {
            write(s: string) {
              stdout += s;
              const chunk: WorkerOutgoing = { type: "stdout", id, chunk: s };
              self.postMessage(chunk);
            },
          },
          unsigned_overflow: "warn",
        });

        const exitCode =
          typeof exitResult === "object" && exitResult !== null
            ? (exitResult.exitCode ?? 0)
            : 0;

        const result: WorkerOutgoing = {
          type: "result",
          id,
          stdout,
          stderr,
          exitCode: typeof exitCode === "number" ? exitCode : 0,
          runtimeMs: Math.round(performance.now() - start),
        };
        self.postMessage(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        stderr = message + "\n";
        const chunk: WorkerOutgoing = { type: "stderr", id, chunk: stderr };
        self.postMessage(chunk);
        const result: WorkerOutgoing = {
          type: "result",
          id,
          stdout,
          stderr,
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - start),
        };
        self.postMessage(result);
      }
    })();
  }
};
