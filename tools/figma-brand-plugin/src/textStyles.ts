/** Create nio/* text styles (v2 — Geist Sans headings, Geist Mono code). */
export async function createTextStyles() {
  const existing = figma.getLocalTextStyles().map((s) => s.name);

  const defs: {
    name: string;
    fonts: FontName[]; // try in order — first loadable wins
    sizes: number[];
    description: string;
  }[] = [
    {
      name: "nio/display",
      fonts: [{ family: "Orbitron", style: "Bold" }],
      sizes: [64, 80],
      description: "Hero / landing display text",
    },
    {
      name: "nio/logo",
      fonts: [{ family: "Orbitron", style: "Bold" }],
      sizes: [48],
      description: "Logo / wordmark text — scales per context",
    },
    {
      name: "nio/heading",
      fonts: [
        { family: "Geist Sans", style: "SemiBold" },
        { family: "Geist", style: "SemiBold" },
      ],
      sizes: [24, 32, 40],
      description: "UI headings",
    },
    {
      name: "nio/body",
      fonts: [
        { family: "Geist Sans", style: "Regular" },
        { family: "Geist", style: "Regular" },
      ],
      sizes: [14, 16],
      description: "UI body text",
    },
    {
      name: "nio/code",
      fonts: [{ family: "Geist Mono", style: "Regular" }],
      sizes: [12, 14],
      description: "Code / monospace text",
    },
  ];

  for (const def of defs) {
    // Try each font in order until one loads
    let loadedFont: FontName | null = null;
    for (const font of def.fonts) {
      try {
        await figma.loadFontAsync(font);
        loadedFont = font;
        break;
      } catch {
        // Try next font
      }
    }

    if (!loadedFont) {
      const names = def.fonts.map((f) => `${f.family} ${f.style}`).join(", ");
      figma.notify(`⚠ None of [${names}] found — skipping "${def.name}"`, {
        error: true,
      });
      continue;
    }

    for (const size of def.sizes) {
      const styleName =
        def.sizes.length > 1 ? `${def.name}/${size}` : def.name;
      if (existing.includes(styleName)) continue;

      const style = figma.createTextStyle();
      style.name = styleName;
      style.description = def.description;
      style.fontName = loadedFont;
      style.fontSize = size;
    }
  }
}
