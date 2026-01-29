import { mutation } from "./_generated/server";

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

export { cleanupPreviewData };
