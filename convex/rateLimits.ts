import { mutation } from "./_generated/server";
import type { IndexRangeBuilder } from "convex/server";
import type { GenericId } from "convex/values";
import {
  AI_REQUEST_LIMIT,
  AI_REQUEST_WINDOW_MS,
  evaluateRateLimit,
  type RateLimitDecision,
  type RateLimitRecord,
  type RateLimitScope,
} from "../src/domain/rate-limits";
import { requireMutationUser } from "./auth";

type RateLimitDocument = {
  _id: GenericId<"rateLimits">;
  _creationTime: number;
  scope: RateLimitScope;
  subject: string;
  windowStartMs: number;
  count: number;
};

type RateLimitIndexFields = ["scope", "subject"];

type MutationDefinition = Parameters<typeof mutation>[0];

type MutationConfig = Extract<
  MutationDefinition,
  { handler: (...args: never[]) => unknown }
>;

type MutationCtx = Parameters<MutationConfig["handler"]>[0];

const toRateLimitRecord = (document: RateLimitDocument): RateLimitRecord => {
  return {
    scope: document.scope,
    subject: document.subject,
    windowStartMs: document.windowStartMs,
    count: document.count,
  };
};

const consumeRateLimit = async (
  ctx: MutationCtx,
  scope: RateLimitScope,
  subject: string,
  windowMs: number,
  limit: number,
): Promise<RateLimitDecision> => {
  const existing = (await ctx.db
    .query("rateLimits")
    .withIndex("by_scope_subject", (query) => {
      const typedQuery = query as unknown as IndexRangeBuilder<
        RateLimitDocument,
        RateLimitIndexFields
      >;

      return typedQuery.eq("scope", scope).eq("subject", subject);
    })
    .first()) as RateLimitDocument | null;

  const nowMs = Date.now();
  const evaluation = evaluateRateLimit(
    scope,
    subject,
    existing ? toRateLimitRecord(existing) : null,
    nowMs,
    windowMs,
    limit,
  );

  if (existing) {
    await ctx.db.patch(existing._id, {
      windowStartMs: evaluation.record.windowStartMs,
      count: evaluation.record.count,
    });
  } else {
    await ctx.db.insert("rateLimits", evaluation.record);
  }

  return evaluation.decision;
};

const consumeAiRateLimit = mutation({
  args: {},
  handler: async (ctx): Promise<RateLimitDecision> => {
    const user = await requireMutationUser(ctx);

    return consumeRateLimit(
      ctx,
      "ai_request",
      user.id,
      AI_REQUEST_WINDOW_MS,
      AI_REQUEST_LIMIT,
    );
  },
});

export { consumeAiRateLimit, consumeRateLimit };
