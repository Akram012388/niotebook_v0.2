import { readFileSync } from "node:fs";

const main = (): void => {
  const raw = readFileSync(".e2e-seed.json", { encoding: "utf8" });
  const parsed = JSON.parse(raw) as { lessonId?: string };

  if (!parsed.lessonId) {
    throw new Error("Missing lessonId in .e2e-seed.json");
  }

  process.stdout.write(parsed.lessonId);
};

main();
