import {
  loadLogoFont,
  buildWordmarkText,
  getOrCreatePage,
  solidPaint,
  COLORS,
  addExports,
  pngExport,
} from "./utils";

/**
 * Build the 1024x1024 master app icon with rounded corners, dark bg,
 * and centered "nio" mark in accent colors.
 */
export async function buildAppIcon() {
  await loadLogoFont();

  const page = getOrCreatePage("App Icons");
  await figma.setCurrentPageAsync(page);

  const SIZE = 1024;
  const RADIUS = 180;

  const frame = figma.createFrame();
  frame.name = "App Icon/Master";
  frame.resize(SIZE, SIZE);
  frame.cornerRadius = RADIUS;
  frame.fills = [solidPaint(COLORS.foreground)];
  frame.clipsContent = true;

  // "nio" mark in Accent mode (~60% of frame width)
  const targetWidth = SIZE * 0.6;
  const fontSize = Math.round(targetWidth / (0.65 * 3));
  const text = buildWordmarkText("nio", fontSize, "Accent");

  // Center in frame
  text.x = (SIZE - text.width) / 2;
  text.y = (SIZE - text.height) / 2;
  frame.appendChild(text);

  // Export presets for all platform sizes
  const sizes = [1024, 512, 192, 180, 152, 144, 120, 96, 72, 48];
  const exports: ExportSettings[] = [];
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i];
    const scale = s / SIZE;
    exports.push(pngExport(scale, "-" + s));
  }
  addExports(frame, exports);

  page.appendChild(frame);
  figma.notify("App icon master created");
}
