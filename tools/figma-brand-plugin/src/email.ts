import {
  loadLogoFont,
  buildWordmarkText,
  getOrCreatePage,
  solidPaint,
  addExports,
  pngExport,
} from "./utils";

/**
 * Create a 300px-wide email signature wordmark.
 *
 * White background, "niotebook" in dark text with terracotta 'i'.
 * Exported at 2x for Retina.
 */
export async function buildEmailSig() {
  await loadLogoFont();

  const page = getOrCreatePage("App Icons");
  await figma.setCurrentPageAsync(page);

  const WIDTH = 300;

  // Size font to fit ~280px width (8 chars in "niotebook")
  const fontSize = Math.round(280 / (0.65 * 8));

  const frame = figma.createFrame();
  frame.name = "Email/niotebook-email-sig";
  frame.fills = [solidPaint("#FFFFFF")];
  frame.clipsContent = true;

  const text = buildWordmarkText("niotebook", fontSize, "Light");

  const height = fontSize * 1.4;
  frame.resize(WIDTH, height);

  // Center text
  text.x = (WIDTH - text.width) / 2;
  text.y = (height - text.height) / 2;

  frame.appendChild(text);
  addExports(frame, [pngExport(2, "@2x")]);

  // Position below favicons
  frame.x = 0;
  frame.y = 700;

  page.appendChild(frame);
  figma.notify("Email signature created");
}
