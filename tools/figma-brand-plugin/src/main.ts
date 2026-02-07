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
  const refs = createDesignTokenVariables();
  figma.notify(
    `✓ ${refs.colorVars.size} color + ${refs.sizeVars.size} size variables created`,
  );
  return refs;
}

async function buildStyles() {
  const refs = createDesignTokenVariables();
  createColorStyles(refs);
  await createTextStyles();
  figma.notify("✓ Design tokens, color & text styles created");
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
    figma.notify(`Error: ${(err as Error).message}`, { error: true });
    console.error(err);
  } finally {
    figma.closePlugin();
  }
});
