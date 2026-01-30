/**
 * wasmerShell — runs INSIDE the sandbox iframe.
 *
 * Listens for postMessage commands from the parent, executes them using
 * @wasmer/sdk when available, or falls back to Pyodide + VFS builtins.
 *
 * This module is the iframe's "brain" — it initializes the runtime and
 * processes execution requests.
 */
import type { SandboxCommand, SandboxResponse, SerializedFile } from "./wasmerTypes";

// ── Runtime state ───────────────────────────────────────────

type RuntimeBackend = "wasmer" | "fallback";

let backend: RuntimeBackend = "fallback";
let wasmerReady = false;
let pyodideInstance: unknown = null;

/** In-memory file map used by both Wasmer and fallback paths. */
const mountedFiles: Map<string, string> = new Map();

// ── Helpers ─────────────────────────────────────────────────

function postToParent(msg: SandboxResponse): void {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage(msg, "*");
  }
}

function mountFiles(files: ReadonlyArray<SerializedFile>): void {
  for (const f of files) {
    mountedFiles.set(f.path, f.content);
  }
}

// ── Wasmer path ─────────────────────────────────────────────

async function initWasmer(): Promise<boolean> {
  try {
    const { init } = await import("@wasmer/sdk");
    await init();
    wasmerReady = true;
    backend = "wasmer";
    return true;
  } catch {
    console.warn("[sandbox] Wasmer SDK unavailable, using fallback");
    return false;
  }
}

async function runWithWasmer(
  id: string,
  command: string,
  args: string[],
): Promise<void> {
  const start = performance.now();
  try {
    const { Wasmer } = await import("@wasmer/sdk");

    // Map commands to Wasmer registry packages
    const packageMap: Record<string, string> = {
      python3: "python/python@3.12",
      python: "python/python@3.12",
      clang: "syrusakbary/clang",
      gcc: "syrusakbary/clang",
    };

    const packageName = packageMap[command];
    if (!packageName) {
      postToParent({ type: "error", id, message: `No Wasmer package for: ${command}` });
      postToParent({ type: "exit", id, code: 127, runtimeMs: performance.now() - start });
      return;
    }

    const pkg = await Wasmer.fromRegistry(packageName);
    const instance = await pkg.entrypoint!.run({ args });
    const result = await instance.wait();

    if (result.stdout) {
      postToParent({ type: "stdout", id, data: result.stdout });
    }
    if (result.stderr) {
      postToParent({ type: "stderr", id, data: result.stderr });
    }
    postToParent({ type: "exit", id, code: result.code, runtimeMs: performance.now() - start });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    postToParent({ type: "error", id, message: msg });
    postToParent({ type: "exit", id, code: 1, runtimeMs: performance.now() - start });
  }
}

// ── Fallback path: VFS builtins + Pyodide ───────────────────

async function loadPyodide(): Promise<unknown> {
  if (pyodideInstance) return pyodideInstance;
  // Pyodide is loaded from CDN via script tag in the sandbox page
  const pyodideModule = (globalThis as Record<string, unknown>)["loadPyodide"] as
    | (() => Promise<unknown>)
    | undefined;
  if (!pyodideModule) return null;
  pyodideInstance = await pyodideModule();
  return pyodideInstance;
}

