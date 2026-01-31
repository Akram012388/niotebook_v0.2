import { describe, expect, it, vi } from "vitest";
import { initCExecutor } from "../../../../src/infra/runtime/cExecutor";

describe("cExecutor", () => {
  it("extracts printf output", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: '#include <stdio.h>\nint main() { printf("hello world"); return 0; }',
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("hello world");
    expect(result.exitCode).toBe(0);
  });

  it("extracts puts output", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: '#include <stdio.h>\nint main() { puts("line one"); return 0; }',
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("line one");
  });

  it("handles escape sequences", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: 'int main() { printf("a\\nb\\tc"); return 0; }',
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("a\nb\tc");
  });

  it("handles multiple printf calls", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: 'int main() { printf("one"); printf("two"); return 0; }',
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("onetwo");
  });

  it("calls onStdout callback", async () => {
    const executor = await initCExecutor();
    const onStdout = vi.fn();
    await executor.run({
      code: 'int main() { printf("hello"); return 0; }',
      timeoutMs: 5000,
      onStdout,
    });
    expect(onStdout).toHaveBeenCalledWith("hello");
  });

  it("returns empty stdout for code without printf/puts", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: "int main() { int x = 42; return 0; }",
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("");
  });
});
