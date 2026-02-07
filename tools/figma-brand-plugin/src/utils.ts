// ---------------------------------------------------------------------------
// Shared helpers for the Niotebook brand plugin (v2 -- clean wordmark)
// ---------------------------------------------------------------------------

/** Convert hex (#RRGGBB) to Figma RGB (0-1 range). */
export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

/** Convert hex (#RRGGBB) to Figma RGBA (0-1 range, alpha = 1). */
export function hexToRgba(hex: string): RGBA {
  return { ...hexToRgb(hex), a: 1 };
}

/** Solid fill paint from hex. */
export function solidPaint(hex: string): SolidPaint {
  return { type: "SOLID", color: hexToRgb(hex) };
}

// ---------------------------------------------------------------------------
// Brand tokens (v2 -- warm terracotta palette)
// ---------------------------------------------------------------------------

export const COLORS = {
  // Light theme backgrounds
  background: "#f4f3ee",
  foreground: "#1c1917",
  surface: "#faf9f7",
  surfaceMuted: "#edeae4",
  surfaceStrong: "#1c1917",
  surfaceStrongFg: "#f4f3ee",
  // Borders
  border: "#ddd8d0",
  borderMuted: "#edeae4",
  // Text
  textMuted: "#78716c",
  textSubtle: "#a8a29e",
  // Accent (Claude terracotta)
  accent: "#c15f3c",
  accentForeground: "#ffffff",
  accentHover: "#a8512f",
  accentDark: "#da7756",
  // Status
  success: "#5a8a5e",
  warning: "#b5882c",
  error: "#c24b3a",
  info: "#5b7fa5",
  // Workspace (always dark)
  wsEditor: "#1c1917",
  wsTabbar: "#252220",
  wsBorder: "#3a3531",
  wsBorderMuted: "#2e2a27",
  wsText: "#f4f3ee",
  wsTextMuted: "#a8a29e",
  wsAccent: "#c15f3c",
} as const;

export const COLOR_STYLES: {
  name: string;
  hex: string;
  description: string;
  /** Maps to a token name in VariableRefs.colorVars for variable binding. */
  tokenName?: string;
}[] = [
  {
    name: "nio/background",
    hex: COLORS.background,
    description: "Page background",
    tokenName: "background",
  },
  {
    name: "nio/foreground",
    hex: COLORS.foreground,
    description: "Primary text / icon color",
    tokenName: "foreground",
  },
  {
    name: "nio/surface",
    hex: COLORS.surface,
    description: "Card / panel surface",
    tokenName: "surface",
  },
  {
    name: "nio/surface-muted",
    hex: COLORS.surfaceMuted,
    description: "Muted surface (inputs, code blocks)",
    tokenName: "surface-muted",
  },
  {
    name: "nio/surface-strong",
    hex: COLORS.surfaceStrong,
    description: "High-contrast surface",
    tokenName: "surface-strong",
  },
  {
    name: "nio/border",
    hex: COLORS.border,
    description: "Default border",
    tokenName: "border",
  },
  {
    name: "nio/border-muted",
    hex: COLORS.borderMuted,
    description: "Subtle border / divider",
    tokenName: "border-muted",
  },
  {
    name: "nio/text-muted",
    hex: COLORS.textMuted,
    description: "Secondary text",
    tokenName: "text-muted",
  },
  {
    name: "nio/text-subtle",
    hex: COLORS.textSubtle,
    description: "Tertiary / hint text",
    tokenName: "text-subtle",
  },
  {
    name: "nio/accent",
    hex: COLORS.accent,
    description: "Primary accent -- CTAs, active states",
    tokenName: "accent",
  },
  {
    name: "nio/accent-foreground",
    hex: COLORS.accentForeground,
    description: "Text on accent background",
    tokenName: "accent-foreground",
  },
  {
    name: "nio/accent-hover",
    hex: COLORS.accentHover,
    description: "Accent hover / pressed state",
    tokenName: "accent-hover",
  },
  {
    name: "nio/status-success",
    hex: COLORS.success,
    description: "Success green",
    tokenName: "status-success",
  },
  {
    name: "nio/status-warning",
    hex: COLORS.warning,
    description: "Warning amber",
    tokenName: "status-warning",
  },
  {
    name: "nio/status-error",
    hex: COLORS.error,
    description: "Error red",
    tokenName: "status-error",
  },
  {
    name: "nio/status-info",
    hex: COLORS.info,
    description: "Info blue",
    tokenName: "status-info",
  },
  {
    name: "nio/workspace-editor",
    hex: COLORS.wsEditor,
    description: "Workspace editor background (always dark)",
    tokenName: "workspace-editor",
  },
  {
    name: "nio/workspace-text",
    hex: COLORS.wsText,
    description: "Workspace primary text",
    tokenName: "workspace-text",
  },
];

