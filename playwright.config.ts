import { defineConfig } from "@playwright/test";

const isCi = Boolean(process.env.CI);
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  retries: isCi ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: isCi
    ? undefined
    : {
        command: "bun run dev",
        port: 3000,
        reuseExistingServer: true
      }
});
