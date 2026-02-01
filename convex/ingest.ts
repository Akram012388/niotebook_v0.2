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

type LessonIngestMeta = {
  lessonId: GenericId<"lessons">;
  order: number;
  shouldReplaceSegments: boolean;
};

type MutationDefinition = Parameters<typeof mutation>[0];

type MutationConfig = Extract<
  MutationDefinition,
  { handler: (...args: never[]) => unknown }
>;

type MutationCtx = Parameters<MutationConfig["handler"]>[0];

const ensureIngestAllowed = async (
  ctx: MutationCtx,
  ingestToken?: string,
): Promise<AuthenticatedUser | null> => {
  const allowProdIngest = process.env.NIOTEBOOK_ALLOW_PROD_INGEST === "true";
  const expectedToken = process.env.NIOTEBOOK_INGEST_TOKEN;

  if (process.env.NODE_ENV === "production") {
    if (!allowProdIngest) {
      throw new Error(
        "Production ingest requires NIOTEBOOK_ALLOW_PROD_INGEST.",
      );
    }

    if (expectedToken && ingestToken === expectedToken) {
      return null;
    }
  }

  return requireMutationAdmin(ctx);
};

const getTranscriptMaxIdx = async (
  ctx: MutationCtx,
  lessonId: GenericId<"lessons">,
): Promise<number | null> => {
  const lastSegment = (await ctx.db
    .query("transcriptSegments")
    .withIndex("by_lessonId_idx", (query) => query.eq("lessonId", lessonId))
    .order("desc")
    .first()) as TranscriptSegmentRecord | null;

  return lastSegment ? lastSegment.idx : null;
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
    ingestToken: v.optional(v.string()),
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
      }),
    ),
  },
  handler: async (ctx, args): Promise<LessonIngestMeta[]> => {
    await ensureIngestAllowed(ctx, args.ingestToken);

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

    const ingestMeta: LessonIngestMeta[] = [];

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
        transcriptStatus:
          existingLesson?.transcriptStatus ?? lesson.transcriptStatus,
        transcriptDurationSec: existingLesson?.transcriptDurationSec,
        segmentCount: existingLesson?.segmentCount,
        ingestVersion: existingLesson?.ingestVersion,
      } satisfies Omit<LessonRecord, "_id">;

      const lessonId = existingLesson
        ? existingLesson._id
        : await ctx.db.insert("lessons", lessonPayload);

      if (existingLesson) {
        await ctx.db.patch(existingLesson._id, lessonPayload);
      }

      let shouldReplaceSegments =
        !existingLesson ||
        existingLesson.ingestVersion !== lesson.ingestVersion;

      if (!shouldReplaceSegments && existingLesson) {
        const expectedCount = lesson.segmentCount ?? 0;
        const maxIdx = await getTranscriptMaxIdx(ctx, existingLesson._id);
        if (expectedCount === 0) {
          shouldReplaceSegments = maxIdx !== null;
        } else if (maxIdx === null || maxIdx + 1 !== expectedCount) {
          shouldReplaceSegments = true;
        }
      }

      ingestMeta.push({
        lessonId,
        order: lesson.order,
        shouldReplaceSegments,
      });
    }

    return ingestMeta;
  },
});

