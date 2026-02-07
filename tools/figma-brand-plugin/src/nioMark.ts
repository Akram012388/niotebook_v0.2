import {
  loadLogoFont,
  buildWordmarkText,
  getOrCreatePage,
  addExports,
  pngExport,
  svgExport,
  COLORS,
  solidPaint,
} from "./utils";

/**
 * Build the nio mark component set with Light/Dark/Accent variants.
 *
 * The nio mark is "nio" in Orbitron Bold with the 'i' colored terracotta.
 * Accent variant uses all-terracotta text.
 */
export async function buildNioMark() {
  await loadLogoFont();

  const page = getOrCreatePage("Logo System");
  await figma.setCurrentPageAsync(page);

  const FONT_SIZE = 120;
  const variants: ("Light" | "Dark" | "Accent")[] = ["Light", "Dark", "Accent"];
  const components: ComponentNode[] = [];

  for (let v = 0; v < variants.length; v++) {
    const variant = variants[v];
    const text = buildWordmarkText("nio", FONT_SIZE, variant);

    const comp = figma.createComponent();
    comp.name = "Mode=" + variant;
    comp.resize(text.width + 8, FONT_SIZE * 1.2);
    comp.clipsContent = false;

    // Center text vertically
    text.x = 4;
    text.y = (comp.height - text.height) / 2;

    comp.appendChild(text);

    // Preview background
    if (variant === "Light") {
      comp.fills = [solidPaint(COLORS.background)];
    } else if (variant === "Dark") {
      comp.fills = [solidPaint(COLORS.foreground)];
    } else {
      // Accent on dark bg
      comp.fills = [solidPaint(COLORS.foreground)];
    }

    // Export at fixed pixel sizes
    addExports(comp, [
      svgExport(),
      pngExport(1),
      pngExport(0.5, "-256"),
      pngExport(0.25, "-128"),
      pngExport(0.125, "-64"),
    ]);

    page.appendChild(comp);
    components.push(comp);
  }

  const set = figma.combineAsVariants(components, page);
  set.name = "Logo/NioMark";

  // Lay out variants vertically
  let y = 0;
  for (let i = 0; i < set.children.length; i++) {
    const child = set.children[i] as SceneNode;
    child.y = y;
    child.x = 0;
    y += child.height + 80;
  }
  set.resize(set.children[0].width, y - 80);

  // Position nio mark to the right of the wordmark set
  set.x = 1200;
  set.y = 0;

  figma.notify("Nio mark component created");
}
