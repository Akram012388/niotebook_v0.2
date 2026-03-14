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
  actionsDisabled: boolean;
};

const TerminalPanel = ({
  onRun,
  onStop,
  onClear,
  isRunning,
  actionsDisabled,
}: TerminalPanelProps): ReactElement => (
  <div className="flex min-h-0 h-full flex-1 flex-col bg-workspace-terminal text-workspace-text">
    <TerminalToolbar
      onRun={onRun}
      onStop={onStop}
      onClear={onClear}
      isRunning={isRunning}
      actionsDisabled={actionsDisabled}
    />
    <div id="niotebook-runtime-frame" className="h-48" />
    {/* relative + overflow-hidden container with absolute-inset child
         gives xterm.js v6 a pixel-exact bounding box for FitAddon.fit()
         and its overlay scrollbar. Without this, the flex chain can leave
         the .xterm element with no resolved height, breaking scroll. */}
    <div
      className="relative min-h-0 flex-1 overflow-hidden"
      style={{ background: "#0A0A0A" }}
    >
      <div className="absolute inset-0 p-2">
        <XTermView />
      </div>
    </div>
  </div>
);

export default TerminalPanel;
export { TerminalPanel };
export type { TerminalPanelProps };
