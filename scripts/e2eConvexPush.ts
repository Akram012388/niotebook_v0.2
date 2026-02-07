/**
 * Deploy Convex to a preview deployment for E2E tests.
 *
 * 1. Pushes schema + functions via `convex deploy --preview-create <name>`.
 * 2. Sets required env vars on the freshly created preview.
 * 3. Writes the preview URL to `.e2e-convex-url` for downstream scripts.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required.`);
  return value;
};

const deployKey =
  process.env.CONVEX_DEPLOY_KEY ?? ensureEnv("CONVEX_PREVIEW_DEPLOY_KEY");
const previewName = process.env.CONVEX_PREVIEW_NAME ?? "e2e";
const ingestToken = ensureEnv("NIOTEBOOK_INGEST_TOKEN");

const deployEnv = { ...process.env, CONVEX_DEPLOY_KEY: deployKey };

const run = (cmd: string): void => {
  execSync(cmd, { stdio: "inherit", env: deployEnv });
};

console.log(`▸ Deploying to preview '${previewName}'...`);

// Capture combined stdout+stderr to extract the preview URL
const deployOutput = execSync(
  `npx convex deploy --preview-create ${previewName} 2>&1`,
  { env: deployEnv, encoding: "utf8" },
);
process.stdout.write(deployOutput);

const urlMatch = deployOutput.match(/https:\/\/[a-z0-9-]+\.convex\.cloud/);
if (urlMatch) {
  writeFileSync(".e2e-convex-url", urlMatch[0], { encoding: "utf8" });
  console.log(`▸ Preview URL: ${urlMatch[0]}`);
} else {
  console.error("⚠ Could not extract preview URL from deploy output.");
}

console.log(`▸ Setting env vars on preview '${previewName}'...`);
run(
  `npx convex env set NIOTEBOOK_INGEST_TOKEN "${ingestToken}" --preview-name ${previewName}`,
);
run(
  `npx convex env set NIOTEBOOK_PREVIEW_DATA "true" --preview-name ${previewName}`,
);

console.log(`✔ Preview '${previewName}' is ready.`);
