import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  orderCoursesByTitle,
  selectLessonsByCourse,
  type CourseSummary,
  type LessonSummary,
  type TranscriptStatus,
} from "../src/domain/content";
import { requireMutationAdmin, requireQueryWorkspaceUser } from "./auth";
import { toDomainId } from "./idUtils";

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
  transcriptStatus?: TranscriptStatus;
};

const toCourseSummary = (course: CourseRecord): CourseSummary => {
  return {
    id: toDomainId(course._id as GenericId<"courses">),
    sourcePlaylistId: course.sourcePlaylistId,
    title: course.title,
    description: course.description,
    license: course.license,
    sourceUrl: course.sourceUrl,
    youtubePlaylistUrl: course.youtubePlaylistUrl,
  };
};

const toLessonSummary = (lesson: LessonRecord): LessonSummary => {
  return {
    id: toDomainId(lesson._id as GenericId<"lessons">),
    courseId: toDomainId(lesson.courseId as GenericId<"courses">),
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
  };
};

const getCourses = query({
  args: {},
  handler: async (ctx): Promise<CourseSummary[]> => {
    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    return orderCoursesByTitle(courses.map(toCourseSummary));
  },
});

const getLessonsByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args): Promise<LessonSummary[]> => {
    const lessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", args.courseId))
      .collect()) as LessonRecord[];

    return selectLessonsByCourse(
      lessons.map(toLessonSummary),
      toDomainId(args.courseId as GenericId<"courses">),
    );
  },
});

const getLesson = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args): Promise<LessonSummary | null> => {
    try {
      await requireQueryWorkspaceUser(ctx);
    } catch {
      return null;
    }

    const lesson = (await ctx.db.get(args.lessonId)) as LessonRecord | null;

    if (!lesson) {
      return null;
    }

    return toLessonSummary(lesson);
  },
});

const seedLesson = mutation({
  args: {
    courseTitle: v.optional(v.string()),
    lessonTitle: v.optional(v.string()),
    videoId: v.optional(v.string()),
    reuseExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<LessonSummary> => {
    const allowPreviewSeed = process.env.NIOTEBOOK_E2E_PREVIEW === "true";
    if (process.env.NODE_ENV === "production" && !allowPreviewSeed) {
      throw new Error("seedLesson is not available in production.");
    }

    if (process.env.NIOTEBOOK_DEV_AUTH_BYPASS !== "true") {
      throw new Error("seedLesson requires NIOTEBOOK_DEV_AUTH_BYPASS.");
    }

    if (!allowPreviewSeed) {
      await requireMutationAdmin(ctx);
    }

    const reuseExisting = args.reuseExisting ?? true;
    const existingLessons = reuseExisting
      ? ((await ctx.db.query("lessons").collect()) as LessonRecord[])
      : [];
    const existingLesson = reuseExisting
      ? (existingLessons.find(
          (lesson) => lesson.videoId && lesson.ingestVersion !== undefined,
        ) ?? null)
      : null;
    const existingCourse = reuseExisting
      ? ((await ctx.db.query("courses").first()) as CourseRecord | null)
      : null;

    const courseId =
      existingLesson?.courseId ??
      existingCourse?._id ??
      (await ctx.db.insert("courses", {
        sourcePlaylistId: "local-dev",
        title: args.courseTitle ?? "Local course",
        description: "Seeded for local development.",
        license: "MIT",
        sourceUrl: "https://example.com",
      }));

    const resolvedVideoId = existingLesson?.videoId ?? args.videoId;

    if (!resolvedVideoId) {
      throw new Error("seedLesson requires a videoId when no lessons exist.");
    }

    const lessonId =
      existingLesson?._id ??
      (await ctx.db.insert("lessons", {
        courseId,
        videoId: resolvedVideoId,
        title: args.lessonTitle ?? "Lesson 1",
        durationSec: 3600,
        order: 1,
        transcriptStatus: "missing",
      }));

    const lesson = (await ctx.db.get(lessonId)) as LessonRecord;
    return toLessonSummary(lesson);
  },
});

export { getCourses, getLesson, getLessonsByCourse, seedLesson };
