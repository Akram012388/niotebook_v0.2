import { COLOR_STYLES, solidPaint } from "./utils";
import type { VariableRefs } from "./variables";

/** Create all nio/* paint styles, optionally bound to Figma Variables. */
export async function createColorStyles(variableRefs?: VariableRefs) {
  const existingStyles = await figma.getLocalPaintStylesAsync();
  const existing = existingStyles.map((s) => s.name);

  for (const def of COLOR_STYLES) {
    if (existing.includes(def.name)) continue;

    const style = figma.createPaintStyle();
    style.name = def.name;
    style.description = def.description;

    let paint = solidPaint(def.hex);

    // Bind to variable if available
    if (variableRefs && def.tokenName) {
      const variable = variableRefs.colorVars.get(def.tokenName);
      if (variable) {
        paint = figma.variables.setBoundVariableForPaint(
          paint,
          "color",
          variable,
        );
      }
    }

    style.paints = [paint];
  }
}
