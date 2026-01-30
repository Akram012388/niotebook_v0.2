import { describe, it, expect } from "vitest";
import { parseCommand } from "../../../../../src/ui/code/terminal/commandRouter";

describe("parseCommand", () => {
  it("parses a simple command", () => {
    const result = parseCommand("ls");
    expect(result.executable).toBe("ls");
    expect(result.args).toEqual([]);
    expect(result.raw).toBe("ls");
  });

  it("parses command with arguments", () => {
    const result = parseCommand("python3 main.py");
    expect(result.executable).toBe("python3");
    expect(result.args).toEqual(["main.py"]);
  });

  it("parses command with multiple arguments", () => {
    const result = parseCommand("gcc -o main main.c");
    expect(result.executable).toBe("gcc");
    expect(result.args).toEqual(["-o", "main", "main.c"]);
  });

  it("trims whitespace", () => {
    const result = parseCommand("  echo hello  ");
    expect(result.executable).toBe("echo");
    expect(result.args).toEqual(["hello"]);
    expect(result.raw).toBe("echo hello");
  });

  it("handles empty input", () => {
    const result = parseCommand("");
    expect(result.executable).toBe("");
    expect(result.args).toEqual([]);
  });

  it("handles multiple spaces between args", () => {
    const result = parseCommand("cat   file.txt   file2.txt");
    expect(result.executable).toBe("cat");
    expect(result.args).toEqual(["file.txt", "file2.txt"]);
  });
});
