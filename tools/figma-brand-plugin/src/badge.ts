import {
  loadLogoFont,
  getLogoFont,
  getOrCreatePage,
  solidPaint,
  COLORS,
  addExports,
  svgExport,
  pngExport,
} from "./utils";

/**
 * Create a ~200x28 README badge with "niotebook" text on dark bg.
 *
 * The 'i' is terracotta, other characters are white.
 * Simple pill shape, clean and minimal.
 */
export async function buildBadge() {
  await loadLogoFont();

  const page = getOrCreatePage("Logo System");
  await figma.setCurrentPageAsync(page);

  const FONT = getLogoFont();
  const FONT_SIZE = 14;
  const HEIGHT = 28;
  const PADDING_H = 12;
  const PADDING_V = (HEIGHT - FONT_SIZE) / 2;

  const frame = figma.createFrame();
  frame.name = "Badge/niotebook-badge";
  frame.fills = [solidPaint(COLORS.surfaceStrong)];
  frame.cornerRadius = 6;
  frame.clipsContent = true;

  // "niotebook" text with colored 'i'
  const text = figma.createText();
  text.fontName = FONT;
  text.fontSize = FONT_SIZE;
  text.characters = "niotebook";
  text.fills = [solidPaint(COLORS.wsText)];
  // Color the 'i' terracotta (index 1)
  text.setRangeFills(1, 2, [solidPaint(COLORS.accentDark)]);

  text.x = PADDING_H;
  text.y = PADDING_V;

  const totalWidth = PADDING_H + text.width + PADDING_H;
  frame.resize(totalWidth, HEIGHT);
  frame.appendChild(text);

  addExports(frame, [svgExport(), pngExport(1), pngExport(2)]);

  // Position below the logo system component sets
  frame.x = 0;
  frame.y = 800;

  page.appendChild(frame);
  figma.notify("Badge created");
}
