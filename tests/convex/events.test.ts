import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

const TOKEN = "https://convex.test|user-events-test";

async function seedFixture() {
  const t = makeTestEnv();
  const ids = await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      sourcePlaylistId: "pl-ev",
      title: "Test Course",
      license: "MIT",
      sourceUrl: "https://example.com",
    });
    const lessonId = await ctx.db.insert("lessons", {
      courseId,
      videoId: "vid-ev",
      title: "Lesson 1",
      durationSec: 300,
      order: 1,
      transcriptStatus: "ok",
    });
    await ctx.db.insert("users", {
      tokenIdentifier: TOKEN,
      role: "user",
    });
    return { courseId, lessonId };
  });
  return { t, ...ids };
}

describe("events — logEvent", () => {
  it("creates an event record and returns { ok: true, eventId }", async () => {
    const { t, courseId, lessonId } = await seedFixture();

    const result = await t
      .withIdentity({ tokenIdentifier: TOKEN })
      .mutation(api.events.logEvent, {
        eventType: "lesson_started",
        lessonId,
        metadata: { courseId, lessonId },
      });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.eventId).toBeTruthy();
    }
  });

  it("throws when called without authentication", async () => {
    const { t, courseId, lessonId } = await seedFixture();

    await expect(
      t.mutation(api.events.logEvent, {
        eventType: "lesson_started",
        lessonId,
        metadata: { courseId, lessonId },
      }),
    ).rejects.toThrow("Not authenticated.");
  });

  it("validates event metadata (rejects invalid metadata)", async () => {
    const { t, lessonId } = await seedFixture();

    // lesson_started requires courseId + lessonId in metadata;
    // passing empty metadata should fail validation
    const result = await t
      .withIdentity({ tokenIdentifier: TOKEN })
      .mutation(api.events.logEvent, {
        eventType: "lesson_started",
        lessonId,
        metadata: {},
      });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_EVENT_METADATA");
    }
  });

  it("includes userId in the persisted event", async () => {
    const { t, courseId, lessonId } = await seedFixture();

    await t
      .withIdentity({ tokenIdentifier: TOKEN })
      .mutation(api.events.logEvent, {
        eventType: "lesson_started",
        lessonId,
        metadata: { courseId, lessonId },
      });

    // Verify the event was stored with a userId
    const events = await t.run(async (ctx) => {
      return ctx.db.query("events").collect();
    });

    expect(events).toHaveLength(1);
    expect(events[0].userId).toBeTruthy();
    expect(events[0].type).toBe("lesson_started");
  });
});
