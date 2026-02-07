import {
  loadLogoFont,
  getLogoFont,
  getOrCreatePage,
  solidPaint,
  COLORS,
  addExports,
  svgExport,
} from "./utils";

/** Create a ~200×28 README badge with nio mark + "niotebook" text. */
export async function buildBadge() {
  await loadLogoFont();

  const page = getOrCreatePage("Logo System");
  await figma.setCurrentPageAsync(page);

  const FONT = getLogoFont();
  const FONT_SIZE = 14;
  const HEIGHT = 28;
  const PADDING = 8;

  const frame = figma.createFrame();
  frame.name = "Badge/niotebook-badge";
  frame.fills = [solidPaint(COLORS.surfaceStrong)];
  frame.cornerRadius = 6; // radius-sm
  frame.clipsContent = true;

  // "nio" mark
  const nioText = figma.createText();
  nioText.fontName = FONT;
  nioText.fontSize = FONT_SIZE;
  nioText.characters = "nio";
  nioText.fills = [solidPaint(COLORS.accent)];
  nioText.x = PADDING;
  nioText.y = (HEIGHT - FONT_SIZE) / 2;

  // separator
  const sep = figma.createRectangle();
  sep.resize(1, HEIGHT * 0.6);
  sep.fills = [solidPaint(COLORS.textMuted)];
  sep.x = nioText.x + nioText.width + PADDING;
  sep.y = HEIGHT * 0.2;

  // "tebook" text
  const restText = figma.createText();
  restText.fontName = FONT;
  restText.fontSize = FONT_SIZE;
  restText.characters = "tebook";
  restText.fills = [solidPaint(COLORS.wsText)];
  restText.x = sep.x + sep.width + PADDING;
  restText.y = (HEIGHT - FONT_SIZE) / 2;

  const totalWidth = restText.x + restText.width + PADDING;
  frame.resize(totalWidth, HEIGHT);

  frame.appendChild(nioText);
  frame.appendChild(sep);
  frame.appendChild(restText);

  addExports(frame, [svgExport()]);

  // Position away from other logo system elements
  frame.x = 0;
  frame.y = 600;

  page.appendChild(frame);
  figma.notify("✓ Badge created");
}
