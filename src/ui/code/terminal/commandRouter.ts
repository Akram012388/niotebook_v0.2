/**
 * commandRouter — parses terminal input and routes to executors or VFS builtins.
 *
 * Routing priority:
 * 1. Local builtins (clear, echo, ls, cat, pwd, mkdir, rm) — instant, no sandbox needed
 * 2. Sandbox bridge (Wasmer or fallback) — for python3, gcc, and other heavy commands
 * 3. Direct runtime executors — fallback when sandbox is unavailable
 */
import { useFileSystemStore } from "../../../infra/vfs/useFileSystemStore";
import { runRuntime } from "../../../infra/runtime/runtimeManager";
import { getWasmerBridge } from "../../../infra/runtime/wasmer/WasmerBridge";
import type { RuntimeLanguage } from "../../../infra/runtime/types";
import type {
  TerminalStoreState,
  TerminalStoreActions,
} from "./useTerminalStore";
import {
  runEcho,
  runPwd,
  runCatVFS,
  runLsVFS,
  runMkdirVFS,
  runRmVFS,
} from "../../../infra/runtime/builtins/vfsBuiltins";

type ParsedCommand = {
  executable: string;
  args: string[];
  raw: string;
};

function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const executable = parts[0] ?? "";
  const args = parts.slice(1);
  return { executable, args, raw: trimmed };
}

type TerminalContext = TerminalStoreState & TerminalStoreActions;

const ERROR_PREFIX = "\x1b[31m[err]\x1b[0m ";

function formatErrorChunk(chunk: string): string {
  const lines = chunk.split("\n");
  return lines
    .map((line, index) => {
      if (line.length === 0 && index === lines.length - 1) {
        return "";
      }
      return ERROR_PREFIX + line;
    })
    .join("\n");
}

const LANGUAGE_MAP: Record<string, RuntimeLanguage> = {
  python3: "python",
  python: "python",
  node: "js",
  gcc: "c",
};

/** Commands that the sandbox bridge can handle. */
const SANDBOX_COMMANDS = new Set([
  "python3",
  "python",
  "gcc",
  "clang",
  "cat",
  "ls",
  "echo",
  "mkdir",
  "rm",
  "pwd",
]);

/**
 * Try routing through the sandbox iframe bridge.
 * Returns null if sandbox is not available (caller should fall back).
 */
async function tryRouteThroughSandbox(
  cmd: ParsedCommand,
  terminal: TerminalContext,
): Promise<number | null> {
  if (!SANDBOX_COMMANDS.has(cmd.executable)) return null;

  const bridge = getWasmerBridge();
  if (bridge.getStatus() !== "ready") {
    // Try to initialize the bridge on first use
    if (bridge.getStatus() === "idle") {
      try {
        await bridge.init();
      } catch {
        return null; // Sandbox failed to load, fall back
      }
    } else {
      return null;
    }
  }

  const vfs = useFileSystemStore.getState().vfs;

  // Set up fs-write handler to sync changes back to VFS
  bridge.setFsWriteHandler((path, content) => {
    vfs.writeFile(path, content);
  });

  // Set up fs-delete handler to sync deletions back to VFS
  bridge.setFsDeleteHandler((path) => {
    if (vfs.exists(path)) {
      vfs.delete(path);
    }
  });

  try {
    const result = await bridge.sendCommand(cmd.executable, cmd.args, vfs, {
      onStdout: (chunk) => terminal.write(chunk),
      onStderr: (chunk) => terminal.write(formatErrorChunk(chunk)),
      timeoutMs: 30_000,
    });

    // Write remaining buffered output not already streamed
    if (result.stdout && !result.stdout.includes("\x00")) {
      // Output was already streamed via callbacks — no duplicate write needed
    }

    return result.exitCode;
  } catch {
    return null; // Bridge error, fall back
  }
}

