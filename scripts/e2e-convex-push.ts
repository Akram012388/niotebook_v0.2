/**
 * Deploy Convex to a preview deployment for E2E tests.
 *
 * 1. Stubs convex/auth.config.ts with empty providers (E2E uses dev auth
 *    bypass, not Clerk JWTs, and the Convex CLI validates that all env vars
 *    referenced in auth config are set on the deployment — which they can't
 *    be on a brand-new ephemeral preview).
 * 2. Pushes schema + functions via `convex deploy --preview-create <name>`.
 * 3. Sets required env vars on the freshly created preview.
 * 4. Writes the preview URL to `.e2e-convex-url` for downstream scripts.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

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

// ---------------------------------------------------------------------------
// Stub auth.config.ts — E2E uses dev auth bypass, not Clerk JWT validation.
// The Convex CLI requires all env vars referenced in auth config to be set
// on the target deployment, but ephemeral previews start with zero env vars.
// ---------------------------------------------------------------------------
const authConfigPath = "convex/auth.config.ts";
const originalAuthConfig = readFileSync(authConfigPath, "utf8");
writeFileSync(
  authConfigPath,
  [
    'import { AuthConfig } from "convex/server";',
    "export default { providers: [] } satisfies AuthConfig;",
    "",
  ].join("\n"),
);

console.log(`▸ Deploying to preview '${previewName}'...`);

let deployOutput: string;
try {
  deployOutput = execSync(
    `npx convex deploy --preview-create ${previewName} 2>&1`,
    { env: deployEnv, encoding: "utf8" },
  );
} catch (error) {
  const output =
    error instanceof Error && "stdout" in error
      ? String((error as NodeJS.ErrnoException & { stdout: unknown }).stdout)
      : "";
  if (output) process.stderr.write(output);
  console.error(`\n✖ 'convex deploy --preview-create ${previewName}' failed.`);
  // Restore original before exiting so local runs don't leave a dirty tree.
  writeFileSync(authConfigPath, originalAuthConfig);
  process.exit(1);
} finally {
  // Restore original auth config (CI checkouts are disposable, but be tidy).
  writeFileSync(authConfigPath, originalAuthConfig);
}
process.stdout.write(deployOutput);

const urlMatch = deployOutput.match(/https:\/\/[a-z0-9-]+\.convex\.cloud/);
if (!urlMatch) {
  console.error("✖ Could not extract preview URL from deploy output:");
  console.error(deployOutput);
  process.exit(1);
}
writeFileSync(".e2e-convex-url", urlMatch[0], { encoding: "utf8" });
console.log(`▸ Preview URL: ${urlMatch[0]}`);

// Set required env vars on the freshly created preview for runtime use.
console.log(`▸ Setting env vars on preview '${previewName}'...`);
const envVars: Record<string, string> = {
  NIOTEBOOK_INGEST_TOKEN: ingestToken,
  NIOTEBOOK_PREVIEW_DATA: "true",
  NIOTEBOOK_E2E_PREVIEW: "true",
  NIOTEBOOK_DEV_AUTH_BYPASS: "true",
};
for (const [key, value] of Object.entries(envVars)) {
  run(`npx convex env set ${key} "${value}" --preview-name ${previewName}`);
}

// Also set CLERK_JWT_ISSUER_DOMAIN if available (for runtime auth config).
const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (clerkDomain) {
  run(
    `npx convex env set CLERK_JWT_ISSUER_DOMAIN "${clerkDomain}" --preview-name ${previewName}`,
  );
}

console.log(`✔ Preview '${previewName}' is ready.`);
