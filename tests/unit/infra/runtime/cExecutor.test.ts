/**
 * Unit tests for the Web-Worker-based C executor.
 *
 * The Worker is mocked so tests run in a plain Node/Vitest environment
 * without spawning a real Worker or loading JSCPP.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock Worker class — must be defined before any imports that use Worker
// ---------------------------------------------------------------------------

type WorkerMessage =
  | { type: "run"; id: string; code: string; stdin?: string }
  | { type: "stop" };

type WorkerOutgoing =
  | { type: "stdout"; id: string; chunk: string }
  | { type: "stderr"; id: string; chunk: string }
  | {
      type: "result";
      id: string;
      stdout: string;
      stderr: string;
      exitCode: number;
      runtimeMs: number;
    }
  | { type: "error"; id: string; message: string };

/**
 * A minimal Worker stub. Each test can set MockWorker._activeHandler to
 * drive what happens when a "run" message is posted.
 */
class MockWorker {
  onmessage: ((event: MessageEvent<WorkerOutgoing>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  terminate = vi.fn();

  postMessage = vi.fn((msg: WorkerMessage) => {
    if (msg.type !== "run") return;
    MockWorker._activeHandler?.(this, msg);
  });

  /** Emit a message as if sent from the worker thread. */
  simulateMessage(data: WorkerOutgoing): void {
    this.onmessage?.({ data } as MessageEvent<WorkerOutgoing>);
  }

  /** Simulate a worker crash. */
  simulateError(message: string): void {
    this.onerror?.({ message } as ErrorEvent);
  }

  static _activeHandler:
    | ((worker: MockWorker, msg: WorkerMessage) => void)
    | null = null;
}

// Keep a reference to the most-recently created MockWorker instance.
let mockWorkerInstance: MockWorker;

// Install the mock Worker globally BEFORE the module under test is imported.
vi.stubGlobal(
  "Worker",
  class {
    constructor(_url: unknown, _opts?: unknown) {
      mockWorkerInstance = new MockWorker();
      return mockWorkerInstance;
    }
  },
);

// ---------------------------------------------------------------------------
// Mock dynamic imports used inside cExecutor.ts
// ---------------------------------------------------------------------------

vi.mock("../../../../src/infra/runtime/imports/cIncludes", () => ({
  resolveIncludes: vi.fn((code: string) => code),
}));

// ---------------------------------------------------------------------------
// Import the module under test AFTER stubs are in place
// ---------------------------------------------------------------------------

import { initCExecutor } from "../../../../src/infra/runtime/cExecutor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RunInput = Parameters<Awaited<ReturnType<typeof initCExecutor>>["run"]>[0];

function makeRunInput(overrides: Partial<RunInput> = {}): RunInput {
  return {
    code: '#include <stdio.h>\nint main() { printf("hi"); return 0; }',
    timeoutMs: 5_000,
    ...overrides,
  };
}

/** MockWorker handler: reply immediately with a successful result. */
function mockSuccessResponse(stdout: string, stderr = "", exitCode = 0): void {
  MockWorker._activeHandler = (worker, msg) => {
    if (msg.type !== "run") return;
    const { id } = msg;
    if (stdout) {
      worker.simulateMessage({ type: "stdout", id, chunk: stdout });
    }
    worker.simulateMessage({
      type: "result",
      id,
      stdout,
      stderr,
      exitCode,
      runtimeMs: 1,
    });
  };
}

/** MockWorker handler: reply with a worker-level error message. */
function mockErrorResponse(message: string): void {
  MockWorker._activeHandler = (worker, msg) => {
    if (msg.type !== "run") return;
    worker.simulateMessage({ type: "error", id: msg.id, message });
  };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  MockWorker._activeHandler = null;
  vi.clearAllTimers();
});

afterEach(() => {
  MockWorker._activeHandler = null;
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cExecutor — init()", () => {
  it("spawns a Worker eagerly on init()", async () => {
    // Before init(), mockWorkerInstance may be from a previous test — capture it
    const instanceBefore = mockWorkerInstance ?? null;

    const executor = await initCExecutor();
    await executor.init();

    // init() must have created a new Worker (mockWorkerInstance updated by the stub)
    expect(mockWorkerInstance).toBeInstanceOf(MockWorker);
    expect(mockWorkerInstance).not.toBe(instanceBefore);
    // The worker is ready to receive messages
    expect(mockWorkerInstance.postMessage).toBeTypeOf("function");
  });
});

describe("cExecutor — run()", () => {
  it("resolves with stdout on success", async () => {
    mockSuccessResponse("hello world");
    const executor = await initCExecutor();
    await executor.init();

    const result = await executor.run(makeRunInput());

    expect(result.stdout).toBe("hello world");
    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
  });

  it("fires onStdout callback for each chunk", async () => {
    MockWorker._activeHandler = (worker, msg) => {
      if (msg.type !== "run") return;
      const { id } = msg;
      worker.simulateMessage({ type: "stdout", id, chunk: "chunk1" });
      worker.simulateMessage({ type: "stdout", id, chunk: "chunk2" });
      worker.simulateMessage({
        type: "result",
        id,
        stdout: "chunk1chunk2",
        stderr: "",
        exitCode: 0,
        runtimeMs: 1,
      });
    };

    const executor = await initCExecutor();
    await executor.init();

    const chunks: string[] = [];
    await executor.run(makeRunInput({ onStdout: (c) => chunks.push(c) }));

    expect(chunks).toEqual(["chunk1", "chunk2"]);
  });

  it("resolves with timedOut: true after timeout fires AND terminates the worker", async () => {
    vi.useFakeTimers();

    // Handler that never sends a response — simulates an infinite loop
    MockWorker._activeHandler = () => {
      // intentionally do nothing
    };

    const executor = await initCExecutor();
    await executor.init();

    const workerBeforeTimeout = mockWorkerInstance;
    const onStderr = vi.fn();
    const runPromise = executor.run(makeRunInput({ onStderr }));

    // Advance past the 5-second timeout built into cExecutor
    await vi.advanceTimersByTimeAsync(5_001);

    const result = await runPromise;

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBe(124);
    expect(result.stderr).toContain("timed out");
    expect(onStderr).toHaveBeenCalled();
    // The stuck worker must be terminated so the infinite loop stops burning CPU
    expect(workerBeforeTimeout.terminate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("resolves with error info when worker posts an error message", async () => {
    mockErrorResponse("syntax error on line 2");

    const executor = await initCExecutor();
    await executor.init();

    const onStderr = vi.fn();
    const result = await executor.run(makeRunInput({ onStderr }));

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("syntax error on line 2");
    expect(onStderr).toHaveBeenCalled();
  });
});

describe("cExecutor — stop()", () => {
  it("terminates the worker and clears pending runs", async () => {
    // Handler that never replies — run stays pending
    MockWorker._activeHandler = () => {
      // no response
    };

    const executor = await initCExecutor();
    await executor.init();

    const runPromise = executor.run(makeRunInput());

    executor.stop();

    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);

    // Pending run should resolve (not hang forever)
    const result = await runPromise;
    expect(result.exitCode).toBe(130);
    expect(result.timedOut).toBe(false);
  });

  it("does not throw when called with no active worker", async () => {
    const executor = await initCExecutor();
    // Never called init() or run() — no worker spawned
    expect(() => executor.stop()).not.toThrow();
  });
});

describe("cExecutor — worker crash (onerror)", () => {
  it("rejects pending run when the worker fires onerror", async () => {
    MockWorker._activeHandler = (worker) => {
      // Simulate a crash via onerror
      Promise.resolve()
        .then(() => worker.simulateError("Worker out of memory"))
        .catch(() => {});
    };

    const executor = await initCExecutor();
    await executor.init();

    await expect(executor.run(makeRunInput())).rejects.toThrow(
      "Worker out of memory",
    );
  });
});
