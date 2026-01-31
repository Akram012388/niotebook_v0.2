import { describe, expect, it } from "vitest";
import { resolveIncludes } from "../../../../../src/infra/runtime/imports/cIncludes";
import { VirtualFS } from "../../../../../src/infra/vfs/VirtualFS";

const makeVFS = (files: Record<string, string>): VirtualFS => {
  const vfs = new VirtualFS();
  for (const [path, content] of Object.entries(files)) {
    vfs.writeFile(path, content);
  }
  return vfs;
};

describe("resolveIncludes", () => {
  it("inlines user includes from VFS", () => {
    const vfs = makeVFS({
      "/project/main.c": '#include "helpers.h"\nint main() {}',
      "/project/helpers.h": "int add(int a, int b) { return a + b; }",
    });
    const result = resolveIncludes(
      '#include "helpers.h"\nint main() {}',
      "/project/main.c",
      vfs,
    );
    expect(result).toContain("int add(int a, int b)");
    expect(result).not.toContain('#include "helpers.h"');
  });

  it("leaves system includes untouched", () => {
    const vfs = makeVFS({
      "/project/main.c": "#include <stdio.h>\nint main() {}",
    });
    const result = resolveIncludes(
      "#include <stdio.h>\nint main() {}",
      "/project/main.c",
      vfs,
    );
    expect(result).toContain("#include <stdio.h>");
  });

  it("prevents circular includes", () => {
    const vfs = makeVFS({
      "/project/a.h": '#include "b.h"\nint a = 1;',
      "/project/b.h": '#include "a.h"\nint b = 2;',
    });
    const result = resolveIncludes(
      '#include "a.h"',
      "/project/main.c",
      vfs,
    );
    expect(result).toContain("/* circular include:");
    expect(result).toContain("int a = 1");
    expect(result).toContain("int b = 2");
  });

  it("leaves unresolved user includes as-is", () => {
    const vfs = makeVFS({});
    const result = resolveIncludes(
      '#include "missing.h"\nint main() {}',
      "/project/main.c",
      vfs,
    );
    expect(result).toContain('#include "missing.h"');
  });
});
