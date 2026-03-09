import { useEffect, useMemo } from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { loadExecutor } from "../../infra/runtime/runtimeManager";
import type { RuntimeLanguage, RuntimeState } from "../../infra/runtime/types";
import type { EventLogResult } from "../../domain/events";

/**
 * Warm up the runtime executor for the given language.
 * Calls setRuntimeState to transition: idle → warming → ready | error.
 * Also logs warmup start/end events to Convex (when enabled).
 */
function useRuntimeWarmup(
  language: RuntimeLanguage,
  lessonId: string,
  setRuntimeState: (state: RuntimeState) => void,
): void {
  const logEventRef = useMemo(
    () =>
      makeFunctionReference<"mutation">(
        "events:logEvent",
      ) as import("convex/server").FunctionReference<
        "mutation",
        "public",
        {
          eventType: "runtime_warmup_start" | "runtime_warmup_end";
          lessonId?: string;
          sessionId?: string;
          metadata: {
            language?: string;
            durationMs?: number;
          };
        },
        EventLogResult
      >,
    [],
  );

  const logEvent = useMutation(logEventRef);

  useEffect(() => {
    let cancelled = false;
    const warmupStartedAt = performance.now();

    const timeout = window.setTimeout(() => {
      setRuntimeState({
        language,
        status: "warming",
        message: "Preparing runtime...",
      });
    }, 0);

    if (process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
      void logEvent({
        eventType: "runtime_warmup_start",
        lessonId,
        metadata: { language, durationMs: 0 },
      });
    }

    loadExecutor(language)
      .then(() => {
        if (cancelled) return;

        const warmupDuration = Math.round(performance.now() - warmupStartedAt);

        if (process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
          void logEvent({
            eventType: "runtime_warmup_end",
            lessonId,
            metadata: { language, durationMs: warmupDuration },
          });
        }

        setRuntimeState({
          language,
          status: "ready",
          message: `${language.toUpperCase()} runtime ready`,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setRuntimeState({
          language,
          status: "error",
          message: "Runtime failed to load",
        });
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [language, lessonId, logEvent, setRuntimeState]);
}

export { useRuntimeWarmup };
