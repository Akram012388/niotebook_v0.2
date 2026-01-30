"use client";

/**
 * TerminalToolbar — clear and kill buttons for the terminal panel.
 */
import type { ReactElement } from "react";
import { useTerminalStore } from "./useTerminalStore";

const TerminalToolbar = (): ReactElement => {
  const clear = useTerminalStore((s) => s.clear);
  const kill = useTerminalStore((s) => s.kill);
  const isRunning = useTerminalStore((s) => s.isRunning);

  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-1">
      <span className="text-xs font-medium text-text-muted">Terminal</span>
      <div className="flex items-center gap-1">
        {isRunning ? (
          <button
            type="button"
            onClick={kill}
            className="rounded px-2 py-0.5 text-xs text-red-400 transition hover:bg-red-500/10"
            aria-label="Kill running process"
          >
            Kill
          </button>
        ) : null}
        <button
          type="button"
          onClick={clear}
          className="rounded px-2 py-0.5 text-xs text-text-muted transition hover:bg-surface-muted hover:text-foreground"
          aria-label="Clear terminal"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export { TerminalToolbar };
