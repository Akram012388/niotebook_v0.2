import {
  loadLogoFont,
  getLogoFont,
  buildWordmarkText,
  getOrCreatePage,
  clearPage,
  solidPaint,
  COLORS,
} from "./utils";
import { COLOR_TOKENS } from "./tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group tokens by their `group` field, preserving insertion order. */
function groupTokens() {
  const groups = new Map<string, (typeof COLOR_TOKENS)[number][]>();
  for (let i = 0; i < COLOR_TOKENS.length; i++) {
    const token = COLOR_TOKENS[i];
    let list = groups.get(token.group);
    if (!list) {
      list = [];
      groups.set(token.group, list);
    }
    list.push(token);
  }
  return groups;
}

/** Convert Figma RGBA (0-1) to #RRGGBB hex string. */
function rgbaToHex(c: { r: number; g: number; b: number; a: number }): string {
  const rr = Math.round(c.r * 255)
    .toString(16)
    .padStart(2, "0");
  const gg = Math.round(c.g * 255)
    .toString(16)
    .padStart(2, "0");
  const bb = Math.round(c.b * 255)
    .toString(16)
    .padStart(2, "0");
  if (c.a < 1) {
    const aa = Math.round(c.a * 100);
    return "#" + rr + gg + bb + " " + aa + "%";
  }
  return "#" + rr + gg + bb;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_WIDTH = 1440;
const CONTENT_PADDING = 80;
const CONTENT_WIDTH = PAGE_WIDTH - CONTENT_PADDING * 2;
const SECTION_GAP = 120;
const SWATCH_SIZE = 64;
const SWATCH_GAP = 16;
const SWATCH_LABEL_HEIGHT = 44;

// ---------------------------------------------------------------------------
// Brand guide builder (v2 -- complete rewrite with cursor tracking)
// ---------------------------------------------------------------------------

/**
 * Build a comprehensive brand guide reference page.
 *
 * Uses a master frame (1440px wide) with dark canvas background.
 * All elements are positioned using a cursorY tracker that increments
 * after each element to prevent overlaps.
 */
export async function buildBrandGuide() {
  await loadLogoFont();

  // Load body fonts with fallback
  let bodyFont: FontName = { family: "Geist Mono", style: "Regular" };
  try {
    await figma.loadFontAsync(bodyFont);
  } catch {
    bodyFont = { family: "Roboto Mono", style: "Regular" };
    try {
      await figma.loadFontAsync(bodyFont);
    } catch {
      bodyFont = { family: "Inter", style: "Regular" };
      await figma.loadFontAsync(bodyFont);
    }
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
  await figma.setCurrentPageAsync(page);
  clearPage(page);

  const LOGO_FONT = getLogoFont();
  let cursorY = CONTENT_PADDING;

  // ========================================================================
  // Master canvas frame
  // ========================================================================
  const canvas = figma.createFrame();
  canvas.name = "Brand Guide";
  canvas.fills = [solidPaint(COLORS.foreground)];
  canvas.clipsContent = false;
  // Width is set now; height will be finalized at the end
  canvas.resize(PAGE_WIDTH, 8000);

  // -- Helper: create text and add to canvas at cursorY --
  function addText(
    font: FontName,
    size: number,
    content: string,
    color: string,
    maxWidth?: number,
  ): TextNode {
    const t = figma.createText();
    t.fontName = font;
    t.fontSize = size;
    t.characters = content;
    t.fills = [solidPaint(color)];
    t.x = CONTENT_PADDING;
    t.y = cursorY;
    if (maxWidth) {
      t.resize(maxWidth, t.height);
      t.textAutoResize = "HEIGHT";
    }
    canvas.appendChild(t);
    return t;
  }

  function addSectionTitle(title: string) {
    const t = addText(LOGO_FONT, 28, title, COLORS.wsText);
    cursorY += t.height + 40;
  }


  // ========================================================================
  // 1. TITLE SECTION
  // ========================================================================
  const title = addText(LOGO_FONT, 52, "Niotebook Brand Guide v2", COLORS.wsText, CONTENT_WIDTH);
  cursorY += title.height + 24;

  const subtitle = addText(
    bodyFont,
    16,
    "The interactive notebook for learning to code alongside video.\nWarm terracotta palette  |  Light/Dark themes  |  Claude Cowork inspired",
    COLORS.wsTextMuted,
    CONTENT_WIDTH,
  );
  cursorY += subtitle.height + SECTION_GAP;

  // ========================================================================
  // 2. WORDMARK SHOWCASE
  // ========================================================================
  addSectionTitle("Wordmark");

  // Light variant panel
  const lightPanel = figma.createFrame();
  lightPanel.name = "Showcase/Wordmark Light";
  lightPanel.fills = [solidPaint(COLORS.background)];
  lightPanel.cornerRadius = 16;
  lightPanel.resize(CONTENT_WIDTH / 2 - 16, 200);
  lightPanel.x = CONTENT_PADDING;
  lightPanel.y = cursorY;
  lightPanel.clipsContent = true;
  canvas.appendChild(lightPanel);

  const lightWordmark = buildWordmarkText("niotebook", 48, "Light");
  lightWordmark.x = (lightPanel.width - lightWordmark.width) / 2;
  lightWordmark.y = (lightPanel.height - lightWordmark.height) / 2;
  lightPanel.appendChild(lightWordmark);

  // Dark variant panel
  const darkPanel = figma.createFrame();
  darkPanel.name = "Showcase/Wordmark Dark";
  darkPanel.fills = [solidPaint(COLORS.foreground)];
  darkPanel.strokes = [solidPaint(COLORS.wsBorder)];
  darkPanel.strokeWeight = 1;
  darkPanel.cornerRadius = 16;
  darkPanel.resize(CONTENT_WIDTH / 2 - 16, 200);
  darkPanel.x = CONTENT_PADDING + CONTENT_WIDTH / 2 + 16;
  darkPanel.y = cursorY;
  darkPanel.clipsContent = true;
  canvas.appendChild(darkPanel);

  const darkWordmark = buildWordmarkText("niotebook", 48, "Dark");
  darkWordmark.x = (darkPanel.width - darkWordmark.width) / 2;
  darkWordmark.y = (darkPanel.height - darkWordmark.height) / 2;
  darkPanel.appendChild(darkWordmark);

  cursorY += 200 + 16;

  // Labels under panels
  const lightLabel = addText(bodyFont, 12, "Light Mode", COLORS.wsTextMuted);
  lightLabel.x = CONTENT_PADDING + (CONTENT_WIDTH / 2 - 16) / 2 - lightLabel.width / 2;

  const darkLabel = figma.createText();
  darkLabel.fontName = bodyFont;
  darkLabel.fontSize = 12;
  darkLabel.characters = "Dark Mode";
  darkLabel.fills = [solidPaint(COLORS.wsTextMuted)];
  darkLabel.x = CONTENT_PADDING + CONTENT_WIDTH / 2 + 16 + (CONTENT_WIDTH / 2 - 16) / 2 - darkLabel.width / 2;
  darkLabel.y = cursorY;
  canvas.appendChild(darkLabel);

  cursorY += 24 + SECTION_GAP;

  // ========================================================================
  // 3. NIO MARK SHOWCASE
  // ========================================================================
  addSectionTitle("Nio Mark (Short Form)");

  const markModes: ("Light" | "Dark" | "Accent")[] = ["Light", "Dark", "Accent"];
  const markPanelWidth = (CONTENT_WIDTH - 32 * 2) / 3;

  for (let m = 0; m < markModes.length; m++) {
    const mode = markModes[m];
    const panelBg = mode === "Light" ? COLORS.background : COLORS.foreground;

    const panel = figma.createFrame();
    panel.name = "Showcase/NioMark " + mode;
    panel.fills = [solidPaint(panelBg)];
    if (mode !== "Light") {
      panel.strokes = [solidPaint(COLORS.wsBorder)];
      panel.strokeWeight = 1;
    }
    panel.cornerRadius = 16;
    panel.resize(markPanelWidth, 160);
    panel.x = CONTENT_PADDING + m * (markPanelWidth + 32);
    panel.y = cursorY;
    panel.clipsContent = true;
    canvas.appendChild(panel);

    const markText = buildWordmarkText("nio", 56, mode);
    markText.x = (panel.width - markText.width) / 2;
    markText.y = (panel.height - markText.height) / 2;
    panel.appendChild(markText);
  }

  cursorY += 160 + 16;

  // Mode labels
  const modeLabels = ["Light", "Dark", "Accent"];
  for (let ml = 0; ml < modeLabels.length; ml++) {
    const mLabel = figma.createText();
    mLabel.fontName = bodyFont;
    mLabel.fontSize = 12;
    mLabel.characters = modeLabels[ml] + " Mode";
    mLabel.fills = [solidPaint(COLORS.wsTextMuted)];
    mLabel.x = CONTENT_PADDING + ml * (markPanelWidth + 32) + markPanelWidth / 2 - mLabel.width / 2;
    mLabel.y = cursorY;
    canvas.appendChild(mLabel);
  }

  cursorY += 24 + SECTION_GAP;

  // ========================================================================
  // 4. COLOR TOKENS
  // ========================================================================
  addSectionTitle("Color Tokens");

  const groups = groupTokens();
  const groupOrder = ["backgrounds", "borders", "text", "accent", "status", "workspace"];

  const COL_GAP = 48;
  const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2;
  const LIGHT_X = CONTENT_PADDING;
  const DARK_X = CONTENT_PADDING + COL_WIDTH + COL_GAP;

  // Column headers
  const lightColHeader = figma.createText();
  lightColHeader.fontName = bodyFont;
  lightColHeader.fontSize = 14;
  lightColHeader.characters = "LIGHT THEME";
  lightColHeader.fills = [solidPaint(COLORS.wsTextMuted)];
  lightColHeader.x = LIGHT_X;
  lightColHeader.y = cursorY;
  canvas.appendChild(lightColHeader);

  const darkColHeader = figma.createText();
  darkColHeader.fontName = bodyFont;
  darkColHeader.fontSize = 14;
  darkColHeader.characters = "DARK THEME";
  darkColHeader.fills = [solidPaint(COLORS.wsTextMuted)];
  darkColHeader.x = DARK_X;
  darkColHeader.y = cursorY;
  canvas.appendChild(darkColHeader);

  cursorY += 32;

  for (let g = 0; g < groupOrder.length; g++) {
    const groupName = groupOrder[g];
    const tokens = groups.get(groupName);
    if (!tokens) continue;

    // Group label
    const gLabel = figma.createText();
    gLabel.fontName = bodyFont;
    gLabel.fontSize = 11;
    gLabel.characters = groupName.toUpperCase();
    gLabel.fills = [solidPaint(COLORS.accent)];
    gLabel.x = LIGHT_X;
    gLabel.y = cursorY;
    canvas.appendChild(gLabel);
    cursorY += 24;

    // Light theme background panel
    let rowHeight = SWATCH_SIZE + SWATCH_LABEL_HEIGHT + 24;
    const lightBg = figma.createRectangle();
    lightBg.name = "bg-light-" + groupName;
    lightBg.resize(COL_WIDTH, rowHeight);
    lightBg.fills = [solidPaint(COLORS.background)];
    lightBg.cornerRadius = 12;
    lightBg.x = LIGHT_X;
    lightBg.y = cursorY;
    canvas.appendChild(lightBg);

    // Dark theme background panel
    const darkBg = figma.createRectangle();
    darkBg.name = "bg-dark-" + groupName;
    darkBg.resize(COL_WIDTH, rowHeight);
    darkBg.fills = [solidPaint("#1c1917")];
    darkBg.strokes = [solidPaint(COLORS.wsBorder)];
    darkBg.strokeWeight = 1;
    darkBg.cornerRadius = 12;
    darkBg.x = DARK_X;
    darkBg.y = cursorY;
    canvas.appendChild(darkBg);

    const swatchStartY = cursorY + 12;

    // Calculate how many swatches fit per row
    const maxSwatchesPerRow = Math.floor((COL_WIDTH - 24) / (SWATCH_SIZE + SWATCH_GAP));
    const rows = Math.ceil(tokens.length / maxSwatchesPerRow);

    // Recalculate row height if we need multiple rows
    if (rows > 1) {
      const newRowHeight = rows * (SWATCH_SIZE + SWATCH_LABEL_HEIGHT + 8) + 24;
      lightBg.resize(COL_WIDTH, newRowHeight);
      darkBg.resize(COL_WIDTH, newRowHeight);
      rowHeight = newRowHeight;
    }

    for (let ti = 0; ti < tokens.length; ti++) {
      const tok = tokens[ti];
      const row = Math.floor(ti / maxSwatchesPerRow);
      const col = ti % maxSwatchesPerRow;
      const xOff = 12 + col * (SWATCH_SIZE + SWATCH_GAP);
      const yOff = swatchStartY + row * (SWATCH_SIZE + SWATCH_LABEL_HEIGHT + 8);

      // Light swatch
      const lSwatch = figma.createRectangle();
      lSwatch.name = "light/" + tok.name;
      lSwatch.resize(SWATCH_SIZE, SWATCH_SIZE);
      lSwatch.fills = [
        {
          type: "SOLID",
          color: { r: tok.light.r, g: tok.light.g, b: tok.light.b },
          opacity: tok.light.a,
        },
      ];
      lSwatch.cornerRadius = 8;
      lSwatch.x = LIGHT_X + xOff;
      lSwatch.y = yOff;
      // Border for near-white swatches on light bg
      if (tok.light.r > 0.9 && tok.light.g > 0.9 && tok.light.b > 0.9) {
        lSwatch.strokes = [solidPaint(COLORS.border)];
        lSwatch.strokeWeight = 1;
      }
      canvas.appendChild(lSwatch);

      // Light label
      const lLabel = figma.createText();
      lLabel.fontName = bodyFont;
      lLabel.fontSize = 9;
      lLabel.characters = tok.name + "\n" + rgbaToHex(tok.light);
      lLabel.fills = [solidPaint(COLORS.textMuted)];
      lLabel.x = LIGHT_X + xOff;
      lLabel.y = yOff + SWATCH_SIZE + 4;
      canvas.appendChild(lLabel);

      // Dark swatch
      const dSwatch = figma.createRectangle();
      dSwatch.name = "dark/" + tok.name;
      dSwatch.resize(SWATCH_SIZE, SWATCH_SIZE);
      dSwatch.fills = [
        {
          type: "SOLID",
          color: { r: tok.dark.r, g: tok.dark.g, b: tok.dark.b },
          opacity: tok.dark.a,
        },
      ];
      dSwatch.cornerRadius = 8;
      dSwatch.x = DARK_X + xOff;
      dSwatch.y = yOff;
      // Border for near-black swatches on dark bg
      if (tok.dark.r < 0.15 && tok.dark.g < 0.15 && tok.dark.b < 0.15) {
        dSwatch.strokes = [solidPaint(COLORS.wsBorder)];
        dSwatch.strokeWeight = 1;
      }
      canvas.appendChild(dSwatch);

      // Dark label
      const dLabel = figma.createText();
      dLabel.fontName = bodyFont;
      dLabel.fontSize = 9;
      dLabel.characters = tok.name + "\n" + rgbaToHex(tok.dark);
      dLabel.fills = [solidPaint(COLORS.wsTextMuted)];
      dLabel.x = DARK_X + xOff;
      dLabel.y = yOff + SWATCH_SIZE + 4;
      canvas.appendChild(dLabel);
    }

    cursorY += rowHeight + 24;
  }

  cursorY += SECTION_GAP;

  // ========================================================================
  // 5. TYPOGRAPHY
  // ========================================================================
  addSectionTitle("Typography");

  const typeSpecs = [
    {
      label: "Logo / Wordmark",
      font: LOGO_FONT,
      size: 36,
      sample: "niotebook",
      description: "Orbitron Bold -- brand identity, wordmark, display",
    },
    {
      label: "UI Headings",
      font: headingFont,
      size: 28,
      sample: "The quick brown fox jumps over the lazy dog",
      description: headingFont.family + " " + headingFont.style + " -- section headings, labels",
    },
    {
      label: "UI Body / Code",
      font: bodyFont,
      size: 16,
      sample: "const greeting = \"Hello, niotebook!\";",
      description: bodyFont.family + " " + bodyFont.style + " -- code, terminals, monospace",
    },
  ];

  for (let ts = 0; ts < typeSpecs.length; ts++) {
    const spec = typeSpecs[ts];

    // Type category panel
    const typePanel = figma.createFrame();
    typePanel.name = "Type/" + spec.label;
    typePanel.fills = [solidPaint("#252220")];
    typePanel.cornerRadius = 12;
    typePanel.resize(CONTENT_WIDTH, spec.size + 80);
    typePanel.x = CONTENT_PADDING;
    typePanel.y = cursorY;
    typePanel.clipsContent = true;
    canvas.appendChild(typePanel);

    // Category label (top-left)
    const catLabel = figma.createText();
    catLabel.fontName = bodyFont;
    catLabel.fontSize = 10;
    catLabel.characters = spec.label.toUpperCase();
    catLabel.fills = [solidPaint(COLORS.accent)];
    catLabel.x = 24;
    catLabel.y = 16;
    typePanel.appendChild(catLabel);

    // Description (top-right)
    const descLabel = figma.createText();
    descLabel.fontName = bodyFont;
    descLabel.fontSize = 10;
    descLabel.characters = spec.description;
    descLabel.fills = [solidPaint(COLORS.wsTextMuted)];
    descLabel.x = typePanel.width - descLabel.width - 24;
    descLabel.y = 16;
    typePanel.appendChild(descLabel);

    // Sample text
    const sampleText = figma.createText();
    sampleText.fontName = spec.font;
    sampleText.fontSize = spec.size;
    sampleText.characters = spec.sample;
    sampleText.fills = [solidPaint(COLORS.wsText)];
    sampleText.x = 24;
    sampleText.y = 40 + (spec.size + 40 - spec.size) / 2 - 4;
    typePanel.appendChild(sampleText);

    cursorY += typePanel.height + 16;
  }

  cursorY += SECTION_GAP;

  // ========================================================================
  // 6. BRAND RULES (Do's and Don'ts)
  // ========================================================================
  addSectionTitle("Brand Rules");

  const dosItems = [
    "Use provided assets at original proportions",
    "Place on solid backgrounds (warm parchment or warm charcoal)",
    "Use accent terracotta for the 'i' in niotebook -- it is the brand mark",
    "Maintain minimum clear space equal to the height of the 'n' character",
    "Use Light mode wordmark on light backgrounds, Dark on dark",
  ];

  const dontsItems = [
    "Rotate, skew, or stretch the logo",
    "Recolor outside the defined palette",
    "Place on busy, patterned, or gradient backgrounds",
    "Display wordmark below minimum size (120px width)",
    "Add drop shadows, glows, bevels, or outlines",
    "Separate the letters or alter spacing",
  ];

  // Do's column
  const rulesColWidth = (CONTENT_WIDTH - 48) / 2;

  const dosHeader = figma.createText();
  dosHeader.fontName = bodyFont;
  dosHeader.fontSize = 14;
  dosHeader.characters = "DO";
  dosHeader.fills = [solidPaint(COLORS.success)];
  dosHeader.x = CONTENT_PADDING;
  dosHeader.y = cursorY;
  canvas.appendChild(dosHeader);

  const dontsHeader = figma.createText();
  dontsHeader.fontName = bodyFont;
  dontsHeader.fontSize = 14;
  dontsHeader.characters = "DON'T";
  dontsHeader.fills = [solidPaint(COLORS.error)];
  dontsHeader.x = CONTENT_PADDING + rulesColWidth + 48;
  dontsHeader.y = cursorY;
  canvas.appendChild(dontsHeader);

  cursorY += 32;

  const maxLines = Math.max(dosItems.length, dontsItems.length);
  for (let li = 0; li < maxLines; li++) {
    if (li < dosItems.length) {
      const doText = figma.createText();
      doText.fontName = bodyFont;
      doText.fontSize = 13;
      doText.characters = "  " + dosItems[li];
      doText.fills = [solidPaint(COLORS.wsTextMuted)];
      doText.x = CONTENT_PADDING;
      doText.y = cursorY;
      doText.resize(rulesColWidth, doText.height);
      doText.textAutoResize = "HEIGHT";
      canvas.appendChild(doText);

      // Green checkmark
      const checkmark = figma.createText();
      checkmark.fontName = bodyFont;
      checkmark.fontSize = 13;
      checkmark.characters = "+";
      checkmark.fills = [solidPaint(COLORS.success)];
      checkmark.x = CONTENT_PADDING - 2;
      checkmark.y = cursorY;
      canvas.appendChild(checkmark);
    }

    if (li < dontsItems.length) {
      const dontText = figma.createText();
      dontText.fontName = bodyFont;
      dontText.fontSize = 13;
      dontText.characters = "  " + dontsItems[li];
      dontText.fills = [solidPaint(COLORS.wsTextMuted)];
      dontText.x = CONTENT_PADDING + rulesColWidth + 48;
      dontText.y = cursorY;
      dontText.resize(rulesColWidth, dontText.height);
      dontText.textAutoResize = "HEIGHT";
      canvas.appendChild(dontText);

      // Red x-mark
      const xmark = figma.createText();
      xmark.fontName = bodyFont;
      xmark.fontSize = 13;
      xmark.characters = "-";
      xmark.fills = [solidPaint(COLORS.error)];
      xmark.x = CONTENT_PADDING + rulesColWidth + 48 - 2;
      xmark.y = cursorY;
      canvas.appendChild(xmark);
    }

    cursorY += 28;
  }

  cursorY += SECTION_GAP;

  // ========================================================================
  // 7. MINIMUM SIZES
  // ========================================================================
  addSectionTitle("Minimum Sizes");

  const sizeRules = [
    "Wordmark minimum width: 120px",
    "Nio mark minimum size: 16 x 16px",
    "Clear space: 1x height of 'n' character on all sides",
    "Favicon: minimum 16px (text omitted below 6px font)",
  ];

  for (let sr = 0; sr < sizeRules.length; sr++) {
    const ruleText = addText(bodyFont, 14, "  " + sizeRules[sr], COLORS.wsTextMuted, CONTENT_WIDTH);
    cursorY += ruleText.height + 12;
  }

  cursorY += SECTION_GAP;

  // ========================================================================
  // 8. TOKEN REFERENCE (CSS Custom Properties)
  // ========================================================================
  addSectionTitle("Design Token Reference");

  const refIntro = addText(
    bodyFont,
    12,
    "Figma Variables: Niotebook/Color (Light + Dark modes)  |  Niotebook/Size (radius tokens)\nCSS custom properties: --<token-name> (e.g. --background, --accent, --radius-md)",
    COLORS.wsTextMuted,
    CONTENT_WIDTH,
  );
  cursorY += refIntro.height + 24;

  // Token list in two columns
  const refColWidth = (CONTENT_WIDTH - 48) / 2;
  const halfLen = Math.ceil(COLOR_TOKENS.length / 2);
  const tokenListStartY = cursorY;

  for (let ti2 = 0; ti2 < COLOR_TOKENS.length; ti2++) {
    const tkn = COLOR_TOKENS[ti2];
    const colIndex = ti2 < halfLen ? 0 : 1;
    const rowIndex = ti2 < halfLen ? ti2 : ti2 - halfLen;

    const entry = figma.createText();
    entry.fontName = bodyFont;
    entry.fontSize = 10;
    entry.characters = "--" + tkn.name + "  :  " + tkn.description;
    entry.fills = [solidPaint(COLORS.wsTextMuted)];
    entry.x = CONTENT_PADDING + colIndex * (refColWidth + 48);
    entry.y = tokenListStartY + rowIndex * 20;
    canvas.appendChild(entry);
  }

  cursorY = tokenListStartY + halfLen * 20 + 40;

  // ========================================================================
  // Finalize canvas height
  // ========================================================================
  cursorY += CONTENT_PADDING;
  canvas.resize(PAGE_WIDTH, cursorY);

  page.appendChild(canvas);
  figma.notify("Brand guide page created");
}
