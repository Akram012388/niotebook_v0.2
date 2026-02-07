import { createDesignTokenVariables } from "./variables";
import { createColorStyles } from "./colors";
import { createTextStyles } from "./textStyles";
import { buildWordmark } from "./wordmark";
import { buildNioMark } from "./nioMark";
import { buildSocialAssets } from "./social";
import { buildAppIcon } from "./appIcon";
import { buildFavicons } from "./favicon";
import { buildBadge } from "./badge";
import { buildEmailSig } from "./email";
import { buildBrandGuide } from "./brandGuide";

async function buildTokens() {
  console.log("[niotebook] buildTokens: starting…");
  const refs = await createDesignTokenVariables();
  figma.notify(
    `✓ ${refs.colorVars.size} color + ${refs.sizeVars.size} size variables created`,
  );
  return refs;
}

async function buildStyles() {
  console.log("[niotebook] buildStyles: starting…");
  const refs = await createDesignTokenVariables();
  await createColorStyles(refs);
  await createTextStyles();
  figma.notify("✓ Design tokens, color & text styles created");
}

async function buildLogos() {
  console.log("[niotebook] buildLogos: starting…");
  await buildWordmark();
  await buildNioMark();
  await buildBadge();
}

async function buildSocial() {
  console.log("[niotebook] buildSocial: starting…");
  await buildSocialAssets();
}

async function buildIcons() {
  console.log("[niotebook] buildIcons: starting…");
  await buildAppIcon();
  await buildFavicons();
  await buildEmailSig();
}

async function buildGuide() {
  console.log("[niotebook] buildGuide: starting…");
  await buildBrandGuide();
}

async function buildAll() {
  console.log("[niotebook] buildAll: starting…");
  figma.notify("Building Niotebook brand system v2…");
  await buildStyles();
  await buildLogos();
  await buildSocial();
  await buildIcons();
  await buildGuide();
  figma.notify("✓ Brand system v2 complete!");
}

// ---------------------------------------------------------------------------
// Command router
// ---------------------------------------------------------------------------

figma.on("run", async ({ command }: RunEvent) => {
  console.log("[niotebook] plugin loaded, command:", command);
  try {
    switch (command) {
      case "buildAll":
        await buildAll();
        break;
      case "buildTokens":
        await buildTokens();
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
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("[niotebook] ERROR:", msg);
    console.error("[niotebook] STACK:", stack);
    figma.notify(`Error: ${msg}`, { error: true });
  } finally {
    figma.closePlugin();
  }
});
