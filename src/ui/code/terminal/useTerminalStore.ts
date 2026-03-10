/**
 * Zustand v5 store for terminal state.
 *
 * Manages the xterm.js Terminal instance ref, running state,
 * output writing, and command execution lifecycle.
 */
import { create } from "zustand";
import { TERMINAL_PROMPT } from "./terminalPrompt";
import type { Terminal } from "@xterm/xterm";

type ShellMode = "command" | "interactive" | "shell";

type TerminalStoreState = {
  isRunning: boolean;
  shellMode: ShellMode;
  terminalRef: Terminal | null;
  inputHandler: ((data: string) => void) | null;
  /** Abort controller for the currently running command. */
  abortController: AbortController | null;
  /** Last error message from a failed code run (for AI context). */
  lastRunError: string | null;
  /** Whether the last output chunk ended with a newline character. */
  lastOutputEndedWithNewline: boolean;
  /** Whether any output has been written since the last prompt. */
  hasOutputSincePrompt: boolean;
};

type TerminalStoreActions = {
  setTerminal: (t: Terminal | null) => void;
  write: (data: string) => void;
  writeLn: (data: string) => void;
  writePrompt: () => void;
  clear: (options?: { withPrompt?: boolean }) => void;
  setInputHandler: (handler: ((data: string) => void) | null) => void;
  runCommand: (cmd: string) => Promise<void>;
  kill: () => void;
  setRunning: (running: boolean) => void;
  setAbortController: (ac: AbortController | null) => void;
  setLastRunError: (error: string | null) => void;
};

const useTerminalStore = create<TerminalStoreState & TerminalStoreActions>()(
  (set, get) => ({
    isRunning: false,
    shellMode: "command",
    terminalRef: null,
    inputHandler: null,
    abortController: null,
    lastRunError: null,
    lastOutputEndedWithNewline: true,
    hasOutputSincePrompt: false,

    setTerminal: (t) => {
      set({ terminalRef: t });
    },

    write: (data) => {
      const { terminalRef } = get();
      if (!terminalRef) return;
      if (!terminalRef.element) return;
      try {
        terminalRef.write(data);
        if (data) {
          set({
            hasOutputSincePrompt: true,
            lastOutputEndedWithNewline: /\r?\n$/.test(data),
          });
        }
      } catch {
        return;
      }
    },

    writeLn: (data) => {
      const { terminalRef } = get();
      if (!terminalRef) return;
      if (!terminalRef.element) return;
      try {
        terminalRef.writeln(data);
        // writeln() always appends a newline, so track unconditionally
        // (unlike write(), where empty data means nothing was written).
        set({
          hasOutputSincePrompt: true,
          lastOutputEndedWithNewline: true,
        });
      } catch {
        return;
      }
    },

    writePrompt: () => {
      const { terminalRef } = get();
      if (!terminalRef) return;
      if (!terminalRef.element) return;
      try {
        const state = get();
        if (state.hasOutputSincePrompt && !state.lastOutputEndedWithNewline) {
          terminalRef.write("\r\n");
        }
        terminalRef.write("\x1b[2K\r");
        terminalRef.write(TERMINAL_PROMPT);
        set({ hasOutputSincePrompt: false, lastOutputEndedWithNewline: false });
      } catch {
        return;
      }
    },

    clear: (options) => {
      const { terminalRef } = get();
      if (!terminalRef) return;
      try {
        terminalRef.clear();
      } catch {
        return;
      }
      set({ hasOutputSincePrompt: false, lastOutputEndedWithNewline: true });
      if (options?.withPrompt) {
        get().writePrompt();
      }
    },

    setInputHandler: (handler) => {
      set({ inputHandler: handler });
    },

    setRunning: (running) => {
      set({ isRunning: running });
    },

    setAbortController: (ac) => {
      set({ abortController: ac });
    },

    setLastRunError: (error) => {
      set({ lastRunError: error });
    },

    runCommand: async (cmd) => {
      const state = get();
      if (state.isRunning) return;

      // Lazy-import commandRouter to avoid pulling runtime deps into the store module
      const { routeCommand, parseCommand } = await import("./commandRouter");
      const parsed = parseCommand(cmd);

      const ac = new AbortController();
      set({ isRunning: true, abortController: ac });

      try {
        const exitCode = await routeCommand(parsed, get());
        if (!ac.signal.aborted && exitCode !== 0) {
          get().writeLn(
            `\x1b[31mProcess exited with code ${String(exitCode)}\x1b[0m`,
          );
        }
      } catch (err) {
        if (!ac.signal.aborted) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          get().writeLn(`\x1b[31mError: ${msg}\x1b[0m`);
        }
      } finally {
        set({ isRunning: false, abortController: null });
      }
    },

    kill: () => {
      const { abortController } = get();
      if (abortController) {
        abortController.abort();
      }
      set({ isRunning: false, abortController: null });
      get().writeLn("\r\n\x1b[33m^C\x1b[0m");

      // TODO: JS execution runs on the main thread and cannot be truly
      // interrupted mid-execution. The AbortController above prevents
      // post-execution callbacks but doesn't halt the computation.
      // For true interruptibility, JS should run in a Web Worker.
      //
      // Pyodide timeout cancellation is now wired via interruptBuffer in
      // pythonExecutor.ts, but this kill() path does not yet signal it
      // directly — only the timeout handler does.
    },
  }),
);

export { useTerminalStore };
export type { TerminalStoreState, TerminalStoreActions, ShellMode };
