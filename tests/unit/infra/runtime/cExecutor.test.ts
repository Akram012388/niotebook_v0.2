import { describe, expect, it, vi } from "vitest";
import { initCExecutor } from "../../../../src/infra/runtime/cExecutor";

describe("cExecutor", () => {
  it("returns sandbox error when WasmerBridge is unavailable", async () => {
    const executor = await initCExecutor();
    const onStderr = vi.fn();
    const result = await executor.run({
      code: '#include <stdio.h>\nint main() { printf("hello world"); return 0; }',
      timeoutMs: 5000,
      onStderr,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("sandbox runtime");
    expect(onStderr).toHaveBeenCalled();
  });

  it("returns empty stdout when bridge is unavailable", async () => {
    const executor = await initCExecutor();
    const result = await executor.run({
      code: "int main() { int x = 42; return 0; }",
      timeoutMs: 5000,
    });
    expect(result.stdout).toBe("");
  });
});