// ---------------------------------------------------------------------------
// Page helpers
// ---------------------------------------------------------------------------

/** Get or create a page by name. */
export function getOrCreatePage(name: string): PageNode {
  const existing = figma.root.children.find((p) => p.name === name);
  if (existing) return existing;
  const page = figma.createPage();
  page.name = name;
  return page;
}

/** Remove all children from a page (clean slate before rebuilding). */
export function clearPage(page: PageNode) {
  while (page.children.length > 0) {
    page.children[0].remove();
  }
}

/** Add export settings to a node. */
export function addExports(
  node: SceneNode & ExportMixin,
  settings: ExportSettings[],
) {
  node.exportSettings = [...node.exportSettings, ...settings];
}

/** PNG export at a given scale. */
export function pngExport(scale: number, suffix?: string): ExportSettingsPNG {
  return {
    format: "PNG",
    suffix: suffix !== undefined ? suffix : (scale === 1 ? "" : "@" + scale + "x"),
    constraint: { type: "SCALE", value: scale },
  } as ExportSettingsPNG;
}

/** SVG export with outlined text. */
export function svgExport(): ExportSettingsSVG {
  return {
    format: "SVG",
    suffix: "",
    svgOutlineText: true,
  } as ExportSettingsSVG;
}

// ---------------------------------------------------------------------------
// Logo font loading
// ---------------------------------------------------------------------------

const LOGO_FONTS: FontName[] = [
  { family: "Orbitron", style: "Bold" },
  { family: "Orbitron", style: "Regular" },
  { family: "Inter", style: "Bold" },
];

let _loadedLogoFont: FontName | null = null;

export async function loadLogoFont(): Promise<FontName> {
  if (_loadedLogoFont) return _loadedLogoFont;

  for (const font of LOGO_FONTS) {
    try {
      console.log("[niotebook] trying font: " + font.family + " " + font.style);
      await figma.loadFontAsync(font);
      _loadedLogoFont = font;
      console.log("[niotebook] loaded font: " + font.family + " " + font.style);
      return font;
    } catch {
      console.log("[niotebook] font not available: " + font.family + " " + font.style);
    }
  }

  throw new Error(
    "No logo font available. Install Orbitron (Google Fonts) in Figma or on your system.",
  );
}

export function getLogoFont(): FontName {
  if (!_loadedLogoFont) throw new Error("Call loadLogoFont() first");
  return _loadedLogoFont;
}

// ---------------------------------------------------------------------------
// Wordmark text builder (v2 -- terracotta 'i', no gray bar)
// ---------------------------------------------------------------------------

/**
 * Create a "niotebook" or "nio" text node with the 'i' colored in terracotta.
 *
 * - Light: black text (#1c1917), terracotta 'i' (#c15f3c)
 * - Dark: white text (#f4f3ee), terracotta 'i' (#da7756)
 * - Accent: all terracotta (#c15f3c) -- 'i' same color as rest
 */
export function buildWordmarkText(
  label: "niotebook" | "nio",
  fontSize: number,
  mode: "Light" | "Dark" | "Accent",
): TextNode {
  const font = getLogoFont();
  const text = figma.createText();
  text.fontName = font;
  text.fontSize = fontSize;
  text.characters = label;

  // Base color for all characters
  let baseColor: string;
  if (mode === "Light") {
    baseColor = COLORS.foreground;
  } else if (mode === "Dark") {
    baseColor = COLORS.wsText;
  } else {
    baseColor = COLORS.accent;
  }
  text.fills = [solidPaint(baseColor)];

  // Color the 'i' in terracotta (index 1 in both "niotebook" and "nio")
  if (mode !== "Accent") {
    let terracotta: string;
    if (mode === "Light") {
      terracotta = COLORS.accent;
    } else {
      terracotta = COLORS.accentDark;
    }
    text.setRangeFills(1, 2, [solidPaint(terracotta)]);
  }

  return text;
}
