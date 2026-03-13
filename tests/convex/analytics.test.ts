import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

const TOKEN = "https://convex.test|user-analytics-test";
const ADMIN_TOKEN = "https://convex.test|admin-analytics-test";

async function seedFixture() {
  const t = makeTestEnv();
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: TOKEN,
      role: "user",
    });
    await ctx.db.insert("users", {
      tokenIdentifier: ADMIN_TOKEN,
      role: "admin",
    });
    return { userId };
  });
  return { t, ...ids };
}

describe("analytics — getActiveUsers", () => {
  it("requires admin access (throws for regular user)", async () => {
    const { t } = await seedFixture();

    await expect(
      t
        .withIdentity({ tokenIdentifier: TOKEN })
        .query(api.analytics.getActiveUsers, { timeWindowMs: 3_600_000 }),
    ).rejects.toThrow("Admin access required.");
  });

  it("returns 0 when no events exist", async () => {
    const { t } = await seedFixture();

    const count = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .query(api.analytics.getActiveUsers, { timeWindowMs: 3_600_000 });

    expect(count).toBe(0);
  });

  it("returns correct unique user count within time window", async () => {
    const { t, userId } = await seedFixture();

    // Seed events for the user
    const now = Date.now();
    await t.run(async (ctx) => {
      // Two events for the same user — should count as 1 unique user
      await ctx.db.insert("events", {
        userId,
        type: "lesson_started",
        metadata: {},
        createdAt: now - 1000,
      });
      await ctx.db.insert("events", {
        userId,
        type: "lesson_started",
        metadata: {},
        createdAt: now - 2000,
      });

      // One event for a second user
      const user2 = await ctx.db.insert("users", {
        tokenIdentifier: "https://convex.test|user2-analytics",
        role: "user",
      });
      await ctx.db.insert("events", {
        userId: user2,
        type: "lesson_started",
        metadata: {},
        createdAt: now - 500,
      });
    });

    const count = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .query(api.analytics.getActiveUsers, { timeWindowMs: 3_600_000 });

    expect(count).toBe(2);
  });
});

describe("analytics — getSessionCount", () => {
  it("returns unique session count within time window", async () => {
    const { t, userId } = await seedFixture();

    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("events", {
        userId,
        sessionId: "session-a",
        type: "session_start",
        metadata: {},
        createdAt: now - 1000,
      });
      await ctx.db.insert("events", {
        userId,
        sessionId: "session-a",
        type: "lesson_started",
        metadata: {},
        createdAt: now - 800,
      });
      await ctx.db.insert("events", {
        userId,
        sessionId: "session-b",
        type: "session_start",
        metadata: {},
        createdAt: now - 500,
      });
    });

    const count = await t
      .withIdentity({ tokenIdentifier: ADMIN_TOKEN })
      .query(api.analytics.getSessionCount, { timeWindowMs: 3_600_000 });

    expect(count).toBe(2);
  });
});
