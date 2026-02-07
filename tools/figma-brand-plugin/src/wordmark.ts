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
 * Build the wordmark component set with Light/Dark variants + export settings.
 *
 * The wordmark is "niotebook" in Orbitron Bold with the 'i' colored terracotta.
 * No gray bar -- just clean text.
 */
export async function buildWordmark() {
  await loadLogoFont();

  const page = getOrCreatePage("Logo System");
  await figma.setCurrentPageAsync(page);

  const FONT_SIZE = 120;
  const variants: ("Light" | "Dark")[] = ["Light", "Dark"];
  const components: ComponentNode[] = [];

  for (let v = 0; v < variants.length; v++) {
    const variant = variants[v];
    const text = buildWordmarkText("niotebook", FONT_SIZE, variant);

    // Create component to hold the text
    const comp = figma.createComponent();
    comp.name = "Mode=" + variant;
    comp.resize(text.width + 8, FONT_SIZE * 1.2);
    comp.fills = [];
    comp.clipsContent = false;

    // Center text vertically within component
    text.x = 4;
    text.y = (comp.height - text.height) / 2;

    comp.appendChild(text);

    // Preview background: light bg for Light variant, dark bg for Dark
    if (variant === "Light") {
      comp.fills = [solidPaint(COLORS.background)];
    } else {
      comp.fills = [solidPaint(COLORS.foreground)];
    }

    // Export settings
    addExports(comp, [svgExport(), pngExport(1), pngExport(2), pngExport(4)]);

    page.appendChild(comp);
    components.push(comp);
  }

  // Combine as variant set
  const set = figma.combineAsVariants(components, page);
  set.name = "Logo/Wordmark";

  // Lay out variants vertically with spacing
  let y = 0;
  for (let i = 0; i < set.children.length; i++) {
    const child = set.children[i] as SceneNode;
    child.y = y;
    child.x = 0;
    y += child.height + 80;
  }
  set.resize(set.children[0].width, y - 80);

  figma.notify("Wordmark component created");
}
