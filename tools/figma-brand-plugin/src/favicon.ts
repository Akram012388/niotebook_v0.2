import {
  loadLogoFont,
  buildLogoGroup,
  applyVariantColors,
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

export async function buildFavicons() {
  await loadLogoFont();

  const page = getOrCreatePage("App Icons");
  figma.currentPage = page;

  let offsetX = 1200; // after app icon master

  for (const spec of FAVICONS) {
    const frame = figma.createFrame();
    frame.name = `Favicon/${spec.name}`;
    frame.resize(spec.size, spec.size);
    frame.fills = [solidPaint(COLORS.foreground)];
    frame.clipsContent = true;
    frame.x = offsetX;
    frame.y = 0;

    const innerSize = spec.size - spec.padding * 2;
    const fontSize = Math.round(innerSize / (0.65 * 3));

    if (fontSize >= 8) {
      const { frame: logoFrame, text, bar } = buildLogoGroup("nio", fontSize);
      applyVariantColors(text, bar, "Dark");
      logoFrame.x = (spec.size - logoFrame.width) / 2;
      logoFrame.y = (spec.size - logoFrame.height) / 2;
      frame.appendChild(logoFrame);
    }

    addExports(frame, [pngExport(1)]);
    page.appendChild(frame);
    offsetX += spec.size + 40;
  }

  figma.notify(`✓ ${FAVICONS.length} favicon frames created`);
}
