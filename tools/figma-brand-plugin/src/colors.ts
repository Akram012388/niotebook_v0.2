import { COLOR_STYLES, solidPaint } from './utils'

/** Create all nio/* paint styles. Skips any that already exist. */
export function createColorStyles() {
  const existing = figma.getLocalPaintStyles().map(s => s.name)

  for (const def of COLOR_STYLES) {
    if (existing.includes(def.name)) continue
    const style = figma.createPaintStyle()
    style.name = def.name
    style.description = def.description
    style.paints = [solidPaint(def.hex)]
  }
}
