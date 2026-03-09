import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { makeTestEnv, api } from "./setup";

const TEST_INGEST_TOKEN = "test-ingest-token-vitest";

beforeEach(() => {
  process.env.NIOTEBOOK_INGEST_TOKEN = TEST_INGEST_TOKEN;
});
afterEach(() => {
  delete process.env.NIOTEBOOK_INGEST_TOKEN;
});

/**
 * Seeds the CS50x course + 11 lessons with the given statuses (one per index).
 * lectureZero = index 0, lectureTen = index 10.
 * Inserts minimal transcript segments so window checks pass.
 */
async function seedIngestFixture(
  statuses: Array<"ok" | "warn" | "error" | "missing">,
) {
  const t = makeTestEnv();
  await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      sourcePlaylistId: "cs50x-2026",
      title: "CS50x",
      license: "CC BY-NC-SA",
      sourceUrl: "https://example.com",
    });
    for (let i = 0; i < statuses.length; i++) {
      await ctx.db.insert("lessons", {
        courseId,
        videoId: `vid-${i}`,
        title: `Lecture ${i}`,
        order: i + 1,
        durationSec: 3600,
        transcriptStatus: statuses[i],
        ...(i === 0
          ? { subtitlesUrl: "https://cdn.example.com/lectures/0/en.srt" }
          : {}),
        ...(i === 10
          ? { subtitlesUrl: "https://cdn.example.com/lectures/10/en.srt" }
          : {}),
      });
    }
    // Seed transcript segments so the window checks (0–60, 960–1020) pass
    const allLessons = await ctx.db.query("lessons").collect();
    const zeroLesson = allLessons.find((l) =>
      (l as { subtitlesUrl?: string }).subtitlesUrl?.includes("/lectures/0/"),
    );
    const tenLesson = allLessons.find((l) =>
      (l as { subtitlesUrl?: string }).subtitlesUrl?.includes("/lectures/10/"),
    );
    if (zeroLesson) {
      await ctx.db.insert("transcriptSegments", {
        lessonId: zeroLesson._id,
        idx: 0,
        startSec: 5,
        endSec: 30,
        textRaw: "hello world",
        textNormalized: "hello world",
      });
    }
    if (tenLesson) {
      await ctx.db.insert("transcriptSegments", {
        lessonId: tenLesson._id,
        idx: 0,
        startSec: 970,
        endSec: 990,
        textRaw: "lecture ten segment",
        textNormalized: "lecture ten segment",
      });
    }
  });
  return { t };
}

describe("verifyTranscriptWindows — errorCount/errorSlugs", () => {
  it("returns errorCount=0 when all lessons have ok or warn status", async () => {
    const statuses: Array<"ok" | "warn"> = Array.from({ length: 11 }).fill(
      "ok",
    ) as Array<"ok">;
    statuses[5] = "warn";
    const { t } = await seedIngestFixture(statuses);

    const result = await t.query(api.ingest.verifyTranscriptWindows, {
      ingestToken: TEST_INGEST_TOKEN,
    });

    expect(result.errorCount).toBe(0);
    expect(result.errorSlugs).toHaveLength(0);
  });

  it("counts only error lessons — excludes missing and warn", async () => {
    const statuses: Array<"ok" | "warn" | "error" | "missing"> = Array.from({
      length: 11,
    }).fill("ok") as Array<"ok">;
    statuses[2] = "error";
    statuses[4] = "missing";
    statuses[6] = "warn";
    statuses[7] = "error";
    const { t } = await seedIngestFixture(statuses);

    const result = await t.query(api.ingest.verifyTranscriptWindows, {
      ingestToken: TEST_INGEST_TOKEN,
    });

    expect(result.errorCount).toBe(2);
    expect(result.errorSlugs).toHaveLength(2);
    expect(result.errorSlugs).toContain("Lecture 2");
    expect(result.errorSlugs).toContain("Lecture 7");
    // "missing" and "warn" must NOT appear
    expect(result.errorSlugs).not.toContain("Lecture 4");
    expect(result.errorSlugs).not.toContain("Lecture 6");
  });

  it("throws on invalid ingest token", async () => {
    const { t } = await seedIngestFixture(
      Array.from({ length: 11 }).fill("ok") as Array<"ok">,
    );

    await expect(
      t.query(api.ingest.verifyTranscriptWindows, {
        ingestToken: "wrong-token",
      }),
    ).rejects.toThrow("Invalid ingest token");
  });
});
