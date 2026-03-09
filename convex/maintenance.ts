import { internalMutation, mutation } from "./_generated/server";

type CleanupResult = {
  skipped: boolean;
  reason?: string;
  cutoffMs?: number;
  deletedMessages?: number;
  deletedEvents?: number;
};

const cleanupPreviewData = mutation({
  args: {},
  handler: async (ctx): Promise<CleanupResult> => {
    if (process.env.NIOTEBOOK_PREVIEW_DATA !== "true") {
      return {
        skipped: true,
        reason: "NIOTEBOOK_PREVIEW_DATA not enabled",
      };
    }

    const cutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const staleMessages = await ctx.db
      .query("chatMessages")
      .filter((q) => q.lt(q.field("createdAt"), cutoffMs))
      .collect();

    for (const message of staleMessages) {
      await ctx.db.delete(message._id);
    }

    const staleEvents = await ctx.db
      .query("events")
      .filter((q) => q.lt(q.field("createdAt"), cutoffMs))
      .collect();

    for (const event of staleEvents) {
      await ctx.db.delete(event._id);
    }

    return {
      skipped: false,
      cutoffMs,
      deletedMessages: staleMessages.length,
      deletedEvents: staleEvents.length,
    };
  },
});

// Removes rateLimits records with stale windowStartMs (older than 24 hours)
export const cleanupStaleRateLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
    const stale = await ctx.db
      .query("rateLimits")
      .withIndex("by_windowStartMs", (q) => q.lt("windowStartMs", cutoffMs))
      .take(500);
    for (const record of stale) {
      await ctx.db.delete(record._id);
    }
    console.log(
      `[maintenance] cleanupStaleRateLimits: deleted=${stale.length}, hasMore=${stale.length === 500}`,
    );
    return { deleted: stale.length, hasMore: stale.length === 500 };
  },
});

// Removes frames records not updated in 30 days
export const cleanupStaleFrames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const stale = await ctx.db
      .query("frames")
      .withIndex("by_updatedAt", (q) => q.lt("updatedAt", cutoffMs))
      .take(500);
    for (const record of stale) {
      await ctx.db.delete(record._id);
    }
    console.log(
      `[maintenance] cleanupStaleFrames: deleted=${stale.length}, hasMore=${stale.length === 500}`,
    );
    return { deleted: stale.length, hasMore: stale.length === 500 };
  },
});

export { cleanupPreviewData };
