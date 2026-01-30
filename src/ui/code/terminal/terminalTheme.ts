/**
 * Niotebook terminal themes for xterm.js.
 */
import type { ITheme } from "@xterm/xterm";

const niotebookDarkTerminal: ITheme = {
  background: "#0f172a",
  foreground: "#e2e8f0",
  cursor: "#e2e8f0",
  selectionBackground: "#3b82f633",
  black: "#1e293b",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e2e8f0",
};

const niotebookLightTerminal: ITheme = {
  background: "#ffffff",
  foreground: "#0f172a",
  cursor: "#0f172a",
  selectionBackground: "#3b82f622",
  black: "#f8fafc",
  red: "#dc2626",
  green: "#059669",
  yellow: "#d97706",
  blue: "#2563eb",
  magenta: "#7c3aed",
  cyan: "#0891b2",
  white: "#0f172a",
};

export { niotebookDarkTerminal, niotebookLightTerminal };
