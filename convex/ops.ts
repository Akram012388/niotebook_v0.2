import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  TRANSCRIPT_START_PAD_SEC,
  toTranscriptWindowSegments,
  type TranscriptSegment,
} from "../src/domain/transcript";
import { toDomainId, toGenericId } from "./idUtils";

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

    const lectureZeroCount = await readWindow(lectureZero._id, 0, 60);
    if (lectureZeroCount === 0) {
      throw new Error("Transcript window empty for Lecture 0 (0-60).");
    }

    return { lectureTenCount, lectureZeroCount };
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
          title: "E2E course",
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
