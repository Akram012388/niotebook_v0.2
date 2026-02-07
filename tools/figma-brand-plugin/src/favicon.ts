import {
  loadLogoFont,
  buildWordmarkText,
  getOrCreatePage,
  solidPaint,
  COLORS,
  addExports,
  pngExport,
} from "./utils";

interface FaviconSpec {
  name: string;
  size: number;
  padding: number;
}

const FAVICONS: FaviconSpec[] = [
  { name: "apple-touch-icon", size: 180, padding: 20 },
  { name: "android-chrome-192", size: 192, padding: 24 },
  { name: "android-chrome-512", size: 512, padding: 60 },
  { name: "favicon-32", size: 32, padding: 4 },
  { name: "favicon-16", size: 16, padding: 2 },
];

/**
 * Build favicon frames at standard platform sizes.
 *
 * Each is a dark bg square with centered "nio" mark in Dark mode
 * (white text, terracotta 'i').
 */
export async function buildFavicons() {
  await loadLogoFont();

  const page = getOrCreatePage("App Icons");
  await figma.setCurrentPageAsync(page);

  // Position favicons after the 1024px app icon master + 200px gap
  let offsetX = 1300;

  for (let f = 0; f < FAVICONS.length; f++) {
    const spec = FAVICONS[f];

    const frame = figma.createFrame();
    frame.name = "Favicon/" + spec.name;
    frame.resize(spec.size, spec.size);
    frame.fills = [solidPaint(COLORS.foreground)];
    frame.clipsContent = true;
    frame.x = offsetX;
    frame.y = 0;

    const innerSize = spec.size - spec.padding * 2;
    const fontSize = Math.round(innerSize / (0.65 * 3));

    // Only add text if fontSize is legible (>= 6px)
    if (fontSize >= 6) {
      const text = buildWordmarkText("nio", fontSize, "Dark");
      text.x = (spec.size - text.width) / 2;
      text.y = (spec.size - text.height) / 2;
      frame.appendChild(text);
    }

    addExports(frame, [pngExport(1, "-" + spec.name)]);
    page.appendChild(frame);
    offsetX += spec.size + 40;
  }

  figma.notify(FAVICONS.length + " favicon frames created");
}
