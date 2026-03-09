/**
 * E2E utility — calls seed:seedE2E on Convex to create a fresh lesson fixture
 * and writes the result to .e2e-seed.json (or NIOTEBOOK_E2E_SEED_PATH).
 * Run before e2e-env.ts. Blocked in production.
 *
 * Usage: CONVEX_URL=<url> NIOTEBOOK_INGEST_TOKEN=<token> bun ./scripts/e2e-seed.ts
 */
import { writeFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

if (process.env.NODE_ENV === "production") {
  throw new Error("E2E seeding is not allowed in production.");
}

const seedE2E = "seed:seedE2E" as unknown as FunctionReference<"mutation">;

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required for E2E seeding.`);
  }
  return value;
};

const main = async (): Promise<void> => {
  const convexUrl = ensureEnv("CONVEX_URL");
  const ingestToken = ensureEnv("NIOTEBOOK_INGEST_TOKEN");
  const videoId = ensureEnv("NIOTEBOOK_E2E_VIDEO_ID");
  const client = new ConvexHttpClient(convexUrl, {
    skipConvexDeploymentUrlCheck: true,
  });

  const seed = (await client.mutation(seedE2E, {
    ingestToken,
    videoId,
  } as never)) as { lessonId: string; threadId: string };
  process.stdout.write(JSON.stringify(seed));

  if (process.env.NIOTEBOOK_E2E_SEED_PATH) {
    writeFileSync(process.env.NIOTEBOOK_E2E_SEED_PATH, JSON.stringify(seed), {
      encoding: "utf8",
    });
  }
};

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exit(1);
});
