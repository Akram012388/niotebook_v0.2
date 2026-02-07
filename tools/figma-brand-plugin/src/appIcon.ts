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

/** Build the 1024×1024 master app icon + platform size exports. */
export async function buildAppIcon() {
  await loadLogoFont();

  const page = getOrCreatePage("App Icons");
  figma.currentPage = page;

  const SIZE = 1024;
  const RADIUS = 180;

  const frame = figma.createFrame();
  frame.name = "App Icon/Master";
  frame.resize(SIZE, SIZE);
  frame.cornerRadius = RADIUS;
  frame.fills = [solidPaint(COLORS.foreground)];
  frame.clipsContent = true;

  // nio mark, accent variant, sized to ~60% of frame
  const targetWidth = SIZE * 0.6;
  const fontSize = Math.round(targetWidth / (0.65 * 3)); // 3 chars "nio"
  const { frame: logoFrame, text, bar } = buildLogoGroup("nio", fontSize);
  applyVariantColors(text, bar, "Accent");

  logoFrame.x = (SIZE - logoFrame.width) / 2;
  logoFrame.y = (SIZE - logoFrame.height) / 2;
  frame.appendChild(logoFrame);

  // Export presets for all platform sizes
  const sizes = [1024, 512, 192, 180, 152, 144, 120, 96, 72, 48];
  addExports(
    frame,
    sizes.map((s) => {
      const scale = s / SIZE;
      return pngExport(scale, `-${s}`);
    }),
  );

  page.appendChild(frame);
  figma.notify("✓ App icon master created");
}
