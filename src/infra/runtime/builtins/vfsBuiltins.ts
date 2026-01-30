/**
 * Shared VFS builtin commands used by both the terminal command router
 * and the Wasmer sandbox shell.
 *
 * Each builtin receives a standard I/O interface and returns an exit code.
 */

type BuiltinIO = {
  stdout: (data: string) => void;
  stderr: (data: string) => void;
};

type VFSLike = {
  readFile: (path: string) => string | null;
  readDir: (path: string) => ReadonlyArray<{ name: string; path: string; kind: "file" | "directory" }>;
  stat: (path: string) => { kind: "file" | "directory" } | null;
  exists: (path: string) => boolean;
  writeFile: (path: string, content: string) => unknown;
  mkdir: (path: string) => unknown;
  delete: (path: string) => void;
};

/** Map-based VFS adapter for the sandbox shell's flat file map. */
type MapVFS = {
  has: (path: string) => boolean;
  get: (path: string) => string | undefined;
  set: (path: string, content: string) => void;
  delete: (path: string) => void;
  keys: () => IterableIterator<string>;
};

function resolvePath(arg: string): string {
  return arg.startsWith("/") ? arg : `/project/${arg}`;
}

function runEcho(args: string[], io: BuiltinIO): number {
  io.stdout(args.join(" ") + "\n");
  return 0;
}

function runPwd(io: BuiltinIO): number {
  io.stdout("/project\n");
  return 0;
}

function runCatVFS(args: string[], vfs: VFSLike, io: BuiltinIO): number {
  if (args.length === 0) {
    io.stderr("cat: missing file operand\n");
    return 1;
  }
  for (const arg of args) {
    const resolved = resolvePath(arg);
    const content = vfs.readFile(resolved);
    if (content === null) {
      io.stderr(`cat: ${arg}: No such file\n`);
      return 1;
    }
    io.stdout(content.endsWith("\n") ? content : content + "\n");
  }
  return 0;
}

function runLsVFS(args: string[], vfs: VFSLike, io: BuiltinIO): number {
  const targetPath = args[0] ?? "/project";
  const resolved = resolvePath(targetPath);
  const dirNode = vfs.stat(resolved);
  if (!dirNode || dirNode.kind !== "directory") {
    io.stderr(`ls: cannot access '${resolved}': No such directory\n`);
    return 1;
  }
  const nodes = vfs.readDir(resolved);
  for (const node of nodes) {
    if (node.kind === "directory") {
      io.stdout(`\x1b[34m${node.name}/\x1b[0m\n`);
    } else {
      io.stdout(node.name + "\n");
    }
  }
  return 0;
}

function runMkdirVFS(args: string[], vfs: VFSLike): number {
  for (const arg of args) {
    if (arg.startsWith("-")) continue;
    const resolved = resolvePath(arg);
    vfs.mkdir(resolved);
  }
  return 0;
}

function runRmVFS(args: string[], vfs: VFSLike, io: BuiltinIO): number {
  for (const arg of args) {
    if (arg.startsWith("-")) continue;
    const resolved = resolvePath(arg);
    if (vfs.exists(resolved)) {
      vfs.delete(resolved);
    } else {
      io.stderr(`rm: cannot remove '${arg}': No such file\n`);
      return 1;
    }
  }
  return 0;
}

// ── Map-based variants for the sandbox shell ────────────────

function runCatMap(args: string[], files: MapVFS, io: BuiltinIO): number {
  if (args.length === 0) {
    io.stderr("cat: missing file operand\n");
    return 1;
  }
  for (const arg of args) {
    const resolved = resolvePath(arg);
    const content = files.get(resolved);
    if (content === undefined) {
      io.stderr(`cat: ${arg}: No such file\n`);
      return 1;
    }
    io.stdout(content.endsWith("\n") ? content : content + "\n");
  }
  return 0;
}

function runLsMap(args: string[], files: MapVFS, io: BuiltinIO): number {
  const targetPath = args[0] ?? "/project";
  const resolved = targetPath.startsWith("/") ? targetPath : `/project/${targetPath}`;
  const prefix = resolved.endsWith("/") ? resolved : resolved + "/";
  const entries = new Set<string>();

  for (const path of files.keys()) {
    if (path.startsWith(prefix)) {
      const relative = path.slice(prefix.length);
      const topLevel = relative.split("/")[0];
      if (topLevel) entries.add(topLevel);
    }
  }

  if (entries.size === 0) {
    if (files.has(resolved)) {
      const name = resolved.split("/").pop() ?? resolved;
      io.stdout(name + "\n");
    }
  } else {
    const sorted = Array.from(entries).sort();
    io.stdout(sorted.join("\n") + "\n");
  }
  return 0;
}

function runRmMap(args: string[], files: MapVFS): number {
  for (const arg of args) {
    if (arg.startsWith("-")) continue;
    const resolved = resolvePath(arg);
    files.delete(resolved);
  }
  return 0;
}

export {
  runEcho,
  runPwd,
  runCatVFS,
  runLsVFS,
  runMkdirVFS,
  runRmVFS,
  runCatMap,
  runLsMap,
  runRmMap,
};
export type { BuiltinIO, VFSLike, MapVFS };
