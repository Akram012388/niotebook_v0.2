import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

const TOKEN = "https://convex.test|user-lc-test";
const ADMIN_TOKEN = "https://convex.test|admin-lc-test";

async function seedFixture() {
  const t = makeTestEnv();
  const ids = await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      sourcePlaylistId: "pl-lc",
      title: "Test Course",
      license: "MIT",
      sourceUrl: "https://example.com",
    });
    const lessonId = await ctx.db.insert("lessons", {
      courseId,
      videoId: "vid-lc",
      title: "Lesson 1",
      durationSec: 300,
      order: 1,
      transcriptStatus: "ok",
    });
    await ctx.db.insert("users", {
      tokenIdentifier: TOKEN,
      role: "user",
    });
    await ctx.db.insert("users", {
      tokenIdentifier: ADMIN_TOKEN,
      role: "admin",
    });
    return { courseId, lessonId };
  });
  return { t, ...ids };
}

describe("lessonCompletions — setLessonCompleted", () => {
  it("creates a new completion record and returns a summary", async () => {
    const { t, lessonId } = await seedFixture();

    const result = await t
      .withIdentity({ tokenIdentifier: TOKEN })
      .mutation(api.lessonCompletions.setLessonCompleted, {
        lessonId,
        completionMethod: "video",
        completionPct: 80,
      });

    expect(result.lessonId).toBeTruthy();
    expect(result.userId).toBeTruthy();
    expect(result.completionMethod).toBe("video");
    expect(result.completionPct).toBe(80);
    expect(result.completedAt).toBeTypeOf("number");
    expect(result.id).toBeTruthy();
  });

  it("updates an existing record on a second call (idempotent)", async () => {
    const { t, lessonId } = await seedFixture();
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN });

    const first = await tWithId.mutation(
      api.lessonCompletions.setLessonCompleted,
      { lessonId, completionMethod: "video", completionPct: 50 },
    );

    const second = await tWithId.mutation(
      api.lessonCompletions.setLessonCompleted,
      { lessonId, completionMethod: "code", completionPct: 100 },
    );

    // Both return the same underlying record (same id)
    expect(second.id).toBe(first.id);
    expect(second.completionMethod).toBe("code");
    expect(second.completionPct).toBe(100);
  });

  it("throws when called without authentication", async () => {
    const { t, lessonId } = await seedFixture();

    await expect(
      t.mutation(api.lessonCompletions.setLessonCompleted, {
        lessonId,
        completionMethod: "video",
      }),
    ).rejects.toThrow("Not authenticated.");
  });
});

describe("lessonCompletions — markComplete", () => {
  it("creates a completion with 100% pct and method video", async () => {
    const { t, lessonId } = await seedFixture();

    const result = await t
      .withIdentity({ tokenIdentifier: TOKEN })
      .mutation(api.lessonCompletions.markComplete, { lessonId });

    expect(result.completionMethod).toBe("video");
    expect(result.completionPct).toBe(100);
    expect(result.completedAt).toBeTypeOf("number");
    expect(result.id).toBeTruthy();
  });

  it("returns existing record if already completed", async () => {
    const { t, lessonId } = await seedFixture();
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN });

    const first = await tWithId.mutation(api.lessonCompletions.markComplete, {
      lessonId,
    });

    const second = await tWithId.mutation(api.lessonCompletions.markComplete, {
      lessonId,
    });

    expect(second.id).toBe(first.id);
    expect(second.completedAt).toBe(first.completedAt);
  });
});

describe("lessonCompletions — getCompletionsByCourse", () => {
  it("returns completions for the authenticated user", async () => {
    const { t, courseId, lessonId } = await seedFixture();
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN });

    // First create a completion
    await tWithId.mutation(api.lessonCompletions.setLessonCompleted, {
      lessonId,
      completionMethod: "video",
      completionPct: 75,
    });

    const completions = await tWithId.query(
      api.lessonCompletions.getCompletionsByCourse,
      { courseId },
    );

    expect(completions).toHaveLength(1);
    expect(completions[0].completionMethod).toBe("video");
    expect(completions[0].completionPct).toBe(75);
  });
});
