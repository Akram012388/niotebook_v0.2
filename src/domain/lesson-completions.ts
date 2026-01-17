import type { LessonCompletionId, LessonId, UserId } from "./ids";

type CompletionMethod = "video" | "code";

type LessonCompletionSummary = {
  id: LessonCompletionId;
  userId: UserId;
  lessonId: LessonId;
  completionMethod: CompletionMethod;
  completionPct?: number;
  completedAt: number;
};

type LessonCompletionUpsertInput = {
  userId: UserId;
  lessonId: LessonId;
  completionMethod: CompletionMethod;
  completionPct?: number;
};

type LessonCompletionRecord = LessonCompletionUpsertInput & {
  _id: LessonCompletionId;
  completedAt: number;
};

const toLessonCompletionSummary = (
  record: LessonCompletionRecord,
): LessonCompletionSummary => {
  return {
    id: record._id,
    userId: record.userId,
    lessonId: record.lessonId,
    completionMethod: record.completionMethod,
    completionPct: record.completionPct,
    completedAt: record.completedAt,
  };
};

const resolveLessonCompletionSummary = (
  id: LessonCompletionId,
  input: LessonCompletionUpsertInput,
  completedAt: number,
): LessonCompletionSummary => {
  return {
    id,
    userId: input.userId,
    lessonId: input.lessonId,
    completionMethod: input.completionMethod,
    completionPct: input.completionPct,
    completedAt,
  };
};

export type {
  CompletionMethod,
  LessonCompletionRecord,
  LessonCompletionSummary,
  LessonCompletionUpsertInput,
};
export { resolveLessonCompletionSummary, toLessonCompletionSummary };
