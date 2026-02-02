import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  TRANSCRIPT_START_PAD_SEC,
  toTranscriptWindowSegments,
  type TranscriptSegment,
} from "../src/domain/transcript";
import { toDomainId } from "./idUtils";

const COURSE_SOURCE_PLAYLIST_ID = "cs50x-2026";

type TranscriptSegmentRecord = {
  _id: GenericId<"transcriptSegments">;
  _creationTime: number;
  lessonId: GenericId<"lessons">;
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

type CourseRecord = {
  _id: GenericId<"courses">;
  sourcePlaylistId: string;
};

type LessonRecord = {
  _id: GenericId<"lessons">;
  order: number;
  videoId: string;
  subtitlesUrl?: string;
  transcriptUrl?: string;
  transcriptStatus?: "ok" | "warn" | "missing" | "error";
};

type UserRecord = {
  _id: GenericId<"users">;
  tokenIdentifier: string;
};

type ChatThreadRecord = {
  _id: GenericId<"chatThreads">;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
};

const ensureIngestToken = (ingestToken: string): void => {
  const expected = process.env.NIOTEBOOK_INGEST_TOKEN;
  if (!expected) {
    throw new Error("NIOTEBOOK_INGEST_TOKEN is not configured.");
  }
  if (ingestToken !== expected) {
    throw new Error("Invalid ingest token.");
  }
};

const toTranscriptSegment = (
  segment: TranscriptSegmentRecord,
): TranscriptSegment => {
  return {
    lessonId: toDomainId(segment.lessonId as GenericId<"lessons">),
    idx: segment.idx,
    startSec: segment.startSec,
    endSec: segment.endSec,
    textNormalized: segment.textNormalized,
  };
};

const verifyTranscriptWindows = query({
  args: {
    ingestToken: v.string(),
    defaultLessonId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    lectureTenCount: number;
    lectureZeroCount: number;
    lectureZeroLabel?: string;
  }> => {
    ensureIngestToken(args.ingestToken);

    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    const course = courses.find(
      (item) => item.sourcePlaylistId === COURSE_SOURCE_PLAYLIST_ID,
    );
    if (!course) {
      throw new Error("CS50x course not found in Convex.");
    }

    const lessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", course._id))
      .collect()) as LessonRecord[];

    const lectureZero =
      lessons.find((lesson) => lesson.subtitlesUrl?.includes("/lectures/0/")) ??
      lessons.find((lesson) => lesson.order === 1);

    if (!lectureZero) {
      throw new Error("Lecture 0 lesson not found in Convex.");
    }

    let lectureTen: LessonRecord | null = null;
    if (args.defaultLessonId) {
      try {
        const candidate = (await ctx.db.get(
          args.defaultLessonId as GenericId<"lessons">,
        )) as LessonRecord | null;
        if (candidate) {
          lectureTen = candidate;
        }
      } catch {
        lectureTen = null;
      }
    }

    if (!lectureTen) {
      lectureTen =
        lessons.find((lesson) =>
          lesson.subtitlesUrl?.includes("/lectures/10/"),
        ) ??
        lessons.find((lesson) =>
          lesson.transcriptUrl?.includes("/lectures/10/"),
        ) ??
        lessons.find((lesson) => lesson.order === 11) ??
        null;
    }

    if (!lectureTen) {
      throw new Error("Lecture 10 lesson not found in Convex.");
    }

    const readWindow = async (
      lessonId: GenericId<"lessons">,
      startSec: number,
      endSec: number,
    ): Promise<number> => {
      const lowerBound = Math.max(0, startSec - TRANSCRIPT_START_PAD_SEC);
      const segments = (await ctx.db
        .query("transcriptSegments")
        .withIndex("by_lessonId_startSec", (query) =>
          query
            .eq("lessonId", lessonId)
            .gte("startSec", lowerBound)
            .lte("startSec", endSec),
        )
        .collect()) as TranscriptSegmentRecord[];

      return toTranscriptWindowSegments(
        segments.map(toTranscriptSegment),
        startSec,
        endSec,
      ).length;
    };

    const lectureTenCount = await readWindow(lectureTen._id, 960, 1020);
    if (lectureTenCount === 0) {
      throw new Error("Transcript window empty for Lecture 10 (960-1020).");
    }

    let lectureZeroCount = await readWindow(lectureZero._id, 0, 60);
    let lectureZeroLabel: string | undefined = "Lecture 0";

    if (lectureZeroCount === 0) {
      const fallbackLesson = lessons.find(
        (lesson) =>
          lesson._id !== lectureZero._id &&
          (lesson.transcriptStatus === "ok" ||
            lesson.transcriptStatus === "warn"),
      );

      if (!fallbackLesson) {
        throw new Error("Transcript window empty for Lecture 0 (0-60).");
      }

      lectureZeroCount = await readWindow(fallbackLesson._id, 0, 60);
      lectureZeroLabel = `Lesson order ${fallbackLesson.order}`;

      if (lectureZeroCount === 0) {
        throw new Error(
          "Transcript window empty for Lecture 0 (0-60) and fallback lesson (0-60).",
        );
      }
    }

    return { lectureTenCount, lectureZeroCount, lectureZeroLabel };
  },
});

