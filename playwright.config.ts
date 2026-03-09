import { defineConfig } from "@playwright/test";

const isCi = Boolean(process.env.CI);
const baseURL = process.env.BASE_URL?.trim() || "http://localhost:3000";
const useWebServer =
  (process.env.E2E_USE_WEBSERVER === "true" && !process.env.BASE_URL) ||
  (!process.env.BASE_URL && !isCi);

const webServerEnv: Record<string, string> = {
  NEXT_PUBLIC_DISABLE_CONVEX: "false",
  NODE_ENV: "development",
  CONVEX_PREVIEW_NAME: process.env.CONVEX_PREVIEW_NAME ?? "e2e",
  NIOTEBOOK_DEV_AUTH_BYPASS: "true",
  NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS: "true",
  NIOTEBOOK_E2E_SEED_PATH: ".e2e-seed.json",
  NIOTEBOOK_E2E_PREVIEW: "true",
  NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW: "true",
};

if (process.env.CONVEX_DEPLOYMENT) {
  webServerEnv.CONVEX_DEPLOYMENT = process.env.CONVEX_DEPLOYMENT;
}

if (process.env.NEXT_PUBLIC_CONVEX_URL) {
  webServerEnv.NEXT_PUBLIC_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
}

const previewDeployKey =
  process.env.CONVEX_DEPLOY_KEY ?? process.env.CONVEX_PREVIEW_DEPLOY_KEY;

if (previewDeployKey) {
  webServerEnv.CONVEX_DEPLOY_KEY = previewDeployKey;
}

if (process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID) {
  webServerEnv.NEXT_PUBLIC_DEFAULT_LESSON_ID =
    process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
}

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  retries: isCi ? 2 : 0,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      // Exclude mobile-specific test files so they don't run on desktop
      testMatch: /^(?!.*\.mobile\.e2e\.ts$).*\.e2e\.ts$/,
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      // Only run mobile-specific test files on the mobile project
      testMatch: "**/*.mobile.e2e.ts",
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
      },
    },
  ],
  webServer: useWebServer
    ? {
        command: [
          "bun run e2e:convex:push",
          "CONVEX_URL=$(cat .e2e-convex-url) bun ./scripts/e2eSeed.ts",
          "NEXT_PUBLIC_CONVEX_URL=$(cat .e2e-convex-url) NEXT_PUBLIC_DEFAULT_LESSON_ID=$(bun ./scripts/e2eEnv.ts) bun run dev",
        ].join(" && "),
        port: 3000,
        reuseExistingServer: false,
        env: webServerEnv,
      }
    : undefined,
});
