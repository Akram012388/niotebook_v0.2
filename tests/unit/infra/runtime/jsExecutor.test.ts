import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SandboxResult } from "../../../../src/infra/runtime/jsSandbox";

// Mock the iframe sandbox — jsdom/node has no real document/iframe/blob APIs
vi.mock("../../../../src/infra/runtime/jsSandbox", () => ({
  runInSandboxedIframe: vi.fn(),
}));

// Also mock jsModules to avoid ESM/CDN side-effects in the shim builder
vi.mock("../../../../src/infra/runtime/imports/jsModules", () => ({
  makeRequireShim: vi.fn().mockReturnValue(null),
}));

import { runInSandboxedIframe } from "../../../../src/infra/runtime/jsSandbox";
import { initJsExecutor } from "../../../../src/infra/runtime/jsExecutor";

function sandboxResult(overrides: Partial<SandboxResult> = {}): SandboxResult {
  return { stdout: "", stderr: "", timedOut: false, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("jsExecutor", () => {
  it("basic execution: console.log produces stdout", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(
      sandboxResult({ stdout: "hello\n" }),
    );

    const executor = await initJsExecutor();
    const result = await executor.run({
      code: 'console.log("hello")',
      timeoutMs: 5000,
    });

    expect(result.stdout).toBe("hello\n");
    expect(result.stderr).toBe("");
  });

  it("returns correct result shape with timedOut: false on success", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(
      sandboxResult({ stdout: "42\n" }),
    );

    const executor = await initJsExecutor();
    const result = await executor.run({ code: "var x = 42;", timeoutMs: 5000 });

    expect(result).toMatchObject({
      stdout: "42\n",
      stderr: "",
      timedOut: false,
      exitCode: 0,
    });
    expect(typeof result.runtimeMs).toBe("number");
  });

  it("stderr output: code that calls console.error produces output in stderr", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(
      sandboxResult({ stderr: "something went wrong\n" }),
    );

    const executor = await initJsExecutor();
    const result = await executor.run({
      code: 'console.error("something went wrong")',
      timeoutMs: 5000,
    });

    expect(result.stderr).toBe("something went wrong\n");
    expect(result.exitCode).toBe(1);
  });

  it("error handling: code that throws produces stderr with the error message", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(
      sandboxResult({ stderr: "ReferenceError: x is not defined\n" }),
    );

    const executor = await initJsExecutor();
    const result = await executor.run({
      code: "console.log(x)",
      timeoutMs: 5000,
    });

    expect(result.stderr).toContain("ReferenceError");
    expect(result.exitCode).toBe(1);
  });

  it("timeout: timedOut is true when execution exceeds the time limit", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(
      sandboxResult({ timedOut: true }),
    );

    const executor = await initJsExecutor();
    const result = await executor.run({
      code: "while(true){}",
      timeoutMs: 50,
    });

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBe(1);
  });

  it("onStdout callback is called with output chunks during execution", async () => {
    vi.mocked(runInSandboxedIframe).mockImplementation(
      async (_code, _timeout, onStdout) => {
        onStdout?.("line 1\n");
        onStdout?.("line 2\n");
        return sandboxResult({ stdout: "line 1\nline 2\n" });
      },
    );

    const executor = await initJsExecutor();
    const chunks: string[] = [];
    await executor.run({
      code: 'console.log("line 1"); console.log("line 2")',
      timeoutMs: 5000,
      onStdout: (chunk) => chunks.push(chunk),
    });

    expect(chunks).toEqual(["line 1\n", "line 2\n"]);
  });

  it("empty code string executes without crashing", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(sandboxResult());

    const executor = await initJsExecutor();
    const result = await executor.run({ code: "", timeoutMs: 5000 });

    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.timedOut).toBe(false);
    expect(result.exitCode).toBe(0);
  });

  it("forwards the timeoutMs to the sandbox", async () => {
    vi.mocked(runInSandboxedIframe).mockResolvedValue(sandboxResult());

    const executor = await initJsExecutor();
    await executor.run({ code: "", timeoutMs: 1234 });

    const [, calledTimeout] = vi.mocked(runInSandboxedIframe).mock.calls[0];
    expect(calledTimeout).toBe(1234);
  });
});
