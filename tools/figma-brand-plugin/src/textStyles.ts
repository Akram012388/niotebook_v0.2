/** Create nio/* text styles. */
export async function createTextStyles() {
  const existing = figma.getLocalTextStyles().map((s) => s.name);

  const defs: {
    name: string;
    font: FontName;
    sizes: number[];
    description: string;
  }[] = [
    {
      name: "nio/logo",
      font: { family: "Orbitron", style: "Bold" },
      sizes: [48],
      description: "Logo / wordmark text — scales per context",
    },
    {
      name: "nio/heading",
      font: { family: "Geist", style: "SemiBold" },
      sizes: [24, 32, 40],
      description: "UI headings",
    },
    {
      name: "nio/body",
      font: { family: "Geist Mono", style: "Regular" },
      sizes: [14, 16],
      description: "UI body / code",
    },
  ];

  for (const def of defs) {
    // Load the font — will throw if not installed
    try {
      await figma.loadFontAsync(def.font);
    } catch {
      figma.notify(
        `⚠ Font "${def.font.family} ${def.font.style}" not found — skipping style "${def.name}"`,
        { error: true },
      );
      continue;
    }

    for (const size of def.sizes) {
      const styleName = def.sizes.length > 1 ? `${def.name}/${size}` : def.name;
      if (existing.includes(styleName)) continue;

      const style = figma.createTextStyle();
      style.name = styleName;
      style.description = def.description;
      style.fontName = def.font;
      style.fontSize = size;
    }
  }
}
