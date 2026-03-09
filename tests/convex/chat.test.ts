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

describe("chat — completeAssistantMessage", () => {
  it("stores assistant message with all metadata fields", async () => {
    const { t, lessonId } = await seedChatFixture("cam-1");
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const threadId = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });

    const message = await tWithId.mutation(api.chat.completeAssistantMessage, {
      threadId,
      requestId: "req-cam-1",
      content: "Here is my answer.",
      videoTimeSec: 60,
      timeWindow: { startSec: 55, endSec: 65 },
      provider: "gemini",
      model: "gemini-pro",
      latencyMs: 350,
      usedFallback: false,
      contextHash: "abc123",
    });

    expect(message.role).toBe("assistant");
    expect(message.content).toBe("Here is my answer.");
    expect(message.provider).toBe("gemini");
    expect(message.model).toBe("gemini-pro");
    expect(message.latencyMs).toBe(350);
    expect(message.usedFallback).toBe(false);
    expect(message.contextHash).toBe("abc123");
    expect(message.requestId).toBe("req-cam-1");
  });

  it("is idempotent: calling twice with same requestId returns same message, no duplicate", async () => {
    const { t, lessonId } = await seedChatFixture("cam-2");
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const threadId = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });

    const args = {
      threadId,
      requestId: "req-cam-idempotent",
      content: "Idempotent response.",
      videoTimeSec: 10,
      timeWindow: { startSec: 5, endSec: 15 },
      provider: "gemini",
      model: "gemini-pro",
      latencyMs: 200,
      usedFallback: false,
      contextHash: "hash-idem",
    };

    const first = await tWithId.mutation(
      api.chat.completeAssistantMessage,
      args,
    );
    const second = await tWithId.mutation(
      api.chat.completeAssistantMessage,
      args,
    );

    // Both calls must return the same message id
    expect(first.id).toBe(second.id);

    // Only one message should exist in the thread
    const page = await tWithId.query(api.chat.getChatMessages, {
      threadId,
      limit: 10,
    });
    expect(page.messages).toHaveLength(1);
  });

  it("rejects calls from a user who does not own the thread", async () => {
    const OTHER_TOKEN = "https://convex.test|other-user-cam";
    const { t, lessonId } = await seedChatFixture("cam-3");

    const { threadId } = await t.run(async (ctx) => {
      const owner = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", TOKEN_IDENTIFIER),
        )
        .first();
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
        .mutation(api.chat.completeAssistantMessage, {
          threadId,
          requestId: "req-unauthorized",
          content: "Should not work.",
          videoTimeSec: 0,
          timeWindow: { startSec: 0, endSec: 0 },
          provider: "gemini",
          model: "gemini-pro",
          latencyMs: 100,
          usedFallback: false,
          contextHash: "noop",
        }),
    ).rejects.toThrow("Chat thread not accessible.");
  });
});

describe("chat — getChatMessages", () => {
  it("returns messages for the thread owner", async () => {
    const { t, lessonId } = await seedChatFixture("gcm-1");
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const threadId = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });

    await tWithId.mutation(api.chat.createChatMessage, {
      threadId,
      role: "user",
      content: "What is recursion?",
      videoTimeSec: 20,
      timeWindow: { startSec: 15, endSec: 25 },
    });

    const page = await tWithId.query(api.chat.getChatMessages, {
      threadId,
      limit: 10,
    });

    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].content).toBe("What is recursion?");
    expect(page.messages[0].role).toBe("user");
  });

  it("throws for a non-owner", async () => {
    const OTHER_TOKEN = "https://convex.test|other-user-gcm";
    const { t, lessonId } = await seedChatFixture("gcm-2");

    const { threadId } = await t.run(async (ctx) => {
      const owner = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", TOKEN_IDENTIFIER),
        )
        .first();
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
        .query(api.chat.getChatMessages, {
          threadId,
          limit: 10,
        }),
    ).rejects.toThrow("Chat thread not accessible.");
  });

  it("respects the 100-message cap", async () => {
    const { t, lessonId } = await seedChatFixture("gcm-3");
    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    const threadId = await tWithId.mutation(api.chat.ensureChatThread, {
      lessonId,
    });

    // Insert 110 messages directly via db to avoid mutation call overhead
    await t.run(async (ctx) => {
      for (let i = 0; i < 110; i++) {
        await ctx.db.insert("chatMessages", {
          threadId,
          role: "user",
          content: `Message ${i}`,
          videoTimeSec: i,
          timeWindowStartSec: 0,
          timeWindowEndSec: 0,
          createdAt: Date.now() + i,
        });
      }
    });

    // Request 150 — should be capped at 100
    const page = await tWithId.query(api.chat.getChatMessages, {
      threadId,
      limit: 150,
    });

    expect(page.messages.length).toBeLessThanOrEqual(100);
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
