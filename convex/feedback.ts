import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireMutationUser, requireQueryAdmin } from "./auth";
import { toGenericId } from "./idUtils";

const submit = mutation({
  args: {
    category: v.string(),
    rating: v.number(),
    notes: v.optional(v.string()),
    lessonId: v.optional(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    const user = await requireMutationUser(ctx);

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
