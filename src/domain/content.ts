import type { GenericId } from "convex/values";

type TranscriptStatus = "ok" | "warn" | "missing" | "error";

type CourseSummary = {
  id: GenericId<"courses">;
  sourcePlaylistId: string;
  title: string;
  description?: string;
  license: string;
  sourceUrl: string;
};

type LessonSummary = {
  id: GenericId<"lessons">;
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

const orderCoursesByTitle = (courses: CourseSummary[]): CourseSummary[] => {
  return [...courses].sort((left, right) => left.title.localeCompare(right.title));
};

const selectLessonsByCourse = (
  lessons: LessonSummary[],
  courseId: GenericId<"courses">
): LessonSummary[] => {
  return lessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((left, right) => left.order - right.order);
};

export type { CourseSummary, LessonSummary, TranscriptStatus };
export { orderCoursesByTitle, selectLessonsByCourse };
