import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RuntimeExecutor } from "../../../../src/infra/runtime/types";

// Mock all executor init functions to prevent real WASM/CDN loading
vi.mock("../../../../src/infra/runtime/jsExecutor", () => ({
  initJsExecutor: vi.fn(),
}));
vi.mock("../../../../src/infra/runtime/pythonExecutor", () => ({
  initPythonExecutor: vi.fn(),
}));
vi.mock("../../../../src/infra/runtime/cExecutor", () => ({
  initCExecutor: vi.fn(),
}));
vi.mock("../../../../src/infra/runtime/htmlExecutor", () => ({
  initHtmlExecutor: vi.fn(),
}));
vi.mock("../../../../src/infra/runtime/cssExecutor", () => ({
  initCssExecutor: vi.fn(),
}));
vi.mock("../../../../src/infra/runtime/sqlExecutor", () => ({
  initSqlExecutor: vi.fn(),
}));
vi.mock("../../../../src/infra/runtime/rExecutor", () => ({
  initRExecutor: vi.fn(),
}));

import { initJsExecutor } from "../../../../src/infra/runtime/jsExecutor";
import {
  clearRuntime,
  isSandboxEnabled,
  loadExecutor,
  runRuntime,
  setSandboxEnabled,
  stopRuntime,
} from "../../../../src/infra/runtime/runtimeManager";
import { STREAMED_SENTINEL } from "../../../../src/infra/runtime/runtimeConstants";

function makeStubExecutor(
  runResult = {
    stdout: "ok",
    stderr: "",
    exitCode: 0,
    runtimeMs: 10,
    timedOut: false,
  },
): RuntimeExecutor {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(runResult),
    stop: vi.fn(),
  };
}

beforeEach(() => {
  // Reset sandbox state and clear cached executors for all languages
  setSandboxEnabled(false);
  clearRuntime("js");
  clearRuntime("python");
  clearRuntime("c");
  clearRuntime("html");
  clearRuntime("css");
  clearRuntime("sql");
  clearRuntime("r");
  vi.clearAllMocks();
});

describe("loadExecutor", () => {
  it("returns an executor for 'js'", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const executor = await loadExecutor("js");

    expect(executor).toBe(stub);
  });

  it("calls init() on the executor after loading", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    await loadExecutor("js");

    expect(stub.init).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent loadExecutor calls for the same language", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    // Call twice concurrently without awaiting between them
    const [result1, result2] = await Promise.all([
      loadExecutor("js"),
      loadExecutor("js"),
    ]);

    expect(result1).toBe(result2);
    expect(vi.mocked(initJsExecutor)).toHaveBeenCalledTimes(1);
  });

  it("returns cached executor on second call without re-initialising", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const first = await loadExecutor("js");
    const second = await loadExecutor("js");

    expect(second).toBe(first);
    expect(vi.mocked(initJsExecutor)).toHaveBeenCalledTimes(1);
    expect(stub.init).toHaveBeenCalledTimes(1);
  });

  it("falls back to jsExecutor for an unrecognised language key", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    // @ts-expect-error intentionally passing an invalid language to test default case
    const executor = await loadExecutor("brainfuck");

    expect(executor).toBe(stub);
    expect(vi.mocked(initJsExecutor)).toHaveBeenCalledTimes(1);
  });
});

describe("setSandboxEnabled / isSandboxEnabled", () => {
  it("defaults to false after reset", () => {
    expect(isSandboxEnabled()).toBe(false);
  });

  it("round-trips enabled → disabled", () => {
    setSandboxEnabled(true);
    expect(isSandboxEnabled()).toBe(true);

    setSandboxEnabled(false);
    expect(isSandboxEnabled()).toBe(false);
  });

  it("returns true when set to true", () => {
    setSandboxEnabled(true);
    expect(isSandboxEnabled()).toBe(true);
  });
});

describe("runRuntime", () => {
  it("calls executor.run() and returns the result", async () => {
    const stub = makeStubExecutor({
      stdout: "hello",
      stderr: "",
      exitCode: 0,
      runtimeMs: 5,
      timedOut: false,
    });
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const result = await runRuntime("js", {
      code: 'console.log("hi")',
      timeoutMs: 1000,
    });

    expect(vi.mocked(stub.run)).toHaveBeenCalledTimes(1);
    expect(result.stdout).toBe("hello");
    expect(result.exitCode).toBe(0);
  });

  it("passes onStdout and onStderr wrappers to executor.run()", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const onStdout = vi.fn();
    const onStderr = vi.fn();

    await runRuntime("js", { code: "", timeoutMs: 1000, onStdout, onStderr });

    const callArg = vi.mocked(stub.run).mock.calls[0][0];
    expect(callArg.onStdout).toBeDefined();
    expect(callArg.onStderr).toBeDefined();
  });

  it("returns STREAMED_SENTINEL for stdout when onStdout callback is invoked", async () => {
    const stub: RuntimeExecutor = {
      init: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockImplementation(async (input) => {
        input.onStdout?.("a chunk");
        return { stdout: "a chunk", stderr: "", exitCode: 0, runtimeMs: 1 };
      }),
      stop: vi.fn(),
    };
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const onStdout = vi.fn();
    const result = await runRuntime("js", {
      code: "",
      timeoutMs: 1000,
      onStdout,
    });

    expect(result.stdout).toBe(STREAMED_SENTINEL);
    expect(onStdout).toHaveBeenCalledWith("a chunk");
  });

  it("returns STREAMED_SENTINEL for stderr when onStderr callback is invoked", async () => {
    const stub: RuntimeExecutor = {
      init: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockImplementation(async (input) => {
        input.onStderr?.("an error");
        return { stdout: "", stderr: "an error", exitCode: 1, runtimeMs: 1 };
      }),
      stop: vi.fn(),
    };
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const onStderr = vi.fn();
    const result = await runRuntime("js", {
      code: "",
      timeoutMs: 1000,
      onStderr,
    });

    expect(result.stderr).toBe(STREAMED_SENTINEL);
    expect(onStderr).toHaveBeenCalledWith("an error");
  });

  it("returns raw stdout when no onStdout callback is provided", async () => {
    const stub = makeStubExecutor({
      stdout: "raw output",
      stderr: "",
      exitCode: 0,
      runtimeMs: 2,
      timedOut: false,
    });
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    const result = await runRuntime("js", { code: "", timeoutMs: 1000 });

    expect(result.stdout).toBe("raw output");
  });
});

// ---------------------------------------------------------------------------
// stopRuntime
// ---------------------------------------------------------------------------

describe("stopRuntime", () => {
  beforeEach(() => {
    clearRuntime("js");
  });

  it("calls executor.stop() when the language has been loaded", async () => {
    const stub = makeStubExecutor();
    vi.mocked(initJsExecutor).mockResolvedValue(stub);

    await loadExecutor("js");
    await stopRuntime("js");

    expect(stub.stop).toHaveBeenCalledOnce();
  });

  it("does not throw when called for a language that was never loaded", async () => {
    clearRuntime("js");
    await expect(stopRuntime("js")).resolves.toBeUndefined();
  });
});
