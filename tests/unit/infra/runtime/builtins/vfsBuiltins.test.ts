import { describe, expect, it } from "vitest";
import {
  runEcho,
  runPwd,
  runCatMap,
  runLsMap,
  runRmMap,
} from "../../../../../src/infra/runtime/builtins/vfsBuiltins";

function makeIO() {
  const result = { stdout: "", stderr: "" };
  const io = {
    stdout: (d: string) => { result.stdout += d; },
    stderr: (d: string) => { result.stderr += d; },
  };
  return { io, result };
}

function makeMapVFS(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries));
  return {
    has: (p: string) => map.has(p),
    get: (p: string) => map.get(p),
    set: (p: string, c: string) => map.set(p, c),
    delete: (p: string) => map.delete(p),
    keys: () => map.keys(),
  };
}

describe("vfsBuiltins", () => {
  describe("runEcho", () => {
    it("joins args with space and adds newline", () => {
      const { io, result } = makeIO();
      const code = runEcho(["hello", "world"], io);
      expect(code).toBe(0);
      expect(result.stdout).toBe("hello world\n");
    });
  });

  describe("runPwd", () => {
    it("outputs /project", () => {
      const { io, result } = makeIO();
      const code = runPwd(io);
      expect(code).toBe(0);
      expect(result.stdout).toBe("/project\n");
    });
  });

  describe("runCatMap", () => {
    it("outputs file content", () => {
      const { io, result } = makeIO();
      const files = makeMapVFS({ "/project/hello.txt": "Hello!" });
      const code = runCatMap(["hello.txt"], files, io);
      expect(code).toBe(0);
      expect(result.stdout).toBe("Hello!\n");
    });

    it("returns 1 for missing file", () => {
      const { io, result } = makeIO();
      const files = makeMapVFS({});
      const code = runCatMap(["nope.txt"], files, io);
      expect(code).toBe(1);
      expect(result.stderr).toContain("No such file");
    });

    it("returns 1 with no args", () => {
      const { io, result } = makeIO();
      const files = makeMapVFS({});
      const code = runCatMap([], files, io);
      expect(code).toBe(1);
      expect(result.stderr).toContain("missing file operand");
    });
  });

  describe("runLsMap", () => {
    it("lists files in /project", () => {
      const { io, result } = makeIO();
      const files = makeMapVFS({
        "/project/a.js": "",
        "/project/b.py": "",
      });
      const code = runLsMap([], files, io);
      expect(code).toBe(0);
      expect(result.stdout).toContain("a.js");
      expect(result.stdout).toContain("b.py");
    });
  });

  describe("runRmMap", () => {
    it("deletes a file from the map", () => {
      const files = makeMapVFS({ "/project/a.js": "code" });
      const code = runRmMap(["a.js"], files);
      expect(code).toBe(0);
      expect(files.has("/project/a.js")).toBe(false);
    });

    it("skips flag args", () => {
      const files = makeMapVFS({ "/project/a.js": "code" });
      const code = runRmMap(["-rf", "a.js"], files);
      expect(code).toBe(0);
      expect(files.has("/project/a.js")).toBe(false);
    });
  });
});
