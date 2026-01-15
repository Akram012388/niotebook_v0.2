import { mutationGeneric, queryGeneric, type IndexRangeBuilder } from "convex/server";
import { v } from "convex/values";
import {
  buildCodeSnapshotInsert,
  buildCodeSnapshotPatch,
  buildFrameInsert,
  buildFramePatch,
  resolveCodeSnapshotSummary,
  resolveFrameSummary,
  toCodeSnapshotSummary,
  toFrameSummary,
  type CodeSnapshotRecord,
  type CodeSnapshotSummary,
  type FrameRecord,
  type FrameSummary
} from "../src/domain/resume";

type FrameIndexFields = ["userId", "lessonId"];

type CodeSnapshotIndexFields = ["userId", "lessonId", "language"];

const getFrame = queryGeneric({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons")
  },
  handler: async (ctx, args): Promise<FrameSummary | null> => {
    const frame = (await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          FrameRecord,
          FrameIndexFields
        >;

        return typedQuery
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId);
      })
      .first()) as FrameRecord | null;

    return frame ? toFrameSummary(frame) : null;
  }
});

const upsertFrame = mutationGeneric({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    videoTimeSec: v.number(),
    threadId: v.optional(v.id("chatThreads")),
    codeHash: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<FrameSummary> => {
    const existing = (await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          FrameRecord,
          FrameIndexFields
        >;

        return typedQuery
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId);
      })
      .first()) as FrameRecord | null;

    const updatedAt = Date.now();
    const patch = buildFramePatch(args, updatedAt);
    const existingSummary = existing ? toFrameSummary(existing) : null;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return resolveFrameSummary(existing._id, existingSummary, args, updatedAt);
    }

    const frameId = await ctx.db.insert(
      "frames",
      buildFrameInsert(args, updatedAt)
    );

    return resolveFrameSummary(frameId, null, args, updatedAt);
  }
});

const getCodeSnapshot = queryGeneric({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    language: v.string()
  },
  handler: async (ctx, args): Promise<CodeSnapshotSummary | null> => {
    const snapshot = (await ctx.db
      .query("codeSnapshots")
      .withIndex("by_userId_lessonId_language", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          CodeSnapshotRecord,
          CodeSnapshotIndexFields
        >;

        return typedQuery
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId)
          .eq("language", args.language);
      })
      .first()) as CodeSnapshotRecord | null;

    return snapshot ? toCodeSnapshotSummary(snapshot) : null;
  }
});

const upsertCodeSnapshot = mutationGeneric({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    language: v.string(),
    code: v.string(),
    codeHash: v.string()
  },
  handler: async (ctx, args): Promise<CodeSnapshotSummary> => {
    const existing = (await ctx.db
      .query("codeSnapshots")
      .withIndex("by_userId_lessonId_language", (query) => {
        const typedQuery = query as IndexRangeBuilder<
          CodeSnapshotRecord,
          CodeSnapshotIndexFields
        >;

        return typedQuery
          .eq("userId", args.userId)
          .eq("lessonId", args.lessonId)
          .eq("language", args.language);
      })
      .first()) as CodeSnapshotRecord | null;

    const updatedAt = Date.now();
    const patch = buildCodeSnapshotPatch(args, updatedAt);

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return resolveCodeSnapshotSummary(existing._id, args, updatedAt);
    }

    const snapshotId = await ctx.db.insert(
      "codeSnapshots",
      buildCodeSnapshotInsert(args, updatedAt)
    );

    return resolveCodeSnapshotSummary(snapshotId, args, updatedAt);
  }
});

export { getCodeSnapshot, getFrame, upsertCodeSnapshot, upsertFrame };