const clearTranscriptSegmentsBatch = mutation({
  args: {
    lessonId: v.id("lessons"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    ingestToken: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ nextCursor: string | null; cleared: number }> => {
    await ensureIngestAllowed(ctx, args.ingestToken);

    const page = await ctx.db
      .query("transcriptSegments")
      .withIndex("by_lessonId_idx", (query) =>
        query.eq("lessonId", args.lessonId),
      )
      .paginate({
        cursor: args.cursor ?? null,
        numItems: args.limit ?? 500,
      });

    if (page.page.length === 0) {
      return {
        nextCursor: null,
        cleared: 0,
      };
    }

    for (const segment of page.page as TranscriptSegmentRecord[]) {
      await ctx.db.delete(segment._id);
    }

    return {
      nextCursor: page.continueCursor,
      cleared: page.page.length,
    };
  },
});

const ingestTranscriptSegmentsBatch = mutation({
  args: {
    lessonId: v.id("lessons"),
    ingestToken: v.optional(v.string()),
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
    await ensureIngestAllowed(ctx, args.ingestToken);

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
  },
});

const finalizeTranscriptIngest = mutation({
  args: {
    lessonId: v.id("lessons"),
    ingestVersion: v.number(),
    transcriptStatus: transcriptStatusValidator,
    transcriptDurationSec: v.optional(v.number()),
    segmentCount: v.optional(v.number()),
    durationSec: v.number(),
    ingestToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const admin = await ensureIngestAllowed(ctx, args.ingestToken);

    const shouldEmitSuccess =
      args.transcriptStatus === "ok" || args.transcriptStatus === "warn";

    await ctx.db.patch(args.lessonId, {
      ingestVersion: args.ingestVersion,
      transcriptStatus: args.transcriptStatus,
      transcriptDurationSec: args.transcriptDurationSec,
      segmentCount: args.segmentCount,
      durationSec: args.durationSec,
    });

    if (!admin) {
      return;
    }

    const lessonDomainId = toDomainId(args.lessonId as GenericId<"lessons">);

    await logEventInternal(ctx, {
      eventType: "transcript_ingest_started",
      lessonId: args.lessonId,
      metadata: {
        lessonId: lessonDomainId,
      },
      userId: toGenericId(admin.id),
    });

    if (shouldEmitSuccess) {
      await logEventInternal(ctx, {
        eventType: "transcript_ingest_succeeded",
        lessonId: args.lessonId,
        metadata: {
          lessonId: lessonDomainId,
          segmentCount: args.segmentCount ?? 0,
          transcriptDurationSec: args.transcriptDurationSec ?? 0,
        },
        userId: toGenericId(admin.id),
      });
    } else {
      await logEventInternal(ctx, {
        eventType: "transcript_ingest_failed",
        lessonId: args.lessonId,
        metadata: {
          lessonId: lessonDomainId,
          reason: args.transcriptStatus === "missing" ? "missing" : "error",
        },
        userId: toGenericId(admin.id),
      });
    }

    if (
      args.transcriptStatus === "warn" &&
      typeof args.transcriptDurationSec === "number"
    ) {
      await logEventInternal(ctx, {
        eventType: "transcript_duration_warn",
        lessonId: args.lessonId,
        metadata: {
          lessonId: lessonDomainId,
          lessonDurationSec: args.durationSec,
          transcriptDurationSec: args.transcriptDurationSec,
        },
        userId: toGenericId(admin.id),
      });
    }
  },
});

const environmentConfigValidator = v.optional(
  v.object({
    presetId: v.optional(v.string()),
    primaryLanguage: v.string(),
    allowedLanguages: v.array(v.string()),
    starterFiles: v.optional(
      v.array(
        v.object({
          path: v.string(),
          content: v.string(),
          readonly: v.boolean(),
        }),
      ),
    ),
    packages: v.optional(
      v.array(
        v.object({
          language: v.string(),
          name: v.string(),
          version: v.optional(v.string()),
        }),
      ),
    ),
    runtimeSettings: v.optional(
      v.object({
        timeoutMs: v.optional(v.number()),
        maxOutputBytes: v.optional(v.number()),
        stdinEnabled: v.optional(v.boolean()),
        compilerFlags: v.optional(v.array(v.string())),
      }),
    ),
  }),
);

const ingestCourse = mutation({
  args: {
    course: v.object({
      sourcePlaylistId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      license: v.string(),
      sourceUrl: v.string(),
      youtubePlaylistUrl: v.optional(v.string()),
    }),
    ingestToken: v.optional(v.string()),
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
        environmentConfig: environmentConfigValidator,
      }),
    ),
  },
  handler: async (ctx, args): Promise<LessonIngestMeta[]> => {
    await ensureIngestAllowed(ctx, args.ingestToken);

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

    const ingestMeta: LessonIngestMeta[] = [];

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
        transcriptStatus:
          existingLesson?.transcriptStatus ?? lesson.transcriptStatus,
        transcriptDurationSec: existingLesson?.transcriptDurationSec,
        segmentCount: existingLesson?.segmentCount,
        ingestVersion: existingLesson?.ingestVersion,
        environmentConfig: lesson.environmentConfig,
      };

      const lessonId = existingLesson
        ? existingLesson._id
        : await ctx.db.insert("lessons", lessonPayload);

      if (existingLesson) {
        await ctx.db.patch(existingLesson._id, lessonPayload);
      }

      let shouldReplaceSegments =
        !existingLesson ||
        existingLesson.ingestVersion !== lesson.ingestVersion;

      if (!shouldReplaceSegments && existingLesson) {
        const expectedCount = lesson.segmentCount ?? 0;
        const maxIdx = await getTranscriptMaxIdx(ctx, existingLesson._id);
        if (expectedCount === 0) {
          shouldReplaceSegments = maxIdx !== null;
        } else if (maxIdx === null || maxIdx + 1 !== expectedCount) {
          shouldReplaceSegments = true;
        }
      }

      ingestMeta.push({
        lessonId,
        order: lesson.order,
        shouldReplaceSegments,
      });
    }

    return ingestMeta;
  },
});

/**
 * One-off migration: fix CS50SQL sourcePlaylistId and re-ingest lessons
 * with the correct video IDs.
 *
 * Run once per deployment, then remove.
 */
