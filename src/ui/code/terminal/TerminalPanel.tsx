"use client";

/**
 * TerminalPanel — composes TerminalToolbar + XTermView.
 *
 * This component must be loaded via `next/dynamic({ ssr: false })`.
 * xterm.js and its CSS are imported transitively through XTermView.
 */
import type { ReactElement } from "react";
import { TerminalToolbar } from "./TerminalToolbar";
import { XTermView } from "./XTermView";

type TerminalPanelProps = {
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  isRunning: boolean;
  hint: string;
};

const TerminalPanel = ({
  onRun,
  onStop,
  onClear,
  isRunning,
  hint,
}: TerminalPanelProps): ReactElement => (
  <div className="flex min-h-0 flex-1 flex-col bg-workspace-terminal text-workspace-text">
    <TerminalToolbar
      onRun={onRun}
      onStop={onStop}
      onClear={onClear}
      isRunning={isRunning}
    />
    <div
      id="niotebook-runtime-frame"
      className="h-48 border-b border-workspace-border bg-workspace-editor"
    />
    <div className="min-h-0 flex-1 overflow-hidden p-4">
      <XTermView hint={hint} />
    </div>
  </div>
);

export default TerminalPanel;
export { TerminalPanel };
export type { TerminalPanelProps };