export { verifyTranscriptWindows };

const seedE2E = mutation({
  args: {
    ingestToken: v.string(),
    videoId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ lessonId: string; threadId: string }> => {
    if (process.env.NIOTEBOOK_PREVIEW_DATA !== "true") {
      throw new Error("E2E seed is only allowed in preview-data.");
    }

    ensureIngestToken(args.ingestToken);

    const user = (await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", "e2e-preview"),
      )
      .first()) as UserRecord | null;

    const userId = user
      ? user._id
      : await ctx.db.insert("users", {
          tokenIdentifier: "e2e-preview",
          email: "e2e@niotebook.local",
          role: "admin",
          inviteBatchId: "e2e-preview",
        });

    const existingCourse = (await ctx.db.query("courses").collect()).find(
      (course) => course.sourcePlaylistId === "e2e-preview",
    );

    const courseId = existingCourse
      ? existingCourse._id
      : await ctx.db.insert("courses", {
          sourcePlaylistId: "e2e-preview",
          title: "CS50x E2E",
          description: "Seeded for preview E2E runs.",
          license: "MIT",
          sourceUrl: "https://example.com",
        });

    const existingLessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", courseId))
      .collect()) as LessonRecord[];
    const existingLesson = existingLessons.find(
      (lesson) => lesson.videoId === args.videoId,
    );

    const lessonId = existingLesson
      ? existingLesson._id
      : await ctx.db.insert("lessons", {
          courseId,
          videoId: args.videoId,
          title: "E2E lesson",
          durationSec: 3600,
          order: 1,
          transcriptStatus: "missing",
        });

    const existingThread = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) =>
        query.eq("userId", userId).eq("lessonId", lessonId),
      )
      .first()) as ChatThreadRecord | null;

    const threadId = existingThread
      ? existingThread._id
      : await ctx.db.insert("chatThreads", {
          userId,
          lessonId,
        });

    await ctx.db.insert("chatMessages", {
      threadId,
      role: "user",
      content: "hello e2e",
      videoTimeSec: 0,
      timeWindowStartSec: 0,
      timeWindowEndSec: 60,
      createdAt: Date.now(),
    });

    return {
      lessonId: toDomainId(lessonId),
      threadId: toDomainId(threadId as GenericId<"chatThreads">),
    };
  },
});

export { seedE2E };

import { requireQueryAdmin } from "./auth";

type EventRow = {
  _id: string;
  _creationTime: number;
  userId?: string;
  lessonId?: string;
  sessionId?: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: number;
};

const getActiveUsers = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const userIds = new Set<string>();
    for (const event of events) {
      if (event.createdAt >= cutoff && event.userId) {
        userIds.add(String(event.userId));
      }
    }

    return userIds.size;
  },
});

const getSessionCount = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const sessionIds = new Set<string>();
    for (const event of events) {
      if (event.createdAt >= cutoff && event.sessionId) {
        sessionIds.add(event.sessionId);
      }
    }

    return sessionIds.size;
  },
});

const getAiRequestCount = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_type_createdAt", (q) =>
        q.eq("type", "nio_message_sent").gte("createdAt", cutoff),
      )
      .collect()) as unknown as EventRow[];

    return events.length;
  },
});

const getEventLog = query({
  args: { limit: v.number() },
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      id: string;
      type: string;
      userId?: string;
      sessionId?: string;
      createdAt: number;
    }>
  > => {
    await requireQueryAdmin(ctx);

    const events = (await ctx.db
      .query("events")
      .order("desc")
      .take(args.limit)) as unknown as EventRow[];

    return events.map((event) => ({
      id: String(event._id),
      type: event.type,
      userId: event.userId ? String(event.userId) : undefined,
      sessionId: event.sessionId,
      createdAt: event.createdAt,
    }));
  },
});

const getTotalLessons = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    await requireQueryAdmin(ctx);
    const lessons = await ctx.db.query("lessons").collect();
    return lessons.length;
  },
});

export {
  getActiveUsers,
  getSessionCount,
  getAiRequestCount,
  getEventLog,
  getTotalLessons,
};
