"use strict";
(() => {
  // src/utils.ts
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255
    };
  }
  function solidPaint(hex) {
    return { type: "SOLID", color: hexToRgb(hex) };
  }
  var COLORS = {
    black: "#0A0A0A",
    white: "#FAFAFA",
    gray900: "#171717",
    gray700: "#404040",
    gray400: "#A3A3A3",
    gray100: "#F5F5F5",
    green: "#00FF66",
    greenDim: "#00CC52"
  };
  var COLOR_STYLES = [
    { name: "nio/black", hex: COLORS.black, description: "Primary background, text on light" },
    { name: "nio/white", hex: COLORS.white, description: "Primary text on dark, light backgrounds" },
    { name: "nio/gray-900", hex: COLORS.gray900, description: "Surfaces, cards (dark mode)" },
    { name: "nio/gray-700", hex: COLORS.gray700, description: "Gray bar (dark mode)" },
    { name: "nio/gray-400", hex: COLORS.gray400, description: "Secondary text, borders, gray bar (light)" },
    { name: "nio/gray-100", hex: COLORS.gray100, description: "Surfaces (light mode)" },
    { name: "nio/green", hex: COLORS.green, description: "Primary accent \u2014 active states, highlights, CTAs" },
    { name: "nio/green-dim", hex: COLORS.greenDim, description: "Accent on light bg (AA contrast)" }
  ];
  function getOrCreatePage(name) {
    const existing = figma.root.children.find((p) => p.name === name);
    if (existing) return existing;
    const page = figma.createPage();
    page.name = name;
    return page;
  }
  function addExports(node, settings) {
    node.exportSettings = [...node.exportSettings, ...settings];
  }
  function pngExport(scale, suffix) {
    return {
      format: "PNG",
      suffix: suffix ?? (scale === 1 ? "" : `@${scale}x`),
      constraint: { type: "SCALE", value: scale }
    };
  }
  function svgExport() {
    return {
      format: "SVG",
      suffix: "",
      svgOutlineText: true
    };
  }
  var LOGO_FONT = { family: "Orbitron", style: "Bold" };
  async function loadLogoFont() {
    await figma.loadFontAsync(LOGO_FONT);
  }
  function buildLogoGroup(label, fontSize) {
    const text = figma.createText();
    text.fontName = LOGO_FONT;
    text.fontSize = fontSize;
    text.characters = label;
    text.textAlignHorizontal = "CENTER";
    const capHeight = fontSize * 0.72;
    const barHeight = capHeight * 0.4;
    const barOvershoot = text.width * 0.08;
    const bar = figma.createRectangle();
    bar.resize(text.width + barOvershoot * 2, barHeight);
    bar.y = text.y + fontSize - capHeight + (capHeight - barHeight) / 2;
    bar.x = text.x - barOvershoot;
    const frame = figma.createFrame();
    frame.name = label;
    frame.clipsContent = false;
    frame.fills = [];
    frame.resize(
      bar.width,
      fontSize * 1.2
      // line-height
    );
    text.x = barOvershoot;
    bar.x = 0;
    bar.y = text.y + fontSize - capHeight + (capHeight - barHeight) / 2;
    frame.appendChild(bar);
    frame.appendChild(text);
    return { frame, text, bar };
  }
  function applyVariantColors(text, bar, variant) {
    switch (variant) {
      case "Light":
        text.fills = [solidPaint(COLORS.black)];
        bar.fills = [solidPaint(COLORS.gray700)];
        break;
      case "Dark":
        text.fills = [solidPaint(COLORS.white)];
        bar.fills = [solidPaint(COLORS.gray400)];
        break;
      case "Accent":
        text.fills = [solidPaint(COLORS.green)];
        bar.fills = [solidPaint(COLORS.gray900)];
        break;
    }
  }

  // src/colors.ts
  function createColorStyles() {
    const existing = figma.getLocalPaintStyles().map((s) => s.name);
    for (const def of COLOR_STYLES) {
      if (existing.includes(def.name)) continue;
      const style = figma.createPaintStyle();
      style.name = def.name;
      style.description = def.description;
      style.paints = [solidPaint(def.hex)];
    }
  }

  // src/textStyles.ts
  async function createTextStyles() {
    const existing = figma.getLocalTextStyles().map((s) => s.name);
    const defs = [
      {
        name: "nio/logo",
        font: { family: "Orbitron", style: "Bold" },
        sizes: [48],
        description: "Logo / wordmark text \u2014 scales per context"
      },
      {
        name: "nio/heading",
        font: { family: "Geist", style: "SemiBold" },
        sizes: [24, 32, 40],
        description: "UI headings"
      },
      {
        name: "nio/body",
        font: { family: "Geist Mono", style: "Regular" },
        sizes: [14, 16],
        description: "UI body / code"
      }
    ];
    for (const def of defs) {
      try {
        await figma.loadFontAsync(def.font);
      } catch {
        figma.notify(`\u26A0 Font "${def.font.family} ${def.font.style}" not found \u2014 skipping style "${def.name}"`, { error: true });
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

  // src/wordmark.ts
  async function buildWordmark() {
    await loadLogoFont();
    const page = getOrCreatePage("Logo System");
    figma.currentPage = page;
    const FONT_SIZE = 120;
    const variants = ["Light", "Dark"];
    const components = [];
    for (const variant of variants) {
      const { frame, text, bar } = buildLogoGroup("niotebook", FONT_SIZE);
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
      addExports(comp, [
        svgExport(),
        pngExport(1),
        pngExport(2),
        pngExport(4)
      ]);
      page.appendChild(comp);
      components.push(comp);
    }
    const set = figma.combineAsVariants(components, page);
    set.name = "Logo/Wordmark";
    let y = 0;
    for (const child of set.children) {
      ;
      child.y = y;
      y += child.height + 80;
    }
    set.resize(set.children[0].width, y - 80);
    figma.notify("\u2713 Wordmark component created");
  }

  // src/nioMark.ts
  async function buildNioMark() {
    await loadLogoFont();
    const page = getOrCreatePage("Logo System");
    figma.currentPage = page;
    const FONT_SIZE = 120;
    const variants = ["Light", "Dark", "Accent"];
    const components = [];
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
      addExports(comp, [
        pngExport(1, "-512"),
        pngExport(0.5, "-256"),
        pngExport(0.25, "-128"),
        pngExport(0.125, "-64")
      ]);
      page.appendChild(comp);
      components.push(comp);
    }
    const set = figma.combineAsVariants(components, page);
    set.name = "Logo/NioMark";
    let y = 0;
    for (const child of set.children) {
      ;
      child.y = y;
      y += child.height + 80;
    }
    set.resize(set.children[0].width, y - 80);
    figma.notify("\u2713 Nio mark component created");
  }

  // src/social.ts
  var PLATFORMS = [
    { name: "OG Image", width: 1200, height: 630, logo: "wordmark", logoScale: 0.6, exportPath: "og-image" },
    { name: "Profile Pic", width: 400, height: 400, logo: "nio", logoScale: 0.5, exportPath: "profile" },
    { name: "Twitter", width: 1500, height: 500, logo: "wordmark", logoScale: 0.4, exportPath: "twitter-banner" },
    { name: "LinkedIn", width: 1584, height: 396, logo: "wordmark", logoScale: 0.4, exportPath: "linkedin-banner" },
    { name: "GitHub", width: 1280, height: 640, logo: "wordmark", logoScale: 0.5, exportPath: "github-social" },
    { name: "Discord", width: 960, height: 540, logo: "wordmark", logoScale: 0.5, exportPath: "discord-banner" },
    { name: "YouTube", width: 2560, height: 1440, logo: "wordmark", logoScale: 0.35, exportPath: "youtube-banner" },
    { name: "Facebook", width: 820, height: 312, logo: "wordmark", logoScale: 0.5, exportPath: "facebook-cover" },
    { name: "Instagram", width: 1080, height: 1080, logo: "nio", logoScale: 0.4, exportPath: "instagram-post" },
    { name: "TikTok", width: 1080, height: 1920, logo: "nio", logoScale: 0.3, exportPath: "tiktok-cover" },
    { name: "ProductHunt", width: 1270, height: 760, logo: "wordmark", logoScale: 0.5, exportPath: "producthunt-gallery" }
  ];
  async function buildSocialAssets() {
    await loadLogoFont();
    const page = getOrCreatePage("Social");
    figma.currentPage = page;
    let offsetX = 0;
    for (const spec of PLATFORMS) {
      const frame = figma.createFrame();
      frame.name = `Social/${spec.name}`;
      frame.resize(spec.width, spec.height);
      frame.fills = [solidPaint(COLORS.black)];
      frame.x = offsetX;
      frame.y = 0;
      const targetWidth = spec.width * spec.logoScale;
      const label = spec.logo === "wordmark" ? "niotebook" : "nio";
      const estFontSize = targetWidth / (0.65 * label.length);
      const fontSize = Math.round(Math.max(estFontSize, 24));
      const { frame: logoFrame, text, bar } = buildLogoGroup(label, fontSize);
      applyVariantColors(text, bar, "Dark");
      logoFrame.x = (spec.width - logoFrame.width) / 2;
      logoFrame.y = (spec.height - logoFrame.height) / 2;
      frame.appendChild(logoFrame);
      frame.guides = [
        { axis: "X", offset: spec.width * 0.2 },
        { axis: "X", offset: spec.width * 0.8 },
        { axis: "Y", offset: spec.height * 0.2 },
        { axis: "Y", offset: spec.height * 0.8 }
      ];
      addExports(frame, [pngExport(1)]);
      page.appendChild(frame);
      offsetX += spec.width + 100;
    }
    figma.notify(`\u2713 ${PLATFORMS.length} social frames created`);
  }

  // src/appIcon.ts
  async function buildAppIcon() {
    await loadLogoFont();
    const page = getOrCreatePage("App Icons");
    figma.currentPage = page;
    const SIZE = 1024;
    const RADIUS = 180;
    const frame = figma.createFrame();
    frame.name = "App Icon/Master";
    frame.resize(SIZE, SIZE);
    frame.cornerRadius = RADIUS;
    frame.fills = [solidPaint(COLORS.black)];
    frame.clipsContent = true;
    const targetWidth = SIZE * 0.6;
    const fontSize = Math.round(targetWidth / (0.65 * 3));
    const { frame: logoFrame, text, bar } = buildLogoGroup("nio", fontSize);
    applyVariantColors(text, bar, "Accent");
    logoFrame.x = (SIZE - logoFrame.width) / 2;
    logoFrame.y = (SIZE - logoFrame.height) / 2;
    frame.appendChild(logoFrame);
    const sizes = [1024, 512, 192, 180, 152, 144, 120, 96, 72, 48];
    addExports(
      frame,
      sizes.map((s) => {
        const scale = s / SIZE;
        return pngExport(scale, `-${s}`);
      })
    );
    page.appendChild(frame);
    figma.notify("\u2713 App icon master created");
  }

  // src/favicon.ts
  var FAVICONS = [
    { name: "apple-touch-icon", size: 180, padding: 20 },
    { name: "android-chrome-192", size: 192, padding: 24 },
    { name: "android-chrome-512", size: 512, padding: 60 },
    { name: "favicon-32", size: 32, padding: 4 },
    { name: "favicon-16", size: 16, padding: 2 }
  ];
  async function buildFavicons() {
    await loadLogoFont();
    const page = getOrCreatePage("App Icons");
    figma.currentPage = page;
    let offsetX = 1200;
    for (const spec of FAVICONS) {
      const frame = figma.createFrame();
      frame.name = `Favicon/${spec.name}`;
      frame.resize(spec.size, spec.size);
      frame.fills = [solidPaint(COLORS.black)];
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
    figma.notify(`\u2713 ${FAVICONS.length} favicon frames created`);
  }

  // src/badge.ts
  async function buildBadge() {
    await loadLogoFont();
    const page = getOrCreatePage("Logo System");
    figma.currentPage = page;
    const FONT = { family: "Orbitron", style: "Bold" };
    const FONT_SIZE = 14;
    const HEIGHT = 28;
    const PADDING = 8;
    const frame = figma.createFrame();
    frame.name = "Badge/niotebook-badge";
    frame.fills = [solidPaint(COLORS.gray900)];
    frame.cornerRadius = 4;
    frame.clipsContent = true;
    const nioText = figma.createText();
    nioText.fontName = FONT;
    nioText.fontSize = FONT_SIZE;
    nioText.characters = "nio";
    nioText.fills = [solidPaint(COLORS.green)];
    nioText.x = PADDING;
    nioText.y = (HEIGHT - FONT_SIZE) / 2;
    const sep = figma.createRectangle();
    sep.resize(1, HEIGHT * 0.6);
    sep.fills = [solidPaint(COLORS.gray700)];
    sep.x = nioText.x + nioText.width + PADDING;
    sep.y = HEIGHT * 0.2;
    const restText = figma.createText();
    restText.fontName = FONT;
    restText.fontSize = FONT_SIZE;
    restText.characters = "tebook";
    restText.fills = [solidPaint(COLORS.white)];
    restText.x = sep.x + sep.width + PADDING;
    restText.y = (HEIGHT - FONT_SIZE) / 2;
    const totalWidth = restText.x + restText.width + PADDING;
    frame.resize(totalWidth, HEIGHT);
    frame.appendChild(nioText);
    frame.appendChild(sep);
    frame.appendChild(restText);
    addExports(frame, [svgExport()]);
    frame.x = 0;
    frame.y = 600;
    page.appendChild(frame);
    figma.notify("\u2713 Badge created");
  }

  // src/email.ts
  async function buildEmailSig() {
    await loadLogoFont();
    const page = getOrCreatePage("App Icons");
    figma.currentPage = page;
    const WIDTH = 300;
    const FONT = { family: "Orbitron", style: "Bold" };
    const frame = figma.createFrame();
    frame.name = "Email/niotebook-email-sig";
    frame.fills = [solidPaint("#FFFFFF")];
    frame.clipsContent = true;
    const fontSize = Math.round(280 / (0.65 * 8));
    const text = figma.createText();
    text.fontName = FONT;
    text.fontSize = fontSize;
    text.characters = "niotebook";
    text.fills = [solidPaint(COLORS.black)];
    const height = fontSize * 1.4;
    frame.resize(WIDTH, height);
    text.x = (WIDTH - text.width) / 2;
    text.y = (height - fontSize) / 2;
    frame.appendChild(text);
    addExports(frame, [pngExport(2, "")]);
    frame.x = 0;
    frame.y = 700;
    page.appendChild(frame);
    figma.notify("\u2713 Email signature created");
  }

  // src/brandGuide.ts
  async function buildBrandGuide() {
    await loadLogoFont();
    try {
      await figma.loadFontAsync({ family: "Geist Mono", style: "Regular" });
    } catch {
      await figma.loadFontAsync({ family: "Roboto Mono", style: "Regular" });
    }
    const page = getOrCreatePage("Brand Guide");
    figma.currentPage = page;
    const SECTION_GAP = 120;
    const BODY_FONT = { family: "Geist Mono", style: "Regular" };
    const LOGO_FONT2 = { family: "Orbitron", style: "Bold" };
    let cursorY = 0;
    const title = figma.createText();
    title.fontName = LOGO_FONT2;
    title.fontSize = 48;
    title.characters = "Niotebook Brand Guide";
    title.fills = [solidPaint(COLORS.white)];
    title.y = cursorY;
    page.appendChild(title);
    cursorY += 80;
    const subtitle = figma.createText();
    subtitle.fontName = BODY_FONT;
    subtitle.fontSize = 16;
    subtitle.characters = "The interactive notebook for learning to code alongside video.";
    subtitle.fills = [solidPaint(COLORS.gray400)];
    subtitle.y = cursorY;
    page.appendChild(subtitle);
    cursorY += SECTION_GAP;
    const colorTitle = figma.createText();
    colorTitle.fontName = LOGO_FONT2;
    colorTitle.fontSize = 24;
    colorTitle.characters = "Colors";
    colorTitle.fills = [solidPaint(COLORS.white)];
    colorTitle.y = cursorY;
    page.appendChild(colorTitle);
    cursorY += 50;
    const SWATCH_SIZE = 80;
    const SWATCH_GAP = 20;
    for (let i = 0; i < COLOR_STYLES.length; i++) {
      const def = COLOR_STYLES[i];
      const x = i * (SWATCH_SIZE + SWATCH_GAP);
      const swatch = figma.createRectangle();
      swatch.name = def.name;
      swatch.resize(SWATCH_SIZE, SWATCH_SIZE);
      swatch.fills = [solidPaint(def.hex)];
      swatch.cornerRadius = 8;
      swatch.x = x;
      swatch.y = cursorY;
      if (["#FAFAFA", "#F5F5F5"].includes(def.hex)) {
        swatch.strokes = [solidPaint(COLORS.gray400)];
        swatch.strokeWeight = 1;
      }
      page.appendChild(swatch);
      const label = figma.createText();
      label.fontName = BODY_FONT;
      label.fontSize = 10;
      label.characters = `${def.name}
${def.hex}`;
      label.fills = [solidPaint(COLORS.gray400)];
      label.x = x;
      label.y = cursorY + SWATCH_SIZE + 8;
      page.appendChild(label);
    }
    cursorY += SWATCH_SIZE + 60 + SECTION_GAP;
    const typeTitle = figma.createText();
    typeTitle.fontName = LOGO_FONT2;
    typeTitle.fontSize = 24;
    typeTitle.characters = "Typography";
    typeTitle.fills = [solidPaint(COLORS.white)];
    typeTitle.y = cursorY;
    page.appendChild(typeTitle);
    cursorY += 50;
    const typeSpecs = [
      { label: "Logo / Wordmark", font: LOGO_FONT2, size: 32, sample: "niotebook" },
      { label: "UI Body / Code", font: BODY_FONT, size: 16, sample: "The quick brown fox jumps over the lazy dog" }
    ];
    for (const spec of typeSpecs) {
      const lbl = figma.createText();
      lbl.fontName = BODY_FONT;
      lbl.fontSize = 11;
      lbl.characters = `${spec.label} \u2014 ${spec.font.family} ${spec.font.style}`;
      lbl.fills = [solidPaint(COLORS.gray400)];
      lbl.y = cursorY;
      page.appendChild(lbl);
      cursorY += 24;
      const sample = figma.createText();
      sample.fontName = spec.font;
      sample.fontSize = spec.size;
      sample.characters = spec.sample;
      sample.fills = [solidPaint(COLORS.white)];
      sample.y = cursorY;
      page.appendChild(sample);
      cursorY += spec.size + 40;
    }
    cursorY += SECTION_GAP;
    const minTitle = figma.createText();
    minTitle.fontName = LOGO_FONT2;
    minTitle.fontSize = 24;
    minTitle.characters = "Minimum Sizes";
    minTitle.fills = [solidPaint(COLORS.white)];
    minTitle.y = cursorY;
    page.appendChild(minTitle);
    cursorY += 50;
    const rules = [
      "Wordmark minimum width: 120px",
      "Nio mark minimum size: 16px",
      'Clear space: 1\xD7 height of "n" on all sides'
    ];
    for (const rule of rules) {
      const r = figma.createText();
      r.fontName = BODY_FONT;
      r.fontSize = 14;
      r.characters = `\u2022 ${rule}`;
      r.fills = [solidPaint(COLORS.gray400)];
      r.y = cursorY;
      page.appendChild(r);
      cursorY += 28;
    }
    cursorY += SECTION_GAP;
    const dosTitle = figma.createText();
    dosTitle.fontName = LOGO_FONT2;
    dosTitle.fontSize = 24;
    dosTitle.characters = "Do's and Don'ts";
    dosTitle.fills = [solidPaint(COLORS.white)];
    dosTitle.y = cursorY;
    page.appendChild(dosTitle);
    cursorY += 50;
    const dos = [
      "\u2713 Use provided assets at original proportions",
      "\u2713 Place on solid backgrounds (black, white, near-neutral)",
      "\u2713 Use accent green only for interactive/active states"
    ];
    const donts = [
      "\u2717 Rotate, skew, or stretch the logo",
      "\u2717 Recolor outside the defined palette",
      "\u2717 Place on busy or patterned backgrounds",
      "\u2717 Remove or modify the gray bar",
      "\u2717 Display wordmark below minimum size",
      "\u2717 Add drop shadows, glows, or outlines"
    ];
    for (const line of [...dos, "", ...donts]) {
      if (line === "") {
        cursorY += 16;
        continue;
      }
      const t = figma.createText();
      t.fontName = BODY_FONT;
      t.fontSize = 14;
      t.characters = line;
      t.fills = [solidPaint(line.startsWith("\u2713") ? COLORS.green : "#FF4444")];
      t.y = cursorY;
      page.appendChild(t);
      cursorY += 28;
    }
    figma.notify("\u2713 Brand guide page created");
  }

  // src/main.ts
  async function buildStyles() {
    createColorStyles();
    await createTextStyles();
    figma.notify("\u2713 Color & text styles created");
  }
  async function buildLogos() {
    await buildWordmark();
    await buildNioMark();
    await buildBadge();
  }
  async function buildSocial() {
    await buildSocialAssets();
  }
  async function buildIcons() {
    await buildAppIcon();
    await buildFavicons();
    await buildEmailSig();
  }
  async function buildGuide() {
    await buildBrandGuide();
  }
  async function buildAll() {
    figma.notify("Building Niotebook brand system\u2026");
    await buildStyles();
    await buildLogos();
    await buildSocial();
    await buildIcons();
    await buildGuide();
    figma.notify("\u2713 Brand system complete!");
  }
  figma.on("run", async ({ command }) => {
    try {
      switch (command) {
        case "buildAll":
          await buildAll();
          break;
        case "buildStyles":
          await buildStyles();
          break;
        case "buildLogos":
          await buildLogos();
          break;
        case "buildSocial":
          await buildSocial();
          break;
        case "buildIcons":
          await buildIcons();
          break;
        case "buildGuide":
          await buildGuide();
          break;
        default:
          figma.notify(`Unknown command: ${command}`, { error: true });
      }
    } catch (err) {
      figma.notify(`Error: ${err.message}`, { error: true });
      console.error(err);
    } finally {
      figma.closePlugin();
    }
  });
})();
