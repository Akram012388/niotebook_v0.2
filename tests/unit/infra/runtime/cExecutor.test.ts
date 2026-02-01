import { describe, expect, it, vi } from "vitest";
import { initCExecutor } from "../../../../src/infra/runtime/cExecutor";

describe("cExecutor", () => {
  it("executes printf with literal string", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: '#include <stdio.h>\nint main() { printf("hello world"); return 0; }',
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("hello world");
    expect(result.exitCode).toBe(0);
  });

  it("executes printf with format specifiers", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: '#include <stdio.h>\nint main() { int x = 42; printf("%d\\n", x); return 0; }',
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("42\n");
  });

  it("calls onStdout callback", async () => {
    const executor = await initCExecutor();
    const onStdout = vi.fn();
    await executor.run({
      code: '#include <stdio.h>\nint main() { printf("hello"); return 0; }',
      timeoutMs: 5000,
      onStdout,
    });
    expect(onStdout).toHaveBeenCalledWith("hello");
  });

  it("returns empty stdout for code without output", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: "int main() { int x = 42; return 0; }",
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("");
  });

  it("reports errors in stderr", async () => {
    const executor = await initCExecutor();
    const onStderr = vi.fn();
    const result = await executor.run({
      code: "int main() { undefined_function(); return 0; }",
      timeoutMs: 5000,
      onStderr,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr.length).toBeGreaterThan(0);
    expect(onStderr).toHaveBeenCalled();
  });
});
