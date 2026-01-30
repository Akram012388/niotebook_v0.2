import { describe, expect, it, vi } from "vitest";

import { VirtualFS } from "../../../../src/infra/vfs/VirtualFS";

describe("VirtualFS", () => {
  it("creates and reads a file", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/project/main.py", 'print("hello")');
    expect(vfs.readFile("/project/main.py")).toBe('print("hello")');
  });

  it("returns null for non-existent file", () => {
    const vfs = new VirtualFS();
    expect(vfs.readFile("/nope.txt")).toBeNull();
  });

  it("creates intermediate directories automatically", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/a/b/c/file.txt", "content");
    expect(vfs.exists("/a")).toBe(true);
    expect(vfs.exists("/a/b")).toBe(true);
    expect(vfs.exists("/a/b/c")).toBe(true);
    expect(vfs.readFile("/a/b/c/file.txt")).toBe("content");
  });

  it("mkdir creates directories", () => {
    const vfs = new VirtualFS();
    const dir = vfs.mkdir("/project/src");
    expect(dir.kind).toBe("directory");
    expect(dir.name).toBe("src");
    expect(vfs.exists("/project/src")).toBe(true);
  });

  it("readDir lists children", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/project/a.js", "a");
    vfs.writeFile("/project/b.js", "b");
    vfs.mkdir("/project/sub");
    const children = vfs.readDir("/project");
    expect(children).toHaveLength(3);
    const names = children.map((c) => c.name).sort();
    expect(names).toEqual(["a.js", "b.js", "sub"]);
  });

  it("updates existing file content", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/file.txt", "v1");
    vfs.writeFile("/file.txt", "v2");
    expect(vfs.readFile("/file.txt")).toBe("v2");
  });

  it("deletes a file", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/file.txt", "data");
    vfs.delete("/file.txt");
    expect(vfs.exists("/file.txt")).toBe(false);
  });

  it("renames a file", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/old.txt", "data");
    vfs.rename("/old.txt", "/new.txt");
    expect(vfs.exists("/old.txt")).toBe(false);
    expect(vfs.readFile("/new.txt")).toBe("data");
  });

  it("renames a directory and updates child paths", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/src/file.txt", "data");
    vfs.rename("/src", "/lib");
    expect(vfs.exists("/src")).toBe(false);
    expect(vfs.exists("/lib")).toBe(true);
    const children = vfs.readDir("/lib");
    expect(children[0].path).toBe("/lib/file.txt");
  });

  it("glob matches files", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/project/main.py", "a");
    vfs.writeFile("/project/utils.py", "b");
    vfs.writeFile("/project/style.css", "c");
    const pyFiles = vfs.glob("**/*.py");
    expect(pyFiles).toHaveLength(2);
    expect(pyFiles.every((f) => f.name.endsWith(".py"))).toBe(true);
  });

  it("emits events on file operations", () => {
    const vfs = new VirtualFS();
    const events: string[] = [];
    vfs.subscribe((e) => events.push(e.type));

    vfs.writeFile("/file.txt", "v1"); // create
    vfs.writeFile("/file.txt", "v2"); // update
    vfs.rename("/file.txt", "/renamed.txt"); // rename
    vfs.delete("/renamed.txt"); // delete

    expect(events).toContain("create");
    expect(events).toContain("update");
    expect(events).toContain("rename");
    expect(events).toContain("delete");
  });

  it("unsubscribe stops events", () => {
    const vfs = new VirtualFS();
    const listener = vi.fn();
    const unsub = vfs.subscribe(listener);
    vfs.writeFile("/a.txt", "a");
    expect(listener).toHaveBeenCalled();
    unsub();
    listener.mockClear();
    vfs.writeFile("/b.txt", "b");
    expect(listener).not.toHaveBeenCalled();
  });

  it("snapshot and restore round-trips", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/project/main.py", 'print("hi")');
    vfs.mkdir("/project/sub");
    vfs.writeFile("/project/sub/util.py", "pass");

    const snap = vfs.snapshot();

    const vfs2 = new VirtualFS();
    vfs2.restore(snap);
    expect(vfs2.readFile("/project/main.py")).toBe('print("hi")');
    expect(vfs2.readFile("/project/sub/util.py")).toBe("pass");
    expect(vfs2.exists("/project/sub")).toBe(true);
  });

  it("inferLanguage maps extensions correctly", () => {
    const vfs = new VirtualFS();
    expect(vfs.inferLanguage("main.py")).toBe("python");
    expect(vfs.inferLanguage("app.js")).toBe("js");
    expect(vfs.inferLanguage("index.html")).toBe("html");
    expect(vfs.inferLanguage("prog.c")).toBe("c");
    expect(vfs.inferLanguage("header.h")).toBe("c");
    expect(vfs.inferLanguage("README")).toBeNull();
  });

  it("getMainFileContent returns main file content", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/project/main.py", "hello");
    vfs.setMainFile("/project/main.py");
    expect(vfs.getMainFileContent()).toBe("hello");
  });

  it("getMainFileContent returns empty string when no main file", () => {
    const vfs = new VirtualFS();
    expect(vfs.getMainFileContent()).toBe("");
  });

  it("resolvePath handles relative paths", () => {
    const vfs = new VirtualFS();
    expect(vfs.resolvePath("/project/src/main.py", "./utils.py")).toBe(
      "/project/src/utils.py",
    );
    expect(vfs.resolvePath("/project/src/main.py", "../lib.py")).toBe(
      "/project/lib.py",
    );
    expect(vfs.resolvePath("/project/main.py", "/abs/path.py")).toBe(
      "/abs/path.py",
    );
  });

  it("stat returns correct node type", () => {
    const vfs = new VirtualFS();
    vfs.writeFile("/file.txt", "data");
    vfs.mkdir("/dir");

    const fileStat = vfs.stat("/file.txt");
    expect(fileStat?.kind).toBe("file");

    const dirStat = vfs.stat("/dir");
    expect(dirStat?.kind).toBe("directory");

    expect(vfs.stat("/nope")).toBeNull();
  });
});
