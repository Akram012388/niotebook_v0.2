import { spawnSync } from "node:child_process";
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

const getDeploymentArgs = (): string[] => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (convexUrl) {
    try {
      const host = new URL(convexUrl).hostname;
      const deploymentName = host.replace(".convex.cloud", "");
      if (deploymentName) {
        return ["--deployment-name", deploymentName];
      }
    } catch {
      // Fall back to preview name.
    }
  }

  return ["--preview-name", previewName];
};

const runConvex = (command: string, args: string[]): string => {
  const base = ["npx", "convex", command];
  const deploymentArgs = getDeploymentArgs();
  const commandArgs = [...base, ...deploymentArgs, ...args];
  const result = spawnSync(commandArgs[0], commandArgs.slice(1), {
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? "";
    throw new Error(stderr || "Convex command failed.");
  }

  return result.stdout?.toString() ?? "";
};

const main = (): void => {
  runConvex("env", ["set", "NIOTEBOOK_E2E_PREVIEW", "true"]);
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

  runConvex("run", [
    "chat:createChatMessage",
    JSON.stringify({
      threadId: threadId.trim(),
      role: "user",
      content: "hello e2e",
      videoTimeSec: 0,
      timeWindow: { startSec: 0, endSec: 60 },
    }),
  ]);

  const seed = { lessonId, threadId: threadId.trim() };
  process.stdout.write(JSON.stringify(seed));

  if (process.env.NIOTEBOOK_E2E_SEED_PATH) {
    writeFileSync(process.env.NIOTEBOOK_E2E_SEED_PATH, JSON.stringify(seed), {
      encoding: "utf8",
    });
  }
};

main();
