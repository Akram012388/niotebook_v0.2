"use client";

/**
 * TerminalToolbar — run, stop, and clear actions for the terminal panel.
 */
import type { ReactElement } from "react";

type TerminalToolbarProps = {
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
};

const TerminalToolbar = ({
  onRun,
  onStop,
  onClear,
}: TerminalToolbarProps): ReactElement => (
  <div className="flex items-center justify-between border-b border-workspace-border px-4 py-2">
    <span className="text-xs font-medium text-workspace-text-muted">
      Terminal
    </span>
    <div className="flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={onRun}
        className="text-workspace-text-muted transition hover:text-workspace-text"
        aria-label="Run code"
      >
        Run
      </button>
      <button
        type="button"
        onClick={onStop}
        className="text-workspace-text-muted transition hover:text-workspace-text"
        aria-label="Stop running code"
      >
        Stop
      </button>
      <button
        type="button"
        onClick={onClear}
        className="text-workspace-text-muted transition hover:text-workspace-text"
        aria-label="Clear terminal"
      >
        Clear
      </button>
    </div>
  </div>
);

export { TerminalToolbar };
export type { TerminalToolbarProps };
