import { query } from "./_generated/server";
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
  subtitlesUrl?: string;
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
    defaultLessonId: v.id("lessons"),
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

    const lectureTenCount = await readWindow(
      toGenericId(args.defaultLessonId),
      960,
      1020,
    );
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