const migrateCs50SqlPlaylistId = mutation({
  args: {
    oldSourcePlaylistId: v.string(),
    newSourcePlaylistId: v.string(),
    newYoutubePlaylistUrl: v.string(),
    lessons: v.array(
      v.object({
        order: v.number(),
        videoId: v.string(),
        title: v.string(),
        durationSec: v.number(),
        environmentConfig: environmentConfigValidator,
      }),
    ),
    ingestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureIngestAllowed(ctx, args.ingestToken);

    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    const course = courses.find(
      (c) => c.sourcePlaylistId === args.oldSourcePlaylistId,
    );

    if (!course) {
      throw new Error(
        `Course with sourcePlaylistId "${args.oldSourcePlaylistId}" not found`,
      );
    }

    // 1. Update the course record with the correct playlist ID
    await ctx.db.patch(course._id, {
      sourcePlaylistId: args.newSourcePlaylistId,
      youtubePlaylistUrl: args.newYoutubePlaylistUrl,
    });

    // 2. Update each lesson's videoId
    const lessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (q) => q.eq("courseId", course._id))
      .collect()) as LessonRecord[];

    const lessonByOrder = new Map<number, LessonRecord>();
    for (const l of lessons) {
      lessonByOrder.set(l.order, l);
    }

    const results: { order: number; videoId: string; updated: boolean }[] = [];

    for (const incoming of args.lessons) {
      const existing = lessonByOrder.get(incoming.order);
      if (existing) {
        await ctx.db.patch(existing._id, {
          videoId: incoming.videoId,
          title: incoming.title,
          durationSec: incoming.durationSec,
          environmentConfig: incoming.environmentConfig,
        });
        results.push({
          order: incoming.order,
          videoId: incoming.videoId,
          updated: true,
        });
      } else {
        await ctx.db.insert("lessons", {
          courseId: course._id,
          videoId: incoming.videoId,
          title: incoming.title,
          durationSec: incoming.durationSec,
          order: incoming.order,
          environmentConfig: incoming.environmentConfig,
          transcriptStatus: "missing" as const,
        });
        results.push({
          order: incoming.order,
          videoId: incoming.videoId,
          updated: false,
        });
      }
    }

    return { courseId: course._id, results };
  },
});

/**
 * One-off migration to fix incorrect video IDs for CS50AI, CS50P, and CS50W.
 * Also corrects CS50W's playlist ID.
 *
 * Run once per deployment, then remove.
 */
const migrateCs50VideoFixes = mutation({
  args: {
    ingestToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureIngestAllowed(ctx, args.ingestToken);

    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    const results: { course: string; fixes: string[] }[] = [];

    // --- CS50AI: fix lectures 4 and 6 ---
    const cs50ai = courses.find((c) => c.title.includes("CS50AI"));
    if (cs50ai) {
      const lessons = (await ctx.db
        .query("lessons")
        .withIndex("by_courseId", (q) => q.eq("courseId", cs50ai._id))
        .collect()) as LessonRecord[];
      const fixes: string[] = [];
      for (const l of lessons) {
        if (l.order === 4) {
          await ctx.db.patch(l._id, { videoId: "-g0iJjnO2_w" });
          fixes.push("order 4: -g0iJjnO2_w");
        }
        if (l.order === 6) {
          await ctx.db.patch(l._id, { videoId: "QAZc9xsQNjQ" });
          fixes.push("order 6: QAZc9xsQNjQ");
        }
      }
      results.push({ course: "CS50AI", fixes });
    }

    // --- CS50P: fix lectures 1, 2, and 9 ---
    const cs50p = courses.find((c) => c.title.includes("CS50P"));
    if (cs50p) {
      const lessons = (await ctx.db
        .query("lessons")
        .withIndex("by_courseId", (q) => q.eq("courseId", cs50p._id))
        .collect()) as LessonRecord[];
      const fixes: string[] = [];
      const videoFixes: Record<number, string> = {
        1: "_b6NgY_pMdw",
        2: "-7xg8pGcP6w",
        9: "6pgodt1mezg",
      };
      for (const l of lessons) {
        if (videoFixes[l.order]) {
          await ctx.db.patch(l._id, { videoId: videoFixes[l.order] });
          fixes.push(`order ${l.order}: ${videoFixes[l.order]}`);
        }
      }
      results.push({ course: "CS50P", fixes });
    }

    // --- CS50W: fix playlist ID + lectures 5, 7, 8 ---
    const cs50w = courses.find((c) => c.title.includes("CS50W"));
    if (cs50w) {
      await ctx.db.patch(cs50w._id, {
        sourcePlaylistId: "PLhQjrBD2T380xvFSUmToMMzERZ3qB5Ueu",
        youtubePlaylistUrl:
          "https://www.youtube.com/playlist?list=PLhQjrBD2T380xvFSUmToMMzERZ3qB5Ueu",
      });
      const lessons = (await ctx.db
        .query("lessons")
        .withIndex("by_courseId", (q) => q.eq("courseId", cs50w._id))
        .collect()) as LessonRecord[];
      const fixes: string[] = ["playlist ID updated"];
      const videoFixes: Record<number, string> = {
        5: "x5trGVMKTdY",
        7: "WbRDkJ4lPdY",
        8: "6PWTxRGh_dk",
      };
      for (const l of lessons) {
        if (videoFixes[l.order]) {
          await ctx.db.patch(l._id, { videoId: videoFixes[l.order] });
          fixes.push(`order ${l.order}: ${videoFixes[l.order]}`);
        }
      }
      results.push({ course: "CS50W", fixes });
    }

    return results;
  },
});

export {
  clearTranscriptSegmentsBatch,
  finalizeTranscriptIngest,
  ingestCourse,
  ingestCs50x2026,
  ingestTranscriptSegmentsBatch,
  migrateCs50SqlPlaylistId,
  migrateCs50VideoFixes,
};
