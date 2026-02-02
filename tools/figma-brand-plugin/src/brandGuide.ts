import {
  loadLogoFont,
  getOrCreatePage,
  solidPaint,
  COLORS,
  COLOR_STYLES,
} from './utils'

/** Build a brand guide reference page. */
export async function buildBrandGuide() {
  await loadLogoFont()
  // Also load body font for descriptions
  try {
    await figma.loadFontAsync({ family: 'Geist Mono', style: 'Regular' })
  } catch {
    await figma.loadFontAsync({ family: 'Roboto Mono', style: 'Regular' })
  }

  const page = getOrCreatePage('Brand Guide')
  figma.currentPage = page

  const SECTION_GAP = 120
  const BODY_FONT: FontName = { family: 'Geist Mono', style: 'Regular' }
  const LOGO_FONT: FontName = { family: 'Orbitron', style: 'Bold' }
  let cursorY = 0

  // ── Title ──
  const title = figma.createText()
  title.fontName = LOGO_FONT
  title.fontSize = 48
  title.characters = 'Niotebook Brand Guide'
  title.fills = [solidPaint(COLORS.white)]
  title.y = cursorY
  page.appendChild(title)
  cursorY += 80

  const subtitle = figma.createText()
  subtitle.fontName = BODY_FONT
  subtitle.fontSize = 16
  subtitle.characters = 'The interactive notebook for learning to code alongside video.'
  subtitle.fills = [solidPaint(COLORS.gray400)]
  subtitle.y = cursorY
  page.appendChild(subtitle)
  cursorY += SECTION_GAP

  // ── Color Swatches ──
  const colorTitle = figma.createText()
  colorTitle.fontName = LOGO_FONT
  colorTitle.fontSize = 24
  colorTitle.characters = 'Colors'
  colorTitle.fills = [solidPaint(COLORS.white)]
  colorTitle.y = cursorY
  page.appendChild(colorTitle)
  cursorY += 50

  const SWATCH_SIZE = 80
  const SWATCH_GAP = 20

  for (let i = 0; i < COLOR_STYLES.length; i++) {
    const def = COLOR_STYLES[i]
    const x = i * (SWATCH_SIZE + SWATCH_GAP)

    const swatch = figma.createRectangle()
    swatch.name = def.name
    swatch.resize(SWATCH_SIZE, SWATCH_SIZE)
    swatch.fills = [solidPaint(def.hex)]
    swatch.cornerRadius = 8
    swatch.x = x
    swatch.y = cursorY
    // Add stroke for light colors
    if (['#FAFAFA', '#F5F5F5'].includes(def.hex)) {
      swatch.strokes = [solidPaint(COLORS.gray400)]
      swatch.strokeWeight = 1
    }
    page.appendChild(swatch)

    const label = figma.createText()
    label.fontName = BODY_FONT
    label.fontSize = 10
    label.characters = `${def.name}\n${def.hex}`
    label.fills = [solidPaint(COLORS.gray400)]
    label.x = x
    label.y = cursorY + SWATCH_SIZE + 8
    page.appendChild(label)
  }
  cursorY += SWATCH_SIZE + 60 + SECTION_GAP

  // ── Typography ──
  const typeTitle = figma.createText()
  typeTitle.fontName = LOGO_FONT
  typeTitle.fontSize = 24
  typeTitle.characters = 'Typography'
  typeTitle.fills = [solidPaint(COLORS.white)]
  typeTitle.y = cursorY
  page.appendChild(typeTitle)
  cursorY += 50

  const typeSpecs = [
    { label: 'Logo / Wordmark', font: LOGO_FONT, size: 32, sample: 'niotebook' },
    { label: 'UI Body / Code', font: BODY_FONT, size: 16, sample: 'The quick brown fox jumps over the lazy dog' },
  ]

  for (const spec of typeSpecs) {
    const lbl = figma.createText()
    lbl.fontName = BODY_FONT
    lbl.fontSize = 11
    lbl.characters = `${spec.label} — ${spec.font.family} ${spec.font.style}`
    lbl.fills = [solidPaint(COLORS.gray400)]
    lbl.y = cursorY
    page.appendChild(lbl)
    cursorY += 24

    const sample = figma.createText()
    sample.fontName = spec.font
    sample.fontSize = spec.size
    sample.characters = spec.sample
    sample.fills = [solidPaint(COLORS.white)]
    sample.y = cursorY
    page.appendChild(sample)
    cursorY += spec.size + 40
  }
  cursorY += SECTION_GAP

  // ── Minimum Sizes ──
  const minTitle = figma.createText()
  minTitle.fontName = LOGO_FONT
  minTitle.fontSize = 24
  minTitle.characters = 'Minimum Sizes'
  minTitle.fills = [solidPaint(COLORS.white)]
  minTitle.y = cursorY
  page.appendChild(minTitle)
  cursorY += 50

  const rules = [
    'Wordmark minimum width: 120px',
    'Nio mark minimum size: 16px',
    'Clear space: 1× height of "n" on all sides',
  ]
  for (const rule of rules) {
    const r = figma.createText()
    r.fontName = BODY_FONT
    r.fontSize = 14
    r.characters = `• ${rule}`
    r.fills = [solidPaint(COLORS.gray400)]
    r.y = cursorY
    page.appendChild(r)
    cursorY += 28
  }
  cursorY += SECTION_GAP

  // ── Do's and Don'ts ──
  const dosTitle = figma.createText()
  dosTitle.fontName = LOGO_FONT
  dosTitle.fontSize = 24
  dosTitle.characters = "Do's and Don'ts"
  dosTitle.fills = [solidPaint(COLORS.white)]
  dosTitle.y = cursorY
  page.appendChild(dosTitle)
  cursorY += 50

  const dos = [
    '✓ Use provided assets at original proportions',
    '✓ Place on solid backgrounds (black, white, near-neutral)',
    '✓ Use accent green only for interactive/active states',
  ]
  const donts = [
    '✗ Rotate, skew, or stretch the logo',
    '✗ Recolor outside the defined palette',
    '✗ Place on busy or patterned backgrounds',
    '✗ Remove or modify the gray bar',
    '✗ Display wordmark below minimum size',
    '✗ Add drop shadows, glows, or outlines',
  ]

  for (const line of [...dos, '', ...donts]) {
    if (line === '') { cursorY += 16; continue }
    const t = figma.createText()
    t.fontName = BODY_FONT
    t.fontSize = 14
    t.characters = line
    t.fills = [solidPaint(line.startsWith('✓') ? COLORS.green : '#FF4444')]
    t.y = cursorY
    page.appendChild(t)
    cursorY += 28
  }

  figma.notify('✓ Brand guide page created')
}
