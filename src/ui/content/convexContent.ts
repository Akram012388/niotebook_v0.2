import { makeFunctionReference } from "convex/server";
import type { CourseSummary, LessonSummary } from "../../domain/content";

type CoursesReference = import("convex/server").FunctionReference<
  "query",
  "public",
  Record<string, never>,
  CourseSummary[]
>;

type LessonsByCourseReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { courseId: string },
  LessonSummary[]
>;

type LessonReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { lessonId: string },
  LessonSummary | null
>;

type LessonCountsByCourseReference = import("convex/server").FunctionReference<
  "query",
  "public",
  Record<string, never>,
  Record<string, number>
>;

const getCoursesRef = makeFunctionReference<"query">(
  "content:getCourses",
) as CoursesReference;

const getLessonCountsByCourseRef = makeFunctionReference<"query">(
  "content:getLessonCountsByCourse",
) as LessonCountsByCourseReference;

const getLessonsByCourseRef = makeFunctionReference<"query">(
  "content:getLessonsByCourse",
) as LessonsByCourseReference;

const getLessonRef = makeFunctionReference<"query">(
  "content:getLesson",
) as LessonReference;

export {
  getCoursesRef,
  getLessonCountsByCourseRef,
  getLessonRef,
  getLessonsByCourseRef,
};
