import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { FEEDBACK_LIMIT, FEEDBACK_WINDOW_MS } from "../src/domain/rate-limits";
import { requireMutationUser, requireQueryAdmin } from "./auth";
import { toGenericId } from "./idUtils";
import { consumeRateLimit } from "./rateLimits";

const submit = mutation({
  args: {
    category: v.string(),
    rating: v.number(),
    notes: v.optional(v.string()),
    lessonId: v.optional(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationUser(ctx);

    const decision = await consumeRateLimit(
      ctx,
      "feedback",
      user.id,
      FEEDBACK_WINDOW_MS,
      FEEDBACK_LIMIT,
    );
    if (!decision.ok) {
      throw new Error("Feedback rate limit exceeded. Please try again later.");
    }

    const id = await ctx.db.insert("feedback", {
      userId: toGenericId(user.id),
      category: args.category,
      rating: args.rating,
      notes: args.notes,
      lessonId: args.lessonId,
      createdAt: Date.now(),
    });

    return id;
  },
});

const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireQueryAdmin(ctx);

    return ctx.db.query("feedback").order("desc").collect();
  },
});

export { submit, listAll };
