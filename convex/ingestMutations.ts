import type { IndexRangeBuilder } from "convex/server";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import type { TranscriptStatus } from "../src/domain/content";

const upsertLessonFromIngest = internalMutation({
  args: {
    courseId: v.id("courses"),
    videoId: v.string(),
    title: v.string(),
    durationSec: v.number(),
    order: v.number(),
    subtitlesUrl: v.optional(v.string()),
    transcriptUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    type LessonRecord = {
      _id: GenericId<"lessons">;
      _creationTime: number;
      courseId: GenericId<"courses">;
      videoId: string;
    };

    type LessonIndexFields = ["courseId"];

    const existing = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => {
        const typedQuery = query as unknown as IndexRangeBuilder<
          LessonRecord,
          LessonIndexFields
        >;

        return typedQuery.eq("courseId", args.courseId);
      })
      .filter((query) => query.eq(query.field("videoId"), args.videoId))
      .first()) as LessonRecord | null;

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        durationSec: args.durationSec,
        order: args.order,
        subtitlesUrl: args.subtitlesUrl,
        transcriptUrl: args.transcriptUrl,
      });
      return;
    }

    await ctx.db.insert("lessons", {
      courseId: args.courseId,
      videoId: args.videoId,
      title: args.title,
      durationSec: args.durationSec,
      order: args.order,
      subtitlesUrl: args.subtitlesUrl,
      transcriptUrl: args.transcriptUrl,
      transcriptStatus: "missing",
    });
  },
});

const applyTranscriptIngest = internalMutation({
  args: {
    lessonId: v.id("lessons"),
    transcriptStatus: v.union(
      v.literal("ok"),
      v.literal("warn"),
      v.literal("missing"),
      v.literal("error"),
    ),
    transcriptDurationSec: v.number(),
    segmentCount: v.number(),
    transcriptUrl: v.string(),
    subtitlesUrl: v.optional(v.string()),
    ingestVersion: v.number(),
    segments: v.array(
      v.object({
        idx: v.number(),
        startSec: v.number(),
        endSec: v.number(),
        textRaw: v.string(),
        textNormalized: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    type TranscriptSegmentRecord = {
      _id: GenericId<"transcriptSegments">;
      _creationTime: number;
      lessonId: GenericId<"lessons">;
      idx: number;
    };

    type TranscriptIndexFields = ["lessonId", "idx"];

    const existingSegments = (await ctx.db
      .query("transcriptSegments")
      .withIndex("by_lessonId_idx", (query) => {
        const typedQuery = query as unknown as IndexRangeBuilder<
          TranscriptSegmentRecord,
          TranscriptIndexFields
        >;

        return typedQuery.eq(
          "lessonId",
          args.lessonId as unknown as GenericId<"lessons">,
        );
      })
      .collect()) as TranscriptSegmentRecord[];

    for (const segment of existingSegments) {
      await ctx.db.delete(segment._id);
    }

    for (const segment of args.segments) {
      await ctx.db.insert("transcriptSegments", {
        lessonId: args.lessonId,
        idx: segment.idx,
        startSec: segment.startSec,
        endSec: segment.endSec,
        textRaw: segment.textRaw,
        textNormalized: segment.textNormalized,
      });
    }

    await ctx.db.patch(args.lessonId, {
      transcriptStatus: args.transcriptStatus as TranscriptStatus,
      transcriptDurationSec: args.transcriptDurationSec,
      segmentCount: args.segmentCount,
      transcriptUrl: args.transcriptUrl,
      subtitlesUrl: args.subtitlesUrl,
      ingestVersion: args.ingestVersion,
    });
  },
});

export { applyTranscriptIngest, upsertLessonFromIngest };
