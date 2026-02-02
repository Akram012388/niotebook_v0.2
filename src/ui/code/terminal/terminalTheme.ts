/**
 * Niotebook terminal themes for xterm.js.
 *
 * Chrome colors use brand tokens; ANSI syntax colors stay standard.
 */
import type { ITheme } from "@xterm/xterm";

const niotebookDarkTerminal: ITheme = {
  background: "#0A0A0A",
  foreground: "#FAFAFA",
  cursor: "#FAFAFA",
  selectionBackground: "#404040",
  black: "#0A0A0A",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#FAFAFA",
};

const niotebookLightTerminal: ITheme = {
  background: "#0A0A0A",
  foreground: "#FAFAFA",
  cursor: "#FAFAFA",
  selectionBackground: "#404040",
  black: "#0A0A0A",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#ca8a04",
  blue: "#2563eb",
  magenta: "#9333ea",
  cyan: "#0891b2",
  white: "#FAFAFA",
};

export { niotebookDarkTerminal, niotebookLightTerminal };
