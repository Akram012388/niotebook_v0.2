/**
 * commandRouter — parses terminal input and routes to executors or VFS builtins.
 *
 * Supports: python3, node, gcc, cat, ls, echo, clear
 * cat/ls/echo work via VFS directly.
 * python3/node/gcc delegate to existing runtime executors.
 */
import { useFileSystemStore } from "../../../infra/vfs/useFileSystemStore";
import { runRuntime } from "../../../infra/runtime/runtimeManager";
import type { RuntimeLanguage } from "../../../infra/runtime/types";
import type { TerminalStoreState, TerminalStoreActions } from "./useTerminalStore";

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

const LANGUAGE_MAP: Record<string, RuntimeLanguage> = {
  python3: "python",
  python: "python",
  node: "js",
  gcc: "c",
};

async function routeCommand(
  cmd: ParsedCommand,
  terminal: TerminalContext,
): Promise<number> {
  const { executable, args } = cmd;

  // ── Builtins ──────────────────────────────────────────────

  if (executable === "clear") {
    terminal.clear();
    return 0;
  }

  if (executable === "echo") {
    terminal.writeLn(args.join(" "));
    return 0;
  }

  if (executable === "ls") {
    const vfs = useFileSystemStore.getState().vfs;
    const targetPath = args[0] ?? "/project";
    const resolved = targetPath.startsWith("/") ? targetPath : `/project/${targetPath}`;
    const nodes = vfs.readDir(resolved);
    if (!nodes) {
      terminal.writeLn(`\x1b[31mls: cannot access '${resolved}': No such directory\x1b[0m`);
      return 1;
    }
    for (const node of nodes) {
      if (node.kind === "directory") {
        terminal.writeLn(`\x1b[34m${node.name}/\x1b[0m`);
      } else {
        terminal.writeLn(node.name);
      }
    }
    return 0;
  }

  if (executable === "cat") {
    const vfs = useFileSystemStore.getState().vfs;
    if (args.length === 0) {
      terminal.writeLn("\x1b[31mcat: missing file operand\x1b[0m");
      return 1;
    }
    for (const arg of args) {
      const resolved = arg.startsWith("/") ? arg : `/project/${arg}`;
      const content = vfs.readFile(resolved);
      if (content === null) {
        terminal.writeLn(`\x1b[31mcat: ${arg}: No such file\x1b[0m`);
        return 1;
      }
      terminal.write(content);
      if (!content.endsWith("\n")) {
        terminal.writeLn("");
      }
    }
    return 0;
  }

  // ── Runtime executors ─────────────────────────────────────

  const language = LANGUAGE_MAP[executable];
  if (language) {
    const vfs = useFileSystemStore.getState().vfs;

    let code: string;
    if (language === "c" && executable === "gcc") {
      // gcc expects file args
      if (args.length === 0) {
        terminal.writeLn("\x1b[31mgcc: no input files\x1b[0m");
        return 1;
      }
      const filePath = args[0] ?? "";
      const resolved = filePath.startsWith("/") ? filePath : `/project/${filePath}`;
      const fileContent = vfs.readFile(resolved);
      if (fileContent === null) {
        terminal.writeLn(`\x1b[31mgcc: ${filePath}: No such file\x1b[0m`);
        return 1;
      }
      code = fileContent;
    } else {
      // python3/node expect file args or inline
      if (args.length === 0) {
        terminal.writeLn(`\x1b[31m${executable}: missing file argument\x1b[0m`);
        return 1;
      }
      const filePath = args[0] ?? "";
      const resolved = filePath.startsWith("/") ? filePath : `/project/${filePath}`;
      const fileContent = vfs.readFile(resolved);
      if (fileContent === null) {
        terminal.writeLn(`\x1b[31m${executable}: can't open file '${filePath}'\x1b[0m`);
        return 1;
      }
      code = fileContent;
    }

    const result = await runRuntime(language, {
      code,
      timeoutMs: 10_000,
      filesystem: vfs,
      onStdout: (chunk) => terminal.write(chunk),
      onStderr: (chunk) => terminal.write(`\x1b[31m${chunk}\x1b[0m`),
    });

    // If no streaming callbacks were used, write buffered output
    if (result.stdout && !result.stdout.startsWith("\x00__streamed__")) {
      terminal.write(result.stdout);
    }
    if (result.stderr && !result.stderr.startsWith("\x00__streamed__")) {
      terminal.write(`\x1b[31m${result.stderr}\x1b[0m`);
    }

    return result.exitCode;
  }

  // ── Unknown command ───────────────────────────────────────
  terminal.writeLn(`\x1b[31m${executable}: command not found\x1b[0m`);
  return 127;
}

export { parseCommand, routeCommand };
export type { ParsedCommand };
