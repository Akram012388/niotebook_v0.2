import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { CodeEditor } from "../code/CodeEditor";
import { OutputPanel } from "../code/OutputPanel";
import { RuntimeStatus } from "../code/RuntimeStatus";
import type { EventLogResult } from "../../domain/events";
import type { CodeSnapshotSummary } from "../../domain/resume";
import { toRuntimeSnapshot, type RuntimeSnapshot } from "../../domain/runtime";
import {
  clearRuntime,
  loadExecutor,
  runRuntime,
  stopRuntime,
} from "../../infra/runtime/runtimeManager";
import type { RuntimeLanguage, RuntimeState } from "../../infra/runtime/types";
import { RUNTIME_TIMEOUT_MS } from "../../infra/runtime/runtimeConstants";

type CodePaneProps = {
  lessonId: string;
  onSnapshot?: (snapshot: CodeSnapshotSummary) => void;
};

const CodePane = ({ lessonId, onSnapshot }: CodePaneProps): ReactElement => {
  const [language, setLanguage] = useState<RuntimeLanguage>("js");
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    language: "js",
    status: "idle",
  });
  const [output, setOutput] = useState<RuntimeSnapshot | null>(null);
  const [latestSnapshot, setLatestSnapshot] =
    useState<CodeSnapshotSummary | null>(null);

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

  const runtimeOutput = useMemo(() => output?.output ?? null, [output]);

  const handleLanguageChange = useCallback((next: RuntimeLanguage): void => {
    setLanguage(next);
  }, []);

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
        metadata: {
          language,
          durationMs: 0,
        },
      });
    }

    loadExecutor(language)
      .then(() => {
        if (cancelled) {
          return;
        }

        const warmupDuration = Math.round(performance.now() - warmupStartedAt);

        if (process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
          void logEvent({
            eventType: "runtime_warmup_end",
            lessonId,
            metadata: {
              language,
              durationMs: warmupDuration,
            },
          });
        }

        setRuntimeState({
          language,
          status: "ready",
          message: `${language.toUpperCase()} runtime ready`,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

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
  }, [language, lessonId, logEvent]);

  const handleSnapshot = useCallback(
    (snapshot: CodeSnapshotSummary): void => {
      setLatestSnapshot(snapshot);
      onSnapshot?.(snapshot);
    },
    [onSnapshot],
  );

  const handleRun = useCallback(async (): Promise<void> => {
    if (!latestSnapshot) {
      return;
    }

    setRuntimeState({
      language,
      status: "running",
      message: "Running...",
    });

    const result = await runRuntime(language, {
      code: latestSnapshot.code,
      timeoutMs: RUNTIME_TIMEOUT_MS,
    });

    const snapshot = toRuntimeSnapshot(language, result);
    setOutput(snapshot);
    setRuntimeState({
      language,
      status: result.timedOut ? "error" : "ready",
      message: result.timedOut
        ? "Runtime timed out"
        : `${language.toUpperCase()} runtime ready`,
    });
  }, [language, latestSnapshot]);

  const handleStop = useCallback((): void => {
    stopRuntime(language).catch(() => undefined);
    clearRuntime(language);
    setRuntimeState({
      language,
      status: "ready",
      message: `${language.toUpperCase()} runtime ready`,
    });
  }, [language]);

  const handleClear = useCallback((): void => {
    setOutput(null);
  }, []);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Code workspace
          </p>
          <p className="text-xs text-text-muted">Editor + output scaffold</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleRun}
            className="rounded-full border border-border px-3 py-1 text-text-muted"
          >
            Run
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="rounded-full border border-border px-3 py-1 text-text-muted"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-border px-3 py-1 text-text-muted"
          >
            Clear
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <CodeEditor
          lessonId={lessonId}
          onLanguageChange={handleLanguageChange}
          onSnapshot={handleSnapshot}
        />
        <div className="flex items-center justify-between">
          <RuntimeStatus state={runtimeState} />
        </div>
        <OutputPanel output={runtimeOutput} />
        <div id="niotebook-runtime-frame" className="min-h-[180px]" />
      </div>
    </section>
  );
};

export { CodePane };
