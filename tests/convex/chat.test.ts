import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

const TOKEN_IDENTIFIER = "https://convex.test|user-chat-test";

/**
 * Seeds a course, lesson, and user into a fresh in-memory env.
 * Each test gets its own isolated env so state never leaks between tests.
 */
async function seedChatFixture(playlistSuffix: string) {
  const t = makeTestEnv();
  const lessonId = await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      sourcePlaylistId: `pl-${playlistSuffix}`,
      title: "Test Course",
      license: "MIT",
      sourceUrl: "https://example.com",
    });
    const lId = await ctx.db.insert("lessons", {
      courseId,
      videoId: `vid-${playlistSuffix}`,
      title: "Lesson",
      durationSec: 300,
      order: 1,
      transcriptStatus: "ok",
    });
    await ctx.db.insert("users", {
      tokenIdentifier: TOKEN_IDENTIFIER,
      role: "user",
    });
    return lId;
  });
  return { t, lessonId };
}

describe("chat — ensureChatThread", () => {
  it("creates a thread and returns its id", async () => {
    const { t, lessonId } = await seedChatFixture("1");

    const threadId = await t
      .withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER })
      .mutation(api.chat.ensureChatThread, { lessonId });

    expect(typeof threadId).toBe("string");
    expect(threadId.length).toBeGreaterThan(0);
  });

  it("is idempotent — returns the same thread id on repeated calls", async () => {
    const { t, lessonId } = await seedChatFixture("2");
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const threadId1 = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });
    const threadId2 = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });

    expect(threadId1).toBe(threadId2);
  });
});

describe("chat — createChatMessage", () => {
  it("stores a user message on the thread", async () => {
    const { t, lessonId } = await seedChatFixture("3");
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const threadId = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });

    const message = await tWithId.mutation(api.chat.createChatMessage, {
      threadId,
      role: "user",
      content: "What is a pointer?",
      videoTimeSec: 42,
      timeWindow: { startSec: 40, endSec: 50 },
    });

    expect(message.role).toBe("user");
    expect(message.content).toBe("What is a pointer?");
    expect(message.threadId).toBeTruthy();
  });

  it("rejects messages on a thread not owned by the caller", async () => {
    const OTHER_TOKEN = "https://convex.test|other-user";
    const { t, lessonId } = await seedChatFixture("4");

    // Create a thread owned by the seeded user, then try to post as another.
    const { threadId } = await t.run(async (ctx) => {
      const owner = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", TOKEN_IDENTIFIER),
        )
        .first();
      // Seed the second user so their auth resolves
      await ctx.db.insert("users", {
        tokenIdentifier: OTHER_TOKEN,
        role: "user",
      });
      const tid = await ctx.db.insert("chatThreads", {
        userId: owner!._id,
        lessonId,
      });
      return { threadId: tid };
    });

    await expect(
      t
        .withIdentity({ tokenIdentifier: OTHER_TOKEN })
        .mutation(api.chat.createChatMessage, {
          threadId,
          role: "user",
          content: "Should not work",
          videoTimeSec: 0,
          timeWindow: { startSec: 0, endSec: 0 },
        }),
    ).rejects.toThrow("Chat thread not accessible.");
  });
});
