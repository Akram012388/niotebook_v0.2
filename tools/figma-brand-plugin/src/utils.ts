// ---------------------------------------------------------------------------
// Shared helpers for the Niotebook brand plugin
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

/** Solid fill paint from hex. */
export function solidPaint(hex: string): SolidPaint {
  return { type: "SOLID", color: hexToRgb(hex) };
}

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------

export const COLORS = {
  black: "#0A0A0A",
  white: "#FAFAFA",
  gray900: "#171717",
  gray700: "#404040",
  gray400: "#A3A3A3",
  gray100: "#F5F5F5",
  green: "#00FF66",
  greenDim: "#00CC52",
} as const;

export const COLOR_STYLES: {
  name: string;
  hex: string;
  description: string;
}[] = [
  {
    name: "nio/black",
    hex: COLORS.black,
    description: "Primary background, text on light",
  },
  {
    name: "nio/white",
    hex: COLORS.white,
    description: "Primary text on dark, light backgrounds",
  },
  {
    name: "nio/gray-900",
    hex: COLORS.gray900,
    description: "Surfaces, cards (dark mode)",
  },
  {
    name: "nio/gray-700",
    hex: COLORS.gray700,
    description: "Gray bar (dark mode)",
  },
  {
    name: "nio/gray-400",
    hex: COLORS.gray400,
    description: "Secondary text, borders, gray bar (light)",
  },
  {
    name: "nio/gray-100",
    hex: COLORS.gray100,
    description: "Surfaces (light mode)",
  },
  {
    name: "nio/green",
    hex: COLORS.green,
    description: "Primary accent — active states, highlights, CTAs",
  },
  {
    name: "nio/green-dim",
    hex: COLORS.greenDim,
    description: "Accent on light bg (AA contrast)",
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
    suffix: suffix ?? (scale === 1 ? "" : `@${scale}x`),
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
// Logo building blocks
// ---------------------------------------------------------------------------

const LOGO_FONT: FontName = { family: "Orbitron", style: "Bold" };

export async function loadLogoFont() {
  await figma.loadFontAsync(LOGO_FONT);
}

/**
 * Create a text + gray bar group for the given string.
 * Returns { frame, text, bar } so the caller can adjust colors per variant.
 */
export function buildLogoGroup(
  label: string,
  fontSize: number,
): { frame: FrameNode; text: TextNode; bar: RectangleNode } {
  const text = figma.createText();
  text.fontName = LOGO_FONT;
  text.fontSize = fontSize;
  text.characters = label;
  text.textAlignHorizontal = "CENTER";

  const capHeight = fontSize * 0.72; // Orbitron cap height ≈ 72% of fontSize
  const barHeight = capHeight * 0.4;
  const barOvershoot = text.width * 0.08;

  const bar = figma.createRectangle();
  bar.resize(text.width + barOvershoot * 2, barHeight);
  bar.y = text.y + fontSize - capHeight + (capHeight - barHeight) / 2;
  bar.x = text.x - barOvershoot;

  const frame = figma.createFrame();
  frame.name = label;
  frame.clipsContent = false;
  frame.fills = [];
  frame.resize(
    bar.width,
    fontSize * 1.2, // line-height
  );

  // Center text horizontally in frame
  text.x = barOvershoot;
  bar.x = 0;
  bar.y = text.y + fontSize - capHeight + (capHeight - barHeight) / 2;

  frame.appendChild(bar);
  frame.appendChild(text); // text on top

  return { frame, text, bar };
}

/**
 * Apply variant colors to a logo group.
 */
export function applyVariantColors(
  text: TextNode,
  bar: RectangleNode,
  variant: "Light" | "Dark" | "Accent",
) {
  switch (variant) {
    case "Light":
      text.fills = [solidPaint(COLORS.black)];
      bar.fills = [solidPaint(COLORS.gray700)];
      break;
    case "Dark":
      text.fills = [solidPaint(COLORS.white)];
      bar.fills = [solidPaint(COLORS.gray400)];
      break;
    case "Accent":
      text.fills = [solidPaint(COLORS.green)];
      bar.fills = [solidPaint(COLORS.gray900)];
      break;
  }
}
