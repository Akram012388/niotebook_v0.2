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

const TerminalPanel = (): ReactElement => (
  <div className="flex min-h-0 flex-1 flex-col bg-[#0f172a]">
    <TerminalToolbar />
    <XTermView />
  </div>
);

export default TerminalPanel;
export { TerminalPanel };
