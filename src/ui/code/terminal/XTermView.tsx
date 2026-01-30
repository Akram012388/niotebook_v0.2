"use client";

/**
 * XTermView — React wrapper around xterm.js Terminal.
 *
 * This file must ONLY be reached via dynamic import (SSR-unsafe).
 * FitAddon for auto-resize, WebLinksAddon for clickable URLs.
 * ResizeObserver → fitAddon.fit().
 * Internal scroll via xterm.js scrollback (1000 lines).
 */
import { useEffect, useRef, type ReactElement } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

import { useTerminalStore } from "./useTerminalStore";
import { niotebookDarkTerminal } from "./terminalTheme";

const PROMPT = "\x1b[32m$ \x1b[0m";

function getTerminalTheme(): import("@xterm/xterm").ITheme {
  return niotebookDarkTerminal;
}

const XTermView = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef("");

  const setTerminal = useTerminalStore((s) => s.setTerminal);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const terminal = new Terminal({
      scrollback: 1000,
      fontSize: 12,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: getTerminalTheme(),
      cursorBlink: true,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(container);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    setTerminal(terminal);

    // Welcome message
    terminal.writeln("Niotebook Terminal v0.1");
    terminal.writeln(
      "Type a command: python3 main.py, node main.js, ls, cat, echo, clear",
    );
    terminal.write(PROMPT);

    // Handle user input
    const onDataDisposable = terminal.onData((data) => {
      const store = useTerminalStore.getState();

      // If a custom input handler is set (e.g., for interactive stdin), use it
      if (store.inputHandler) {
        store.inputHandler(data);
        return;
      }

      // If running, ignore input (no stdin piping yet)
      if (store.isRunning) return;

      const code = data.charCodeAt(0);

      if (data === "\r" || data === "\n") {
        // Enter — execute command
        terminal.writeln("");
        const cmd = inputBufferRef.current.trim();
        inputBufferRef.current = "";

        if (cmd.length > 0) {
          void store.runCommand(cmd).then(() => {
            terminal.write(PROMPT);
          });
        } else {
          terminal.write(PROMPT);
        }
      } else if (code === 127 || data === "\b") {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          terminal.write("\b \b");
        }
      } else if (code === 3) {
        // Ctrl+C
        if (store.isRunning) {
          store.kill();
        } else {
          inputBufferRef.current = "";
          terminal.writeln("^C");
          terminal.write(PROMPT);
        }
      } else if (code >= 32) {
        // Printable characters
        inputBufferRef.current += data;
        terminal.write(data);
      }
    });

    // ResizeObserver → fit
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // Terminal may be disposed
      }
    });
    resizeObserver.observe(container);

    // Window resize → fit
    const onWindowResize = (): void => {
      try {
        fitAddon.fit();
      } catch {
        // Terminal may be disposed
      }
    };
    window.addEventListener("resize", onWindowResize);

    return () => {
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onWindowResize);
      setTerminal(null);
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [setTerminal]);

  return <div ref={containerRef} className="h-full w-full" />;
};

export default XTermView;
export { XTermView };
