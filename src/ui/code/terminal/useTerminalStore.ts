/**
 * Zustand v5 store for terminal state.
 *
 * Manages the xterm.js Terminal instance ref, running state,
 * output writing, and command execution lifecycle.
 */
import { create } from "zustand";
import type { Terminal } from "@xterm/xterm";

type ShellMode = "command" | "interactive";

type TerminalStoreState = {
  isRunning: boolean;
  shellMode: ShellMode;
  terminalRef: Terminal | null;
  inputHandler: ((data: string) => void) | null;
  /** Abort controller for the currently running command. */
  abortController: AbortController | null;
};

type TerminalStoreActions = {
  setTerminal: (t: Terminal | null) => void;
  write: (data: string) => void;
  writeLn: (data: string) => void;
  clear: () => void;
  setInputHandler: (handler: ((data: string) => void) | null) => void;
  runCommand: (cmd: string) => Promise<void>;
  kill: () => void;
  setRunning: (running: boolean) => void;
  setAbortController: (ac: AbortController | null) => void;
};

const useTerminalStore = create<TerminalStoreState & TerminalStoreActions>()(
  (set, get) => ({
    isRunning: false,
    shellMode: "command",
    terminalRef: null,
    inputHandler: null,
    abortController: null,

    setTerminal: (t) => {
      set({ terminalRef: t });
    },

    write: (data) => {
      const { terminalRef } = get();
      terminalRef?.write(data);
    },

    writeLn: (data) => {
      const { terminalRef } = get();
      terminalRef?.writeln(data);
    },

    clear: () => {
      const { terminalRef } = get();
      terminalRef?.clear();
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
        if (!ac.signal.aborted) {
          const { terminalRef } = get();
          if (exitCode !== 0) {
            terminalRef?.writeln(
              `\x1b[31mProcess exited with code ${String(exitCode)}\x1b[0m`,
            );
          }
        }
      } catch (err) {
        if (!ac.signal.aborted) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          get().terminalRef?.writeln(`\x1b[31mError: ${msg}\x1b[0m`);
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
      const { terminalRef } = get();
      terminalRef?.writeln("\r\n\x1b[33m^C\x1b[0m");
    },
  }),
);

export { useTerminalStore };
export type { TerminalStoreState, TerminalStoreActions, ShellMode };
