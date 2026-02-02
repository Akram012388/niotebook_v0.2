import { useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import type { LessonCompletionSummary } from "../../domain/lesson-completions";

const COMPLETION_THRESHOLD = 0.8;

type SetLessonCompletedReference = import("convex/server").FunctionReference<
  "mutation",
  "public",
  {
    lessonId: string;
    completionMethod: "video" | "code";
    completionPct?: number;
  },
  LessonCompletionSummary
>;

const setLessonCompletedRef = makeFunctionReference<"mutation">(
  "lessonCompletions:setLessonCompleted",
) as SetLessonCompletedReference;

type UseAutoCompletionArgs = {
  lessonId: string;
  durationSec: number | undefined;
};

/**
 * Automatically marks a lesson as completed when the student reaches 80%
 * of the video duration. Fires at most once per lesson per session.
 *
 * Returns a callback to be invoked with the current video time (seconds).
 */
const useAutoCompletion = ({
  lessonId,
  durationSec,
}: UseAutoCompletionArgs): ((timeSec: number) => void) => {
  const firedRef = useRef<string | null>(null);
  const setCompleted = useMutation(setLessonCompletedRef);

  const check = useCallback(
    (timeSec: number): void => {
      if (!durationSec || durationSec <= 0) return;
      if (firedRef.current === lessonId) return;

      const progress = timeSec / durationSec;
      if (progress < COMPLETION_THRESHOLD) return;

      firedRef.current = lessonId;
      const pct = Math.round(progress * 100);
      void setCompleted({
        lessonId,
        completionMethod: "video",
        completionPct: Math.min(pct, 100),
      });
    },
    [durationSec, lessonId, setCompleted],
  );

  return check;
};

export { useAutoCompletion };
