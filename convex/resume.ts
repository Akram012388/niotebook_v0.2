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

type ResumeEntry = {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  videoTimeSec: number;
  updatedAt: number;
};

const getResumeData = query({
  args: {},
  handler: async (ctx): Promise<ResumeEntry[]> => {
    const user = await requireQueryUser(ctx);

    const frames = (await ctx.db.query("frames").collect()) as Array<
      FrameRecord & { _id: GenericId<"frames"> }
    >;

    const userFrames = frames.filter(
      (f) =>
        (f.userId as unknown as string) ===
        (toGenericId(user.id) as unknown as string),
    );

    const latestByLesson = new Map<string, (typeof userFrames)[number]>();
    for (const frame of userFrames) {
      const key = frame.lessonId as unknown as string;
      const existing = latestByLesson.get(key);
      if (!existing || frame.updatedAt > existing.updatedAt) {
        latestByLesson.set(key, frame);
      }
    }

    const entries: ResumeEntry[] = [];
    for (const frame of latestByLesson.values()) {
      const lesson = await ctx.db.get(frame.lessonId as GenericId<"lessons">);
      if (!lesson) continue;
      const course = await ctx.db.get(lesson.courseId as GenericId<"courses">);
      if (!course) continue;

      const courseKey = lesson.courseId as unknown as string;
      const existingEntry = entries.find((e) => e.courseId === courseKey);
      if (existingEntry) {
        if (frame.updatedAt > existingEntry.updatedAt) {
          existingEntry.lessonId = toDomainId(
            lesson._id as GenericId<"lessons">,
          ) as unknown as string;
          existingEntry.lessonTitle = lesson.title as string;
          existingEntry.videoTimeSec = frame.videoTimeSec;
          existingEntry.updatedAt = frame.updatedAt;
        }
      } else {
        entries.push({
          courseId: toDomainId(
            lesson.courseId as GenericId<"courses">,
          ) as unknown as string,
          courseTitle: course.title as string,
          lessonId: toDomainId(
            lesson._id as GenericId<"lessons">,
          ) as unknown as string,
          lessonTitle: lesson.title as string,
          videoTimeSec: frame.videoTimeSec,
          updatedAt: frame.updatedAt,
        });
      }
    }

    return entries.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export type { ResumeEntry };
export {
  getCodeSnapshot,
  getLatestFrame,
  getResumeData,
  upsertCodeSnapshot,
  upsertFrame,
};
