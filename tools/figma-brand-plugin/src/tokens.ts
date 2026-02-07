// ---------------------------------------------------------------------------
// Niotebook v2 Design Tokens
// Single source of truth — derived from src/app/globals.css
// ---------------------------------------------------------------------------

/** RGBA color value (all channels 0-1 range, matching Figma's format). */
export interface TokenRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A semantic color token with light + dark mode values. */
export interface ColorToken {
  /** Variable name in Figma (e.g. "background", "accent") */
  name: string;
  /** Group path for Figma Variable grouping (e.g. "backgrounds") */
  group: string;
  /** Description shown in Figma inspector */
  description: string;
  /** Light mode value */
  light: TokenRGBA;
  /** Dark mode value */
  dark: TokenRGBA;
}

/** A size token (FLOAT) with a single numeric value. */
export interface SizeToken {
  name: string;
  group: string;
  description: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Convert #RRGGBB hex to Figma RGBA (alpha = 1). */
export function parseHex(hex: string): TokenRGBA {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1,
  };
}

/** Convert CSS rgba(R, G, B, A) string to Figma RGBA. */
export function parseRgba(css: string): TokenRGBA {
  const match = css.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/,
  );
  if (!match) throw new Error(`Cannot parse RGBA: ${css}`);
  return {
    r: parseFloat(match[1]) / 255,
    g: parseFloat(match[2]) / 255,
    b: parseFloat(match[3]) / 255,
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/** Shorthand: create RGBA from hex. */
const h = parseHex;
/** Shorthand: create RGBA from CSS rgba(). */
const r = parseRgba;

// ---------------------------------------------------------------------------
// Color tokens — light + dark mode values
// ---------------------------------------------------------------------------

export const COLOR_TOKENS: ColorToken[] = [
  // ── Backgrounds ──
  {
    name: "background",
    group: "backgrounds",
    description: "Page background",
    light: h("#f4f3ee"),
    dark: h("#1c1917"),
  },
  {
    name: "foreground",
    group: "backgrounds",
    description: "Primary text / icon color",
    light: h("#1c1917"),
    dark: h("#f4f3ee"),
  },
  {
    name: "surface",
    group: "backgrounds",
    description: "Card / panel surface",
    light: h("#faf9f7"),
    dark: h("#252220"),
  },
  {
    name: "surface-muted",
    group: "backgrounds",
    description: "Muted surface (inputs, code blocks)",
    light: h("#edeae4"),
    dark: h("#2e2a27"),
  },
  {
    name: "surface-strong",
    group: "backgrounds",
    description: "High-contrast surface",
    light: h("#1c1917"),
    dark: h("#141210"),
  },
  {
    name: "surface-strong-foreground",
    group: "backgrounds",
    description: "Text on surface-strong",
    light: h("#f4f3ee"),
    dark: h("#f4f3ee"),
  },

  // ── Borders ──
  {
    name: "border",
    group: "borders",
    description: "Default border",
    light: h("#ddd8d0"),
    dark: h("#3a3531"),
  },
  {
    name: "border-muted",
    group: "borders",
    description: "Subtle border / divider",
    light: h("#edeae4"),
    dark: h("#2e2a27"),
  },

  // ── Text ──
  {
    name: "text-muted",
    group: "text",
    description: "Secondary text",
    light: h("#78716c"),
    dark: h("#a8a29e"),
  },
  {
    name: "text-subtle",
    group: "text",
    description: "Tertiary / hint text",
    light: h("#a8a29e"),
    dark: h("#78716c"),
  },

  // ── Accent (Claude terracotta) ──
  {
    name: "accent",
    group: "accent",
    description: "Primary accent — CTAs, active states",
    light: h("#c15f3c"),
    dark: h("#da7756"),
  },
  {
    name: "accent-foreground",
    group: "accent",
    description: "Text on accent background",
    light: h("#ffffff"),
    dark: h("#1c1917"),
  },
  {
    name: "accent-muted",
    group: "accent",
    description: "Accent tint (hover bg, selection)",
    light: r("rgba(193, 95, 60, 0.1)"),
    dark: r("rgba(218, 119, 86, 0.15)"),
  },
  {
    name: "accent-border",
    group: "accent",
    description: "Accent-tinted border",
    light: r("rgba(193, 95, 60, 0.25)"),
    dark: r("rgba(218, 119, 86, 0.3)"),
  },
  {
    name: "accent-hover",
    group: "accent",
    description: "Accent hover / pressed state",
    light: h("#a8512f"),
    dark: h("#e8906e"),
  },

  // ── Status ──
  {
    name: "status-success",
    group: "status",
    description: "Success green",
    light: h("#5a8a5e"),
    dark: h("#6da072"),
  },
  {
    name: "status-warning",
    group: "status",
    description: "Warning amber",
    light: h("#b5882c"),
    dark: h("#d4a748"),
  },
  {
    name: "status-error",
    group: "status",
    description: "Error red",
    light: h("#c24b3a"),
    dark: h("#e06b5a"),
  },
  {
    name: "status-info",
    group: "status",
    description: "Info blue",
    light: h("#5b7fa5"),
    dark: h("#7a9fc0"),
  },

  // ── Workspace (always dark) ──
  {
    name: "workspace-editor",
    group: "workspace",
    description: "Editor / sidebar / terminal background",
    light: h("#1c1917"),
    dark: h("#1c1917"),
  },
  {
    name: "workspace-sidebar",
    group: "workspace",
    description: "Workspace sidebar background",
    light: h("#1c1917"),
    dark: h("#1c1917"),
  },
  {
    name: "workspace-terminal",
    group: "workspace",
    description: "Terminal background",
    light: h("#1c1917"),
    dark: h("#1c1917"),
  },
  {
    name: "workspace-tabbar",
    group: "workspace",
    description: "Tab bar background",
    light: h("#252220"),
    dark: h("#252220"),
  },
  {
    name: "workspace-border",
    group: "workspace",
    description: "Workspace border",
    light: h("#3a3531"),
    dark: h("#3a3531"),
  },
  {
    name: "workspace-border-muted",
    group: "workspace",
    description: "Workspace subtle border",
    light: h("#2e2a27"),
    dark: h("#2e2a27"),
  },
  {
    name: "workspace-text",
    group: "workspace",
    description: "Workspace primary text",
    light: h("#f4f3ee"),
    dark: h("#f4f3ee"),
  },
  {
    name: "workspace-text-muted",
    group: "workspace",
    description: "Workspace secondary text",
    light: h("#a8a29e"),
    dark: h("#a8a29e"),
  },
  {
    name: "workspace-accent",
    group: "workspace",
    description: "Workspace accent",
    light: h("#c15f3c"),
    dark: h("#da7756"),
  },
  {
    name: "workspace-accent-muted",
    group: "workspace",
    description: "Workspace accent tint",
    light: r("rgba(193, 95, 60, 0.18)"),
    dark: r("rgba(218, 119, 86, 0.18)"),
  },
];

// ---------------------------------------------------------------------------
// Size tokens (border-radius)
// ---------------------------------------------------------------------------

export const SIZE_TOKENS: SizeToken[] = [
  {
    name: "radius-sm",
    group: "radius",
    description: "Small radius (6px)",
    value: 6,
  },
  {
    name: "radius-md",
    group: "radius",
    description: "Medium radius (8px)",
    value: 8,
  },
  {
    name: "radius-lg",
    group: "radius",
    description: "Large radius (12px)",
    value: 12,
  },
  {
    name: "radius-xl",
    group: "radius",
    description: "Extra-large radius (16px)",
    value: 16,
  },
  {
    name: "radius-full",
    group: "radius",
    description: "Full / pill radius (9999px)",
    value: 9999,
  },
];
