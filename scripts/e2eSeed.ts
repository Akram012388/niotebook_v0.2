import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const parseJson = (value: string): unknown => {
  return JSON.parse(value);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const previewName = process.env.CONVEX_PREVIEW_NAME ?? "e2e";

if (process.env.NODE_ENV === "production") {
  throw new Error("E2E seeding is not allowed in production.");
}

if (!process.env.CONVEX_DEPLOY_KEY) {
  throw new Error("CONVEX_DEPLOY_KEY is required for E2E preview seed.");
}

const runConvex = (command: string, args: string[]): string => {
  const base = ["npx", "convex", command];
  const previewArgs = ["--preview-name", previewName];
  const commandArgs = [...base, ...previewArgs, ...args];
  return execFileSync(commandArgs[0], commandArgs.slice(1), {
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });
};

const main = (): void => {
  runConvex("env", ["set", "NIOTEBOOK_DEV_AUTH_BYPASS", "true"]);
  runConvex("env", ["set", "NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS", "true"]);

  const rawLesson = runConvex("run", [
    "content:seedLesson",
    JSON.stringify({
      courseTitle: "E2E course",
      lessonTitle: "E2E lesson",
      videoId: "e2e-video",
      reuseExisting: false,
    }),
  ]);
  const parsed = parseJson(rawLesson);

  if (!isRecord(parsed) || typeof parsed.id !== "string") {
    throw new Error("seedLesson response missing id");
  }

  const lessonId = parsed.id;
  const rawThread = runConvex("run", [
    "chat:ensureChatThread",
    JSON.stringify({ lessonId }),
  ]);
  const threadId = parseJson(rawThread);

  if (typeof threadId !== "string") {
    throw new Error("ensureChatThread response missing id");
  }

  const seed = { lessonId, threadId: threadId.trim() };
  process.stdout.write(JSON.stringify(seed));

  if (process.env.NIOTEBOOK_E2E_SEED_PATH) {
    writeFileSync(process.env.NIOTEBOOK_E2E_SEED_PATH, JSON.stringify(seed), {
      encoding: "utf8",
    });
  }
};

main();
