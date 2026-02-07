import { loadLogoFont, getLogoFont, getOrCreatePage, solidPaint, COLORS } from "./utils";
import { COLOR_TOKENS } from "./tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group tokens by their `group` field. */
function groupTokens() {
  const groups = new Map<
    string,
    (typeof COLOR_TOKENS)[number][]
  >();
  for (const token of COLOR_TOKENS) {
    const list = groups.get(token.group) ?? [];
    list.push(token);
    groups.set(token.group, list);
  }
  return groups;
}

/** Convert Figma RGBA (0-1) to #RRGGBB hex string. */
function rgbaToHex(c: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(c.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(c.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(c.b * 255)
    .toString(16)
    .padStart(2, "0");
  if (c.a < 1) {
    const a = Math.round(c.a * 100);
    return `#${r}${g}${b} ${a}%`;
  }
  return `#${r}${g}${b}`;
}

// ---------------------------------------------------------------------------
// Brand guide builder (v2 — dual-theme layout)
// ---------------------------------------------------------------------------

/** Build a comprehensive brand guide reference page with both themes. */
export async function buildBrandGuide() {
  await loadLogoFont();

  // Load body fonts with fallback
  let bodyFont: FontName = { family: "Geist Mono", style: "Regular" };
  try {
    await figma.loadFontAsync(bodyFont);
  } catch {
    bodyFont = { family: "Roboto Mono", style: "Regular" };
    await figma.loadFontAsync(bodyFont);
  }

  let headingFont: FontName = { family: "Geist Sans", style: "SemiBold" };
  try {
    await figma.loadFontAsync(headingFont);
  } catch {
    try {
      headingFont = { family: "Geist", style: "SemiBold" };
      await figma.loadFontAsync(headingFont);
    } catch {
      headingFont = getLogoFont();
    }
  }

  const page = getOrCreatePage("Brand Guide");
  figma.currentPage = page;

  const LOGO_FONT = getLogoFont();
  const SECTION_GAP = 120;
  const PAGE_WIDTH = 1440;
  const SWATCH_SIZE = 64;
  const SWATCH_GAP = 16;
  const SWATCH_LABEL_HEIGHT = 40;

  let cursorY = 0;

  // ── Master background frame ──
  // We build everything loose on the page, then we can group later if needed.

  // ── Title ──
  const title = figma.createText();
  title.fontName = LOGO_FONT;
  title.fontSize = 48;
  title.characters = "Niotebook Brand Guide v2";
  title.fills = [solidPaint(COLORS.wsText)];
  title.y = cursorY;
  page.appendChild(title);
  cursorY += 80;

  const subtitle = figma.createText();
  subtitle.fontName = bodyFont;
  subtitle.fontSize = 16;
  subtitle.characters =
    "The interactive notebook for learning to code alongside video.\nWarm terracotta palette · Light/Dark themes · Claude Cowork inspired";
  subtitle.fills = [solidPaint(COLORS.wsTextMuted)];
  subtitle.y = cursorY;
  page.appendChild(subtitle);
  cursorY += SECTION_GAP;

  // ── Color Tokens — Dual Theme ──
  const colorTitle = figma.createText();
  colorTitle.fontName = LOGO_FONT;
  colorTitle.fontSize = 24;
  colorTitle.characters = "Color Tokens";
  colorTitle.fills = [solidPaint(COLORS.wsText)];
  colorTitle.y = cursorY;
  page.appendChild(colorTitle);
  cursorY += 50;

  const groups = groupTokens();
  const groupOrder = [
    "backgrounds",
    "borders",
    "text",
    "accent",
    "status",
    "workspace",
  ];

  const COLUMN_GAP = 80;
  const LIGHT_COL_X = 0;
  const DARK_COL_X = PAGE_WIDTH / 2 + COLUMN_GAP / 2;

  // Column headers
  for (const [label, x] of [
    ["Light Theme", LIGHT_COL_X],
    ["Dark Theme", DARK_COL_X],
  ] as const) {
    const header = figma.createText();
    header.fontName = bodyFont;
    header.fontSize = 14;
    header.characters = label;
    header.fills = [solidPaint(COLORS.wsTextMuted)];
    header.x = x;
    header.y = cursorY;
    page.appendChild(header);
  }
  cursorY += 36;

  for (const groupName of groupOrder) {
    const tokens = groups.get(groupName);
    if (!tokens) continue;

    // Group label
    const groupLabel = figma.createText();
    groupLabel.fontName = bodyFont;
    groupLabel.fontSize = 11;
    groupLabel.characters = groupName.toUpperCase();
    groupLabel.fills = [solidPaint(COLORS.textSubtle)];
    groupLabel.y = cursorY;
    page.appendChild(groupLabel);
    cursorY += 24;

    // Light theme background panel
    const lightBg = figma.createRectangle();
    lightBg.name = `bg-light-${groupName}`;
    const lightBgHeight =
      SWATCH_SIZE + SWATCH_LABEL_HEIGHT + 24;
    lightBg.resize(PAGE_WIDTH / 2 - COLUMN_GAP / 2, lightBgHeight);
    lightBg.fills = [solidPaint(COLORS.background)];
    lightBg.cornerRadius = 8;
    lightBg.x = LIGHT_COL_X;
    lightBg.y = cursorY;
    page.appendChild(lightBg);

    // Dark theme background panel
    const darkBg = figma.createRectangle();
    darkBg.name = `bg-dark-${groupName}`;
    darkBg.resize(PAGE_WIDTH / 2 - COLUMN_GAP / 2, lightBgHeight);
    darkBg.fills = [solidPaint("#1c1917")];
    darkBg.cornerRadius = 8;
    darkBg.x = DARK_COL_X;
    darkBg.y = cursorY;
    page.appendChild(darkBg);

    const swatchY = cursorY + 12;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const xOffset = 12 + i * (SWATCH_SIZE + SWATCH_GAP);

      // Light swatch
      const lightSwatch = figma.createRectangle();
      lightSwatch.name = `light/${token.name}`;
      lightSwatch.resize(SWATCH_SIZE, SWATCH_SIZE);
      lightSwatch.fills = [
        {
          type: "SOLID",
          color: {
            r: token.light.r,
            g: token.light.g,
            b: token.light.b,
          },
          opacity: token.light.a,
        },
      ];
      lightSwatch.cornerRadius = 8;
      lightSwatch.x = LIGHT_COL_X + xOffset;
      lightSwatch.y = swatchY;
      // Border for light-on-light swatches
      if (token.light.r > 0.9 && token.light.g > 0.9 && token.light.b > 0.9) {
        lightSwatch.strokes = [solidPaint(COLORS.border)];
        lightSwatch.strokeWeight = 1;
      }
      page.appendChild(lightSwatch);

      // Light label
      const lightLabel = figma.createText();
      lightLabel.fontName = bodyFont;
      lightLabel.fontSize = 9;
      lightLabel.characters = `${token.name}\n${rgbaToHex(token.light)}`;
      lightLabel.fills = [solidPaint(COLORS.textMuted)];
      lightLabel.x = LIGHT_COL_X + xOffset;
      lightLabel.y = swatchY + SWATCH_SIZE + 4;
      page.appendChild(lightLabel);

      // Dark swatch
      const darkSwatch = figma.createRectangle();
      darkSwatch.name = `dark/${token.name}`;
      darkSwatch.resize(SWATCH_SIZE, SWATCH_SIZE);
      darkSwatch.fills = [
        {
          type: "SOLID",
          color: {
            r: token.dark.r,
            g: token.dark.g,
            b: token.dark.b,
          },
          opacity: token.dark.a,
        },
      ];
      darkSwatch.cornerRadius = 8;
      darkSwatch.x = DARK_COL_X + xOffset;
      darkSwatch.y = swatchY;
      // Border for dark-on-dark swatches
      if (token.dark.r < 0.15 && token.dark.g < 0.15 && token.dark.b < 0.15) {
        darkSwatch.strokes = [solidPaint(COLORS.wsBorder)];
        darkSwatch.strokeWeight = 1;
      }
      page.appendChild(darkSwatch);

      // Dark label
      const darkLabel = figma.createText();
      darkLabel.fontName = bodyFont;
      darkLabel.fontSize = 9;
      darkLabel.characters = `${token.name}\n${rgbaToHex(token.dark)}`;
      darkLabel.fills = [solidPaint(COLORS.wsTextMuted)];
      darkLabel.x = DARK_COL_X + xOffset;
      darkLabel.y = swatchY + SWATCH_SIZE + 4;
      page.appendChild(darkLabel);
    }

    cursorY += lightBgHeight + 24;
  }

  cursorY += SECTION_GAP;

  // ── Typography ──
  const typeTitle = figma.createText();
  typeTitle.fontName = LOGO_FONT;
  typeTitle.fontSize = 24;
  typeTitle.characters = "Typography";
  typeTitle.fills = [solidPaint(COLORS.wsText)];
  typeTitle.y = cursorY;
  page.appendChild(typeTitle);
  cursorY += 50;

  const typeSpecs = [
    {
      label: "Logo / Wordmark",
      font: LOGO_FONT,
      size: 32,
      sample: "niotebook",
    },
    {
      label: "UI Headings",
      font: headingFont,
      size: 24,
      sample: "The quick brown fox jumps over the lazy dog",
    },
    {
      label: "UI Body / Code",
      font: bodyFont,
      size: 16,
      sample: "The quick brown fox jumps over the lazy dog",
    },
  ];

  for (const spec of typeSpecs) {
    const lbl = figma.createText();
    lbl.fontName = bodyFont;
    lbl.fontSize = 11;
    lbl.characters = `${spec.label} — ${spec.font.family} ${spec.font.style}`;
    lbl.fills = [solidPaint(COLORS.wsTextMuted)];
    lbl.y = cursorY;
    page.appendChild(lbl);
    cursorY += 24;

    const sample = figma.createText();
    sample.fontName = spec.font;
    sample.fontSize = spec.size;
    sample.characters = spec.sample;
    sample.fills = [solidPaint(COLORS.wsText)];
    sample.y = cursorY;
    page.appendChild(sample);
    cursorY += spec.size + 40;
  }
  cursorY += SECTION_GAP;

  // ── Minimum Sizes ──
  const minTitle = figma.createText();
  minTitle.fontName = LOGO_FONT;
  minTitle.fontSize = 24;
  minTitle.characters = "Minimum Sizes";
  minTitle.fills = [solidPaint(COLORS.wsText)];
  minTitle.y = cursorY;
  page.appendChild(minTitle);
  cursorY += 50;

  const rules = [
    "Wordmark minimum width: 120px",
    "Nio mark minimum size: 16px",
    'Clear space: 1× height of "n" on all sides',
  ];
  for (const rule of rules) {
    const r = figma.createText();
    r.fontName = bodyFont;
    r.fontSize = 14;
    r.characters = `• ${rule}`;
    r.fills = [solidPaint(COLORS.wsTextMuted)];
    r.y = cursorY;
    page.appendChild(r);
    cursorY += 28;
  }
  cursorY += SECTION_GAP;

  // ── Do's and Don'ts ──
  const dosTitle = figma.createText();
  dosTitle.fontName = LOGO_FONT;
  dosTitle.fontSize = 24;
  dosTitle.characters = "Do's and Don'ts";
  dosTitle.fills = [solidPaint(COLORS.wsText)];
  dosTitle.y = cursorY;
  page.appendChild(dosTitle);
  cursorY += 50;

  const dos = [
    "✓ Use provided assets at original proportions",
    "✓ Place on solid backgrounds (warm parchment, warm charcoal, or neutral)",
    "✓ Use accent terracotta only for interactive/active states",
  ];
  const donts = [
    "✗ Rotate, skew, or stretch the logo",
    "✗ Recolor outside the defined palette",
    "✗ Place on busy or patterned backgrounds",
    "✗ Remove or modify the gray bar",
    "✗ Display wordmark below minimum size",
    "✗ Add drop shadows, glows, or outlines",
  ];

  for (const line of [...dos, "", ...donts]) {
    if (line === "") {
      cursorY += 16;
      continue;
    }
    const t = figma.createText();
    t.fontName = bodyFont;
    t.fontSize = 14;
    t.characters = line;
    t.fills = [
      solidPaint(line.startsWith("✓") ? COLORS.success : COLORS.error),
    ];
    t.y = cursorY;
    page.appendChild(t);
    cursorY += 28;
  }
  cursorY += SECTION_GAP;

  // ── Design Token Reference ──
  const tokenRefTitle = figma.createText();
  tokenRefTitle.fontName = LOGO_FONT;
  tokenRefTitle.fontSize = 24;
  tokenRefTitle.characters = "Design Token Reference";
  tokenRefTitle.fills = [solidPaint(COLORS.wsText)];
  tokenRefTitle.y = cursorY;
  page.appendChild(tokenRefTitle);
  cursorY += 50;

  const tokenRefIntro = figma.createText();
  tokenRefIntro.fontName = bodyFont;
  tokenRefIntro.fontSize = 12;
  tokenRefIntro.characters =
    "Figma Variables: Niotebook/Color (Light + Dark modes) · Niotebook/Size (radius tokens)\nCSS custom properties: --<token-name> (e.g. --background, --accent, --radius-md)";
  tokenRefIntro.fills = [solidPaint(COLORS.wsTextMuted)];
  tokenRefIntro.y = cursorY;
  page.appendChild(tokenRefIntro);
  cursorY += 48;

  // Token list
  for (const token of COLOR_TOKENS) {
    const entry = figma.createText();
    entry.fontName = bodyFont;
    entry.fontSize = 10;
    entry.characters = `--${token.name}  →  ${token.description}`;
    entry.fills = [solidPaint(COLORS.wsTextMuted)];
    entry.y = cursorY;
    page.appendChild(entry);
    cursorY += 18;
  }

  figma.notify("✓ Brand guide page created");
}
