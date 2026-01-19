import { defineConfig } from "@playwright/test";

const isCi = Boolean(process.env.CI);
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";
const useWebServer = isCi || process.env.E2E_USE_WEBSERVER === "true";

const webServerEnv: Record<string, string> = {
  NEXT_PUBLIC_DISABLE_CONVEX: "false",
  NODE_ENV: "development",
  CONVEX_PREVIEW_NAME: process.env.CONVEX_PREVIEW_NAME ?? "e2e",
  NIOTEBOOK_DEV_AUTH_BYPASS: "true",
  NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS: "true",
  NIOTEBOOK_E2E_SEED_PATH: ".e2e-seed.json",
};

if (process.env.CONVEX_DEPLOYMENT) {
  webServerEnv.CONVEX_DEPLOYMENT = process.env.CONVEX_DEPLOYMENT;
}

if (process.env.NEXT_PUBLIC_CONVEX_URL) {
  webServerEnv.NEXT_PUBLIC_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
}

if (process.env.CONVEX_DEPLOY_KEY) {
  webServerEnv.CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY;
}

if (process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID) {
  webServerEnv.NEXT_PUBLIC_DEFAULT_LESSON_ID =
    process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID;
}

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  retries: isCi ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: useWebServer
    ? {
        command:
          "bun run e2e:convex:push && node ./scripts/e2eSeed.ts && NEXT_PUBLIC_DEFAULT_LESSON_ID=$(node ./scripts/e2eEnv.ts) bun run dev",
        port: 3000,
        reuseExistingServer: false,
        env: webServerEnv,
      }
    : undefined,
});