async function routeCommand(
  cmd: ParsedCommand,
  terminal: TerminalContext,
): Promise<number> {
  const { executable, args } = cmd;

  // ── Builtins (always local, no sandbox needed) ────────────

  if (executable === "clear") {
    terminal.clear();
    return 0;
  }

  if (executable === "echo") {
    const io = {
      stdout: (d: string) => terminal.write(d),
      stderr: (d: string) => terminal.write(formatErrorChunk(d)),
    };
    return runEcho(args, io);
  }

  if (executable === "pwd") {
    const io = {
      stdout: (d: string) => terminal.write(d),
      stderr: (d: string) => terminal.write(formatErrorChunk(d)),
    };
    return runPwd(io);
  }

  if (executable === "ls") {
    const vfs = useFileSystemStore.getState().vfs;
    const io = {
      stdout: (d: string) => terminal.write(d),
      stderr: (d: string) => terminal.write(formatErrorChunk(d)),
    };
    return runLsVFS(args, vfs, io);
  }

  if (executable === "cat") {
    const vfs = useFileSystemStore.getState().vfs;
    const io = {
      stdout: (d: string) => terminal.write(d),
      stderr: (d: string) => terminal.write(formatErrorChunk(d)),
    };
    return runCatVFS(args, vfs, io);
  }

  if (executable === "mkdir") {
    const vfs = useFileSystemStore.getState().vfs;
    return runMkdirVFS(args, vfs);
  }

  if (executable === "rm") {
    const vfs = useFileSystemStore.getState().vfs;
    const io = {
      stdout: (d: string) => terminal.write(d),
      stderr: (d: string) => terminal.write(formatErrorChunk(d)),
    };
    return runRmVFS(args, vfs, io);
  }

  // ── Try sandbox bridge for runtime commands ───────────────

  const sandboxResult = await tryRouteThroughSandbox(cmd, terminal);
  if (sandboxResult !== null) {
    return sandboxResult;
  }

  // ── Fallback: direct runtime executors ────────────────────

  const language = LANGUAGE_MAP[executable];
  if (language) {
    const vfs = useFileSystemStore.getState().vfs;

    let code: string;
    if (language === "c" && executable === "gcc") {
      if (args.length === 0) {
        terminal.writeLn(formatErrorChunk("gcc: no input files"));
        return 1;
      }
      const filePath = args[0] ?? "";
      const resolved = filePath.startsWith("/")
        ? filePath
        : `/project/${filePath}`;
      const fileContent = vfs.readFile(resolved);
      if (fileContent === null) {
        terminal.writeLn(formatErrorChunk(`gcc: ${filePath}: No such file`));
        return 1;
      }
      code = fileContent;
    } else {
      if (args.length === 0) {
        terminal.writeLn(
          formatErrorChunk(`${executable}: missing file argument`),
        );
        return 1;
      }
      const filePath = args[0] ?? "";
      const resolved = filePath.startsWith("/")
        ? filePath
        : `/project/${filePath}`;
      const fileContent = vfs.readFile(resolved);
      if (fileContent === null) {
        terminal.writeLn(
          formatErrorChunk(`${executable}: can't open file '${filePath}'`),
        );
        return 1;
      }
      code = fileContent;
    }

    const result = await runRuntime(language, {
      code,
      timeoutMs: 10_000,
      filesystem: vfs,
      onStdout: (chunk) => terminal.write(chunk),
      onStderr: (chunk) => terminal.write(formatErrorChunk(chunk)),
    });

    if (result.stdout && !result.stdout.startsWith("\x00__streamed__")) {
      terminal.write(result.stdout);
    }
    if (result.stderr && !result.stderr.startsWith("\x00__streamed__")) {
      terminal.write(formatErrorChunk(result.stderr));
    }

    return result.exitCode;
  }

  // ── Unknown command ───────────────────────────────────────
  terminal.writeLn(formatErrorChunk(`${executable}: command not found`));
  return 127;
}

export { parseCommand, routeCommand };
export type { ParsedCommand };
