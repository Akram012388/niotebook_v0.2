import {
  loadLogoFont,
  buildLogoGroup,
  applyVariantColors,
  getOrCreatePage,
  addExports,
  pngExport,
  svgExport,
} from "./utils";

/** Build the wordmark component set with Light/Dark variants + export settings. */
export async function buildWordmark() {
  await loadLogoFont();

  const page = getOrCreatePage("Logo System");
  figma.currentPage = page;

  const FONT_SIZE = 120;
  const variants: ("Light" | "Dark")[] = ["Light", "Dark"];
  const components: ComponentNode[] = [];

  for (const variant of variants) {
    const { frame, text, bar } = buildLogoGroup("niotebook", FONT_SIZE);
    applyVariantColors(text, bar, variant);

    // Wrap in component
    const comp = figma.createComponent();
    comp.name = `Mode=${variant}`;
    comp.resize(frame.width, frame.height);
    comp.fills = [];
    comp.clipsContent = false;

    // Move children from frame into component
    while (frame.children.length) {
      comp.appendChild(frame.children[0]);
    }
    frame.remove();

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
  for (const child of set.children) {
    (child as SceneNode).y = y;
    y += (child as SceneNode).height + 80;
  }
  set.resize(set.children[0].width, y - 80);

  figma.notify("✓ Wordmark component created");
}
