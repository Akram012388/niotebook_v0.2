import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import type { AuthenticatedUser } from "./auth";
import { requireMutationAdmin } from "./auth";
import { logEventInternal } from "./events";
import { toDomainId, toGenericId } from "./idUtils";

const transcriptStatusValidator = v.union(
  v.literal("ok"),
  v.literal("warn"),
  v.literal("missing"),
  v.literal("error"),
);

type CourseRecord = {
  _id: GenericId<"courses">;
  sourcePlaylistId: string;
  title: string;
  description?: string;
  license: string;
  sourceUrl: string;
  youtubePlaylistUrl?: string;
};

type LessonRecord = {
  _id: GenericId<"lessons">;
  courseId: GenericId<"courses">;
  videoId: string;
  title: string;
  durationSec: number;
  order: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
  transcriptDurationSec?: number;
  segmentCount?: number;
  ingestVersion?: number;
  transcriptStatus?: "ok" | "warn" | "missing" | "error";
};

type TranscriptSegmentRecord = {
  _id: GenericId<"transcriptSegments">;
  lessonId: GenericId<"lessons">;
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

type MutationDefinition = Parameters<typeof mutation>[0];

type MutationConfig = Extract<
  MutationDefinition,
  { handler: (...args: never[]) => unknown }
>;

type MutationCtx = Parameters<MutationConfig["handler"]>[0];

const ensureIngestAllowed = async (
  ctx: MutationCtx,
): Promise<AuthenticatedUser | null> => {
  const allowProdIngest = process.env.NIOTEBOOK_ALLOW_PROD_INGEST === "true";

  if (process.env.NODE_ENV === "production" && !allowProdIngest) {
    throw new Error("Production ingest requires NIOTEBOOK_ALLOW_PROD_INGEST.");
  }

  try {
    return await requireMutationAdmin(ctx);
  } catch (error) {
    if (process.env.NODE_ENV === "production" && allowProdIngest) {
      return null;
    }

    throw error;
  }
};

const ingestCs50x2026 = mutation({
  args: {
    course: v.object({
      sourcePlaylistId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      license: v.string(),
      sourceUrl: v.string(),
      youtubePlaylistUrl: v.optional(v.string()),
    }),
    lessons: v.array(
      v.object({
        order: v.number(),
        title: v.string(),
        videoId: v.string(),
        durationSec: v.number(),
        subtitlesUrl: v.optional(v.string()),
        transcriptUrl: v.optional(v.string()),
        transcriptDurationSec: v.optional(v.number()),
        segmentCount: v.optional(v.number()),
        ingestVersion: v.number(),
        transcriptStatus: transcriptStatusValidator,
        transcriptSegments: v.optional(
          v.array(
            v.object({
              idx: v.number(),
              startSec: v.number(),
              endSec: v.number(),
              textRaw: v.string(),
              textNormalized: v.string(),
            }),
          ),
        ),
      }),
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const admin = await ensureIngestAllowed(ctx);

    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    const existingCourse = courses.find(
      (course) => course.sourcePlaylistId === args.course.sourcePlaylistId,
    );

    const coursePayload = {
      sourcePlaylistId: args.course.sourcePlaylistId,
      title: args.course.title,
      description: args.course.description,
      license: args.course.license,
      sourceUrl: args.course.sourceUrl,
      youtubePlaylistUrl: args.course.youtubePlaylistUrl,
    };

    const courseId = existingCourse
      ? existingCourse._id
      : await ctx.db.insert("courses", coursePayload);

    if (existingCourse) {
      await ctx.db.patch(existingCourse._id, coursePayload);
    }

    const lessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", courseId))
      .collect()) as LessonRecord[];

    const lessonByOrder = new Map<number, LessonRecord>();

    for (const lesson of lessons) {
      lessonByOrder.set(lesson.order, lesson);
    }

    for (const lesson of args.lessons) {
      const existingLesson = lessonByOrder.get(lesson.order) ?? null;

      const lessonPayload = {
        courseId,
        videoId: lesson.videoId,
        title: lesson.title,
        durationSec: lesson.durationSec,
        order: lesson.order,
        subtitlesUrl: lesson.subtitlesUrl,
        transcriptUrl: lesson.transcriptUrl,
        transcriptDurationSec: lesson.transcriptDurationSec,
        segmentCount: lesson.segmentCount,
        ingestVersion: lesson.ingestVersion,
        transcriptStatus: lesson.transcriptStatus,
      } satisfies Omit<LessonRecord, "_id">;

      const shouldEmitSuccess =
        lesson.transcriptStatus === "ok" || lesson.transcriptStatus === "warn";

      const lessonId = existingLesson
        ? existingLesson._id
        : await ctx.db.insert("lessons", lessonPayload);

      if (existingLesson) {
        await ctx.db.patch(existingLesson._id, lessonPayload);
      }

      const shouldReplaceSegments =
        !existingLesson ||
        existingLesson.ingestVersion !== lesson.ingestVersion;

      if (shouldReplaceSegments) {
        const existingSegments = (await ctx.db
          .query("transcriptSegments")
          .withIndex("by_lessonId_idx", (query) =>
            query.eq("lessonId", lessonId),
          )
          .collect()) as TranscriptSegmentRecord[];

        for (const segment of existingSegments) {
          await ctx.db.delete(segment._id);
        }

        for (const segment of lesson.transcriptSegments ?? []) {
          await ctx.db.insert("transcriptSegments", {
            lessonId,
            idx: segment.idx,
            startSec: segment.startSec,
            endSec: segment.endSec,
            textRaw: segment.textRaw,
            textNormalized: segment.textNormalized,
          });
        }
      }

      if (admin && shouldReplaceSegments) {
        const lessonDomainId = toDomainId(lessonId as GenericId<"lessons">);

        await logEventInternal(ctx, {
          eventType: "transcript_ingest_started",
          lessonId,
          metadata: {
            lessonId: lessonDomainId,
          },
          userId: toGenericId(admin.id),
        });

        if (shouldEmitSuccess) {
          await logEventInternal(ctx, {
            eventType: "transcript_ingest_succeeded",
            lessonId,
            metadata: {
              lessonId: lessonDomainId,
              segmentCount: lesson.segmentCount ?? 0,
              transcriptDurationSec: lesson.transcriptDurationSec ?? 0,
            },
            userId: toGenericId(admin.id),
          });
        } else {
          await logEventInternal(ctx, {
            eventType: "transcript_ingest_failed",
            lessonId,
            metadata: {
              lessonId: lessonDomainId,
              reason:
                lesson.transcriptStatus === "missing" ? "missing" : "error",
            },
            userId: toGenericId(admin.id),
          });
        }

        if (
          lesson.transcriptStatus === "warn" &&
          typeof lesson.transcriptDurationSec === "number"
        ) {
          await logEventInternal(ctx, {
            eventType: "transcript_duration_warn",
            lessonId,
            metadata: {
              lessonId: lessonDomainId,
              lessonDurationSec: lesson.durationSec,
              transcriptDurationSec: lesson.transcriptDurationSec,
            },
            userId: toGenericId(admin.id),
          });
        }
      }
    }
  },
});

export { ingestCs50x2026 };
