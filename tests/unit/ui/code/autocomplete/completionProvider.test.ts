import { describe, it, expect } from "vitest";
import { createNiotebookCompletions } from "../../../../../src/ui/code/autocomplete/completionProvider";
import { VirtualFS } from "../../../../../src/infra/vfs/VirtualFS";

describe("createNiotebookCompletions", () => {
  it("returns an array of completion sources", () => {
    const vfs = new VirtualFS();
    const sources = createNiotebookCompletions(
      "python",
      vfs,
      "/project/main.py",
    );
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);
  });

  it("includes VFS source, language source, and snippet source", () => {
    const vfs = new VirtualFS();
    const sources = createNiotebookCompletions("js", vfs, "/project/main.js");
    // VFS + language builtins + snippets = 3 sources
    expect(sources.length).toBe(3);
  });

  it("all sources are functions", () => {
    const vfs = new VirtualFS();
    const sources = createNiotebookCompletions(
      "python",
      vfs,
      "/project/main.py",
    );
    for (const source of sources) {
      expect(typeof source).toBe("function");
    }
  });

  it("works for all supported languages", () => {
    const vfs = new VirtualFS();
    const languages = ["python", "js", "c", "html"] as const;
    for (const lang of languages) {
      const sources = createNiotebookCompletions(
        lang,
        vfs,
        `/project/main.${lang}`,
      );
      expect(sources.length).toBeGreaterThan(0);
    }
  });
});
