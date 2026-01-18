import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  buildCodeSnapshotPatch,
  buildFramePatch,
  resolveCodeSnapshotSummary,
  resolveFrameSummary,
  toCodeSnapshotSummary,
  toFrameSummary,
  type CodeSnapshotRecord,
  type CodeSnapshotSummary,
  type FrameRecord,
  type FrameSummary,
} from "../src/domain/resume";
import { requireMutationUser, requireQueryUser } from "./auth";
import { toDomainId, toGenericId } from "./idUtils";

type FrameIndexFields = ["userId", "lessonId"];

type CodeSnapshotIndexFields = ["userId", "lessonId", "language"];

const getFrame = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args): Promise<FrameSummary | null> => {
    const user = await requireQueryUser(ctx);

    const frame = (await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery =
          query as unknown as import("convex/server").IndexRangeBuilder<
            FrameRecord,
            FrameIndexFields
          >;

        return typedQuery
          .eq("userId", toGenericId(user.id))
          .eq("lessonId", args.lessonId);
      })
      .first()) as FrameRecord | null;

    return frame ? toFrameSummary(frame) : null;
  },
});

const getLatestFrame = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args): Promise<FrameSummary | null> => {
    const user = await requireQueryUser(ctx);

    const frame = (await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery =
          query as unknown as import("convex/server").IndexRangeBuilder<
            FrameRecord,
            FrameIndexFields
          >;

        return typedQuery
          .eq("userId", toGenericId(user.id))
          .eq("lessonId", args.lessonId);
      })
      .first()) as FrameRecord | null;

    return frame ? toFrameSummary(frame) : null;
  },
});

const upsertFrame = mutation({
  args: {
    lessonId: v.id("lessons"),
    videoTimeSec: v.number(),
    threadId: v.optional(v.id("chatThreads")),
    codeHash: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<FrameSummary> => {
    const user = await requireMutationUser(ctx);

    const existing = (await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (query) => {
        const typedQuery =
          query as unknown as import("convex/server").IndexRangeBuilder<
            FrameRecord,
            FrameIndexFields
          >;

        return typedQuery
          .eq("userId", toGenericId(user.id))
          .eq("lessonId", args.lessonId);
      })
      .first()) as FrameRecord | null;

    const updatedAt = Date.now();
    const patchInput = {
      userId: toDomainId(toGenericId(user.id)),
      lessonId: toDomainId(args.lessonId),
      videoTimeSec: args.videoTimeSec,
      threadId: args.threadId ? toDomainId(args.threadId) : undefined,
      codeHash: args.codeHash,
    };

    const patch = buildFramePatch(patchInput, updatedAt);
    const existingSummary = existing ? toFrameSummary(existing) : null;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return resolveFrameSummary(
        toDomainId(existing._id as GenericId<"frames">),
        existingSummary,
        patchInput,
        updatedAt,
      );
    }

    const insertInput = {
      userId: toDomainId(toGenericId(user.id)),
      lessonId: toDomainId(args.lessonId),
      videoTimeSec: args.videoTimeSec,
      threadId: args.threadId ? toDomainId(args.threadId) : undefined,
      codeHash: args.codeHash,
    };

    const insertPayload = {
      userId: toGenericId(insertInput.userId) as GenericId<"users">,
      lessonId: toGenericId(insertInput.lessonId) as GenericId<"lessons">,
      videoTimeSec: insertInput.videoTimeSec,
      threadId: insertInput.threadId
        ? (toGenericId(insertInput.threadId) as GenericId<"chatThreads">)
        : undefined,
      codeHash: insertInput.codeHash,
      updatedAt,
    };

    const frameId = await ctx.db.insert("frames", insertPayload);

    return resolveFrameSummary(
      toDomainId(frameId as GenericId<"frames">),
      null,
      insertInput,
      updatedAt,
    );
  },
});

const getCodeSnapshot = query({
  args: {
    lessonId: v.id("lessons"),
    language: v.string(),
  },
  handler: async (ctx, args): Promise<CodeSnapshotSummary | null> => {
    const user = await requireQueryUser(ctx);

    const snapshot = (await ctx.db
      .query("codeSnapshots")
      .withIndex("by_userId_lessonId_language", (query) => {
        const typedQuery =
          query as unknown as import("convex/server").IndexRangeBuilder<
            CodeSnapshotRecord,
            CodeSnapshotIndexFields
          >;

        return typedQuery
          .eq("userId", toGenericId(user.id))
          .eq("lessonId", args.lessonId)
          .eq("language", args.language);
      })
      .first()) as CodeSnapshotRecord | null;

    return snapshot ? toCodeSnapshotSummary(snapshot) : null;
  },
});

const upsertCodeSnapshot = mutation({
  args: {
    lessonId: v.id("lessons"),
    language: v.string(),
    code: v.string(),
    codeHash: v.string(),
  },
  handler: async (ctx, args): Promise<CodeSnapshotSummary> => {
    const user = await requireMutationUser(ctx);

    const existing = (await ctx.db
      .query("codeSnapshots")
      .withIndex("by_userId_lessonId_language", (query) => {
        const typedQuery =
          query as unknown as import("convex/server").IndexRangeBuilder<
            CodeSnapshotRecord,
            CodeSnapshotIndexFields
          >;

        return typedQuery
          .eq("userId", toGenericId(user.id))
          .eq("lessonId", args.lessonId)
          .eq("language", args.language);
      })
      .first()) as CodeSnapshotRecord | null;

    const updatedAt = Date.now();
    const patchInput = {
      userId: toDomainId(toGenericId(user.id)),
      lessonId: toDomainId(args.lessonId),
      language: args.language,
      code: args.code,
      codeHash: args.codeHash,
    };

    const patch = buildCodeSnapshotPatch(patchInput, updatedAt);

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return resolveCodeSnapshotSummary(
        toDomainId(existing._id as GenericId<"codeSnapshots">),
        patchInput,
        updatedAt,
      );
    }

    const insertInput = {
      userId: toDomainId(toGenericId(user.id)),
      lessonId: toDomainId(args.lessonId),
      language: args.language,
      code: args.code,
      codeHash: args.codeHash,
    };

    const insertPayload = {
      userId: toGenericId(insertInput.userId) as GenericId<"users">,
      lessonId: toGenericId(insertInput.lessonId) as GenericId<"lessons">,
      language: insertInput.language,
      code: insertInput.code,
      codeHash: insertInput.codeHash,
      updatedAt,
    };

    const snapshotId = await ctx.db.insert("codeSnapshots", insertPayload);

    return resolveCodeSnapshotSummary(
      toDomainId(snapshotId as GenericId<"codeSnapshots">),
      insertInput,
      updatedAt,
    );
  },
});

export {
  getCodeSnapshot,
  getFrame,
  getLatestFrame,
  upsertCodeSnapshot,
  upsertFrame,
};
