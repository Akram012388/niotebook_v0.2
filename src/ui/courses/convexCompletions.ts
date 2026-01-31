import { makeFunctionReference } from "convex/server";
import type { LessonCompletionSummary } from "@/domain/lesson-completions";

type CompletionsByCourseReference = import("convex/server").FunctionReference<
  "query",
  "public",
  { courseId: string },
  LessonCompletionSummary[]
>;

const getCompletionsByCourseRef = makeFunctionReference<"query">(
  "lessonCompletions:getCompletionsByCourse",
) as CompletionsByCourseReference;

export { getCompletionsByCourseRef };
