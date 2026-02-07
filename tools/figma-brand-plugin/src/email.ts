import {
  loadLogoFont,
  getLogoFont,
  getOrCreatePage,
  solidPaint,
  COLORS,
  addExports,
  pngExport,
} from "./utils";

/** Create a 300px-wide email signature wordmark (no gray bar). */
export async function buildEmailSig() {
  await loadLogoFont();

  const page = getOrCreatePage("App Icons");
  figma.currentPage = page;

  const WIDTH = 300;
  const FONT = getLogoFont();

  const frame = figma.createFrame();
  frame.name = "Email/niotebook-email-sig";
  frame.fills = [solidPaint("#FFFFFF")];
  frame.clipsContent = true;

  // Size font to fit ~280px width
  const fontSize = Math.round(280 / (0.65 * 8)); // 8 chars "niotebook"
  const text = figma.createText();
  text.fontName = FONT;
  text.fontSize = fontSize;
  text.characters = "niotebook";
  text.fills = [solidPaint(COLORS.foreground)];

  const height = fontSize * 1.4;
  frame.resize(WIDTH, height);
  text.x = (WIDTH - text.width) / 2;
  text.y = (height - fontSize) / 2;

  frame.appendChild(text);
  addExports(frame, [pngExport(2, "")]);

  frame.x = 0;
  frame.y = 700;

  page.appendChild(frame);
  figma.notify("✓ Email signature created");
}
