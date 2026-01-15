import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  orderCoursesByTitle,
  selectLessonsByCourse,
  type CourseSummary,
  type LessonSummary,
  type TranscriptStatus
} from "../src/domain/content";

type CourseRecord = {
  _id: GenericId<"courses">;
  sourcePlaylistId: string;
  title: string;
  description?: string;
  license: string;
  sourceUrl: string;
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
    id: course._id,
    sourcePlaylistId: course.sourcePlaylistId,
    title: course.title,
    description: course.description,
    license: course.license,
    sourceUrl: course.sourceUrl
  };
};

const toLessonSummary = (lesson: LessonRecord): LessonSummary => {
  return {
    id: lesson._id,
    courseId: lesson.courseId,
    videoId: lesson.videoId,
    title: lesson.title,
    durationSec: lesson.durationSec,
    order: lesson.order,
    subtitlesUrl: lesson.subtitlesUrl,
    transcriptUrl: lesson.transcriptUrl,
    transcriptDurationSec: lesson.transcriptDurationSec,
    segmentCount: lesson.segmentCount,
    ingestVersion: lesson.ingestVersion,
    transcriptStatus: lesson.transcriptStatus
  };
};

const getCourses = queryGeneric({
  args: {},
  handler: async (ctx): Promise<CourseSummary[]> => {
    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    return orderCoursesByTitle(courses.map(toCourseSummary));
  }
});

const getLessonsByCourse = queryGeneric({
  args: {
    courseId: v.id("courses")
  },
  handler: async (ctx, args): Promise<LessonSummary[]> => {
    const lessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) =>
        query.eq("courseId", args.courseId)
      )
      .collect()) as LessonRecord[];

    return selectLessonsByCourse(lessons.map(toLessonSummary), args.courseId);
  }
});

const getLesson = queryGeneric({
  args: {
    lessonId: v.id("lessons")
  },
  handler: async (ctx, args): Promise<LessonSummary | null> => {
    const lesson = (await ctx.db.get(args.lessonId)) as LessonRecord | null;

    if (!lesson) {
      return null;
    }

    return toLessonSummary(lesson);
  }
});

export { getCourses, getLesson, getLessonsByCourse };
