import { describe, it, expect, vi, afterEach } from "vitest";
import { makeTestEnv, api } from "./setup";
import {
  AI_REQUEST_LIMIT,
  AI_REQUEST_WINDOW_MS,
} from "../../src/domain/rate-limits";
import type { RateLimitDecision } from "../../src/domain/rate-limits";

const TOKEN_IDENTIFIER = "https://convex.test|user-ratelimit-test";

async function seedUser(t: ReturnType<typeof makeTestEnv>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: TOKEN_IDENTIFIER,
      role: "user",
    });
  });
}

describe("rateLimits — consumeAiRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request", async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const decision = await t
      .withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER })
      .mutation(api.rateLimits.consumeAiRateLimit);

    expect(decision.ok).toBe(true);
    expect(decision.remaining).toBe(AI_REQUEST_LIMIT - 1);
    expect(decision.limit).toBe(AI_REQUEST_LIMIT);
  });

  it(`allows all ${AI_REQUEST_LIMIT} requests within the window`, async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });
    let lastDecision: RateLimitDecision | undefined;
    for (let i = 0; i < AI_REQUEST_LIMIT; i++) {
      lastDecision = await tWithId.mutation(api.rateLimits.consumeAiRateLimit);
    }

    expect(lastDecision).toBeDefined();
    expect(lastDecision?.ok).toBe(true);
    expect(lastDecision?.remaining).toBe(0);
  });

  it(`denies request ${AI_REQUEST_LIMIT + 1} within the same window`, async () => {
    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    for (let i = 0; i < AI_REQUEST_LIMIT; i++) {
      await tWithId.mutation(api.rateLimits.consumeAiRateLimit);
    }

    const overLimit = await tWithId.mutation(api.rateLimits.consumeAiRateLimit);
    expect(overLimit.ok).toBe(false);
    expect(overLimit.remaining).toBe(0);
  });

  it("allows requests again after the window resets", async () => {
    vi.useFakeTimers();

    const t = makeTestEnv();
    await seedUser(t);

    const tWithId = t.withIdentity({ tokenIdentifier: TOKEN_IDENTIFIER });

    for (let i = 0; i < AI_REQUEST_LIMIT; i++) {
      await tWithId.mutation(api.rateLimits.consumeAiRateLimit);
    }
    const overLimit = await tWithId.mutation(api.rateLimits.consumeAiRateLimit);
    expect(overLimit.ok).toBe(false);

    vi.advanceTimersByTime(AI_REQUEST_WINDOW_MS + 1);

    const afterReset = await tWithId.mutation(
      api.rateLimits.consumeAiRateLimit,
    );
    expect(afterReset.ok).toBe(true);
    expect(afterReset.remaining).toBe(AI_REQUEST_LIMIT - 1);
  });
});
