import { makeFunctionReference } from "convex/server";
import type { LessonCompletionSummary } from "@/domain/lesson-completions";

type CompletionsByCourseReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { courseId: string },
  LessonCompletionSummary[]
>;

type CompletionCountsByCourseReference =
  import("convex/server").FunctionReference<
    "query",
    "public",
    { courseIds: string[] },
    Record<string, number>
  >;

type MarkCompleteReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  { lessonId: string },
  LessonCompletionSummary
>;

const getCompletionsByCourseRef = makeFunctionReference<"query">(
  "lessonCompletions:getCompletionsByCourse",
) as CompletionsByCourseReference;

const getCompletionCountsByCourseRef = makeFunctionReference<"query">(
  "lessonCompletions:getCompletionCountsByCourses",
) as CompletionCountsByCourseReference;

const markCompleteRef = makeFunctionReference<"mutation">(
  "lessonCompletions:markComplete",
) as MarkCompleteReference;

export {
  getCompletionCountsByCourseRef,
  getCompletionsByCourseRef,
  markCompleteRef,
};