function runBuiltin(
  id: string,
  command: string,
  args: string[],
): boolean {
  const start = performance.now();

  switch (command) {
    case "echo": {
      postToParent({ type: "stdout", id, data: args.join(" ") + "\n" });
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    case "cat": {
      if (args.length === 0) {
        postToParent({ type: "stderr", id, data: "cat: missing file operand\n" });
        postToParent({ type: "exit", id, code: 1, runtimeMs: performance.now() - start });
        return true;
      }
      for (const arg of args) {
        const resolved = arg.startsWith("/") ? arg : `/project/${arg}`;
        const content = mountedFiles.get(resolved);
        if (content === undefined) {
          postToParent({ type: "stderr", id, data: `cat: ${arg}: No such file\n` });
          postToParent({ type: "exit", id, code: 1, runtimeMs: performance.now() - start });
          return true;
        }
        postToParent({ type: "stdout", id, data: content.endsWith("\n") ? content : content + "\n" });
      }
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    case "ls": {
      const targetPath = args[0] ?? "/project";
      const resolved = targetPath.startsWith("/") ? targetPath : `/project/${targetPath}`;
      const prefix = resolved.endsWith("/") ? resolved : resolved + "/";
      const entries = new Set<string>();

      for (const path of mountedFiles.keys()) {
        if (path.startsWith(prefix)) {
          const relative = path.slice(prefix.length);
          const topLevel = relative.split("/")[0];
          if (topLevel) entries.add(topLevel);
        }
      }

      if (entries.size === 0) {
        // Check if path itself exists as a file
        if (mountedFiles.has(resolved)) {
          const name = resolved.split("/").pop() ?? resolved;
          postToParent({ type: "stdout", id, data: name + "\n" });
        }
        // Empty directory or doesn't exist — no output either way
      } else {
        const sorted = Array.from(entries).sort();
        postToParent({ type: "stdout", id, data: sorted.join("\n") + "\n" });
      }
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    case "mkdir": {
      // No-op in flat file map, but acknowledge
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    case "rm": {
      for (const arg of args) {
        if (arg.startsWith("-")) continue; // skip flags like -r, -f
        const resolved = arg.startsWith("/") ? arg : `/project/${arg}`;
        mountedFiles.delete(resolved);
        postToParent({ type: "fs-write", path: resolved, content: "" });
      }
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    case "pwd": {
      postToParent({ type: "stdout", id, data: "/project\n" });
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    case "clear": {
      postToParent({ type: "exit", id, code: 0, runtimeMs: performance.now() - start });
      return true;
    }

    default:
      return false;
  }
}

async function runFallbackPython(id: string, args: string[]): Promise<void> {
  const start = performance.now();
  try {
    const pyodide = await loadPyodide();
    if (!pyodide) {
      postToParent({ type: "error", id, message: "Pyodide not available in sandbox" });
      postToParent({ type: "exit", id, code: 1, runtimeMs: performance.now() - start });
      return;
    }

    // Type-safe Pyodide interface
    const py = pyodide as {
      FS: { writeFile: (path: string, content: string) => void };
      runPython: (code: string) => void;
      runPythonAsync: (code: string) => Promise<void>;
    };

    // Mount files into Pyodide FS
    for (const [path, content] of mountedFiles) {
      if (path.endsWith(".py")) {
        const pyPath = path.startsWith("/project") ? path.slice("/project".length) : path;
        try {
          py.FS.writeFile(pyPath, content);
        } catch {
          // Ignore mount errors for nested paths
        }
      }
    }

    // Determine what to run
    let code: string;
    if (args[0] === "-c" && args[1]) {
      code = args[1];
    } else {
      const filePath = args[0] ?? "";
      const resolved = filePath.startsWith("/") ? filePath : `/project/${filePath}`;
      const fileContent = mountedFiles.get(resolved);
      if (!fileContent) {
        postToParent({ type: "stderr", id, data: `python3: can't open file '${filePath}'\n` });
        postToParent({ type: "exit", id, code: 1, runtimeMs: performance.now() - start });
        return;
      }
      code = fileContent;
    }

    // Capture stdout/stderr
    const captureCode = `
import sys, io
__stdout = io.StringIO()
__stderr = io.StringIO()
sys.stdout = __stdout
sys.stderr = __stderr
try:
    exec(${JSON.stringify(code)})
except Exception as e:
    print(str(e), file=sys.stderr)
finally:
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
__result_out = __stdout.getvalue()
__result_err = __stderr.getvalue()
`;

    await py.runPythonAsync(captureCode);
    const stdout = String(py.runPython("__result_out") ?? "");
    const stderr = String(py.runPython("__result_err") ?? "");

    if (stdout) postToParent({ type: "stdout", id, data: stdout });
    if (stderr) postToParent({ type: "stderr", id, data: stderr });
    postToParent({
      type: "exit",
      id,
      code: stderr ? 1 : 0,
      runtimeMs: performance.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    postToParent({ type: "error", id, message: msg });
    postToParent({ type: "exit", id, code: 1, runtimeMs: performance.now() - start });
  }
}

// ── Command dispatcher ──────────────────────────────────────

async function handleCommand(cmd: SandboxCommand): Promise<void> {
  switch (cmd.type) {
    case "fs-sync": {
      mountFiles(cmd.files);
      return;
    }

    case "kill": {
      // TODO: implement cancellation for running processes
      return;
    }

    case "stdin": {
      // TODO: implement stdin forwarding
      return;
    }

    case "run": {
      const { id, command, args, files } = cmd;
      mountFiles(files);

      // Try builtins first
      if (runBuiltin(id, command, args)) return;

      // Use Wasmer if available
      if (backend === "wasmer" && wasmerReady) {
        await runWithWasmer(id, command, args);
        return;
      }

      // Fallback executors
      if (command === "python3" || command === "python") {
        await runFallbackPython(id, args);
        return;
      }

      // Unknown command
      postToParent({
        type: "error",
        id,
        message: `${command}: command not found (fallback mode)`,
      });
      postToParent({ type: "exit", id, code: 127, runtimeMs: 0 });
      return;
    }
  }
}

// ── Initialize ──────────────────────────────────────────────

async function initSandboxShell(): Promise<void> {
  // Try Wasmer first, fall back gracefully
  const wasmerOk = await initWasmer();
  if (!wasmerOk) {
    backend = "fallback";
  }

  // Listen for commands from parent
  window.addEventListener("message", (event: MessageEvent<SandboxCommand>) => {
    // Basic origin validation — accept same-origin messages
    if (event.source !== window.parent) return;

    const cmd = event.data;
    if (!cmd || typeof cmd !== "object" || !("type" in cmd)) return;

    void handleCommand(cmd);
  });

  postToParent({ type: "ready" });
}

export { initSandboxShell, handleCommand };
export type { RuntimeBackend };
