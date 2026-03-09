/**
 * E2E utility — reads .e2e-seed.json written by e2e-seed.ts and exports
 * NIOTEBOOK_E2E_VIDEO_ID to the environment. Run after e2e-seed.ts.
 * In CI, pass --github to append the variable to GITHUB_ENV.
 */
import { appendFileSync, readFileSync } from "node:fs";

const main = (): void => {
  const raw = readFileSync(".e2e-seed.json", { encoding: "utf8" });
  const parsed = JSON.parse(raw) as { lessonId?: string };

  if (!parsed.lessonId) {
    throw new Error("Missing lessonId in .e2e-seed.json");
  }

  const lessonId = parsed.lessonId;
  if (process.argv.includes("--github")) {
    const envPath = process.env.GITHUB_ENV;
    if (!envPath) {
      throw new Error("GITHUB_ENV is required for --github output.");
    }

    appendFileSync(envPath, `NEXT_PUBLIC_DEFAULT_LESSON_ID=${lessonId}\n`, {
      encoding: "utf8",
    });
    return;
  }

  process.stdout.write(lessonId);
};

main();
