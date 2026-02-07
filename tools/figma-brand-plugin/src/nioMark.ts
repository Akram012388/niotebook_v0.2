import {
  loadLogoFont,
  buildLogoGroup,
  applyVariantColors,
  getOrCreatePage,
  addExports,
  pngExport,
} from "./utils";

/** Build the nio mark component set with Light/Dark/Accent variants. */
export async function buildNioMark() {
  await loadLogoFont();

  const page = getOrCreatePage("Logo System");
  await figma.setCurrentPageAsync(page);

  const FONT_SIZE = 120;
  const variants: ("Light" | "Dark" | "Accent")[] = ["Light", "Dark", "Accent"];
  const components: ComponentNode[] = [];

  for (const variant of variants) {
    const { frame, text, bar } = buildLogoGroup("nio", FONT_SIZE);
    applyVariantColors(text, bar, variant);

    const comp = figma.createComponent();
    comp.name = `Mode=${variant}`;
    comp.resize(frame.width, frame.height);
    comp.fills = [];
    comp.clipsContent = false;

    while (frame.children.length) {
      comp.appendChild(frame.children[0]);
    }
    frame.remove();

    // Export at fixed pixel sizes
    addExports(comp, [
      pngExport(1, "-512"),
      pngExport(0.5, "-256"),
      pngExport(0.25, "-128"),
      pngExport(0.125, "-64"),
    ]);

    page.appendChild(comp);
    components.push(comp);
  }

  const set = figma.combineAsVariants(components, page);
  set.name = "Logo/NioMark";

  let y = 0;
  for (const child of set.children) {
    (child as SceneNode).y = y;
    y += (child as SceneNode).height + 80;
  }
  set.resize(set.children[0].width, y - 80);

  figma.notify("✓ Nio mark component created");
}
