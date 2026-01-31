import { describe, it, expect } from "vitest";
import { resolveImport } from "../../../../../src/infra/runtime/imports/importResolver";
import { VirtualFS } from "../../../../../src/infra/vfs/VirtualFS";

function makeVFS(): VirtualFS {
  const vfs = new VirtualFS();
  vfs.writeFile("/project/main.py", "import utils\nutils.greet()");
  vfs.writeFile("/project/utils.py", 'def greet(): print("hi")');
  vfs.writeFile("/project/lib/helpers.js", "export const x = 1;");
  vfs.writeFile("/project/lib/index.js", 'export * from "./helpers";');
  vfs.writeFile("/project/include/header.h", "#pragma once");
  return vfs;
}

describe("resolveImport", () => {
  it("resolves exact path", () => {
    const vfs = makeVFS();
    const result = resolveImport(
      "./utils.py",
      "/project/main.py",
      "python",
      vfs,
    );
    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe("/project/utils.py");
  });

  it("resolves with extension inference (Python)", () => {
    const vfs = makeVFS();
    const result = resolveImport("./utils", "/project/main.py", "python", vfs);
    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe("/project/utils.py");
  });

  it("resolves with extension inference (JS)", () => {
    const vfs = makeVFS();
    const result = resolveImport(
      "./lib/helpers",
      "/project/main.js",
      "js",
      vfs,
    );
    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe("/project/lib/helpers.js");
  });

  it("resolves index file for directory imports (JS)", () => {
    const vfs = makeVFS();
    const result = resolveImport("./lib", "/project/main.js", "js", vfs);
    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe("/project/lib/index.js");
  });

  it("resolves absolute paths", () => {
    const vfs = makeVFS();
    const result = resolveImport(
      "/project/utils.py",
      "/project/main.py",
      "python",
      vfs,
    );
    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe("/project/utils.py");
  });

  it("returns null for non-existent file", () => {
    const vfs = makeVFS();
    const result = resolveImport(
      "./nonexistent",
      "/project/main.py",
      "python",
      vfs,
    );
    expect(result).toBeNull();
  });

  it("resolves Python __init__.py for package imports", () => {
    const vfs = makeVFS();
    vfs.writeFile("/project/pkg/__init__.py", "");
    const result = resolveImport("./pkg", "/project/main.py", "python", vfs);
    expect(result).not.toBeNull();
    expect(result!.resolvedPath).toBe("/project/pkg/__init__.py");
  });

  it("includes source and specifier metadata", () => {
    const vfs = makeVFS();
    const result = resolveImport("./utils", "/project/main.py", "python", vfs);
    expect(result!.sourcePath).toBe("/project/main.py");
    expect(result!.importSpecifier).toBe("./utils");
  });
});
