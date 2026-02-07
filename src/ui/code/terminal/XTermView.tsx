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

function getTerminalTheme(): import("@xterm/xterm").ITheme {
  return niotebookDarkTerminal;
}

const XTermView = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef("");
  const promptPendingRef = useRef(false);

  const setTerminal = useTerminalStore((s) => s.setTerminal);
  const writePrompt = useTerminalStore((s) => s.writePrompt);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let onDataDisposable: { dispose: () => void } | null = null;

    const safeFit = (): void => {
      const currentTerminal = terminalRef.current;
      const currentFit = fitAddonRef.current;
      const currentContainer = containerRef.current;
      if (!currentTerminal || !currentFit || !currentContainer) return;
      if (!currentTerminal.element) return;
      const rect = currentContainer.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      try {
        currentFit.fit();
      } catch {
        return;
      }
    };

    const ensureTerminal = (): void => {
      if (disposed) return;
      const currentContainer = containerRef.current;
      if (!currentContainer) return;
      const rect = currentContainer.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (!terminalRef.current) {
        const terminal = new Terminal({
          scrollback: 1000,
          fontSize: 12,
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          theme: getTerminalTheme(),
          cursorBlink: true,
          convertEol: true,
          allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        terminal.open(currentContainer);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;
        setTerminal(terminal);

        writePrompt();

        // Handle user input
        onDataDisposable = terminal.onData((data) => {
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
            store.writeLn("");
            const cmd = inputBufferRef.current.trim();
            inputBufferRef.current = "";
            promptPendingRef.current = true;

            if (cmd.length > 0) {
              void store.runCommand(cmd).then(() => {
                if (!promptPendingRef.current) return;
                store.writePrompt();
                promptPendingRef.current = false;
              });
            } else {
              if (!promptPendingRef.current) return;
              store.writePrompt();
              promptPendingRef.current = false;
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
              store.writeLn("^C");
              store.writePrompt();
            }
          } else if (code >= 32) {
            // Printable characters
            inputBufferRef.current += data;
            terminal.write(data);
          }
        });
      }

      safeFit();
    };

    const resizeObserver = new ResizeObserver(() => {
      ensureTerminal();
    });
    resizeObserver.observe(container);

    const onWindowResize = (): void => {
      ensureTerminal();
    };
    window.addEventListener("resize", onWindowResize);

    requestAnimationFrame(() => {
      ensureTerminal();
    });

    return () => {
      disposed = true;
      onDataDisposable?.dispose();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onWindowResize);
      setTerminal(null);
      if (terminalRef.current) {
        terminalRef.current.dispose();
      }
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [setTerminal, writePrompt]);

  return (
    <div ref={containerRef} className="h-full w-full" style={{ background: "#0A0A0A" }} />
  );
};

export default XTermView;
export { XTermView };
