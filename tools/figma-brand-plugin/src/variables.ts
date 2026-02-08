// ---------------------------------------------------------------------------
// Figma Variable Collections for Niotebook v2 Design Tokens
// Creates semantic color + size variables with light/dark modes.
// Uses async API methods required by "documentAccess": "dynamic-page".
// ---------------------------------------------------------------------------

import { COLOR_TOKENS, SIZE_TOKENS } from "./tokens";

/** References returned after creating all variable collections. */
export interface VariableRefs {
  colorCollection: VariableCollection;
  sizeCollection: VariableCollection;
  lightModeId: string;
  darkModeId: string;
  sizeModeId: string;
  /** Token name → Variable (e.g. "background" → Variable) */
  colorVars: Map<string, Variable>;
  /** Token name → Variable (e.g. "radius-sm" → Variable) */
  sizeVars: Map<string, Variable>;
}

const COLOR_COLLECTION_NAME = "Niotebook/Color";
const SIZE_COLLECTION_NAME = "Niotebook/Size";

/**
 * Remove existing collections by name so the plugin is idempotent.
 * Running "Build All" twice won't duplicate collections.
 */
async function removeExistingCollections() {
  const locals = await figma.variables.getLocalVariableCollectionsAsync();
  for (const c of locals) {
    if (c.name === COLOR_COLLECTION_NAME || c.name === SIZE_COLLECTION_NAME) {
      // Remove all variables in the collection first
      for (const varId of c.variableIds) {
        const v = await figma.variables.getVariableByIdAsync(varId);
        if (v) v.remove();
      }
      c.remove();
    }
  }
}

/**
 * Create all Niotebook design token variable collections.
 *
 * - **Niotebook/Color** — ~30 semantic color tokens with Light + Dark modes
 * - **Niotebook/Size** — 5 border-radius tokens
 */
export async function createDesignTokenVariables(): Promise<VariableRefs> {
  await removeExistingCollections();

  // ── Color Collection ──
  const colorCollection = figma.variables.createVariableCollection(
    COLOR_COLLECTION_NAME,
  );

  // Rename the default mode to "Light"
  const lightModeId = colorCollection.defaultModeId;
  colorCollection.renameMode(lightModeId, "Light");

  // Add "Dark" mode
  const darkModeId = colorCollection.addMode("Dark");

  const colorVars = new Map<string, Variable>();

  for (const token of COLOR_TOKENS) {
    const variable = figma.variables.createVariable(
      `${token.group}/${token.name}`,
      colorCollection,
      "COLOR",
    );
    variable.description = token.description;
    variable.setValueForMode(lightModeId, token.light);
    variable.setValueForMode(darkModeId, token.dark);
    colorVars.set(token.name, variable);
  }

  // ── Size Collection ──
  const sizeCollection =
    figma.variables.createVariableCollection(SIZE_COLLECTION_NAME);

  const sizeModeId = sizeCollection.defaultModeId;
  sizeCollection.renameMode(sizeModeId, "Default");

  const sizeVars = new Map<string, Variable>();

  for (const token of SIZE_TOKENS) {
    const variable = figma.variables.createVariable(
      `${token.group}/${token.name}`,
      sizeCollection,
      "FLOAT",
    );
    variable.description = token.description;
    variable.setValueForMode(sizeModeId, token.value);
    sizeVars.set(token.name, variable);
  }

  return {
    colorCollection,
    sizeCollection,
    lightModeId,
    darkModeId,
    sizeModeId,
    colorVars,
    sizeVars,
  };
}
