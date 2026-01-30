import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { OutputPanel } from "../code/OutputPanel";
import { RuntimeStatus } from "../code/RuntimeStatus";
import { EditorSkeleton } from "../code/EditorSkeleton";
import { SplitPane } from "../code/SplitPane";
import { useLayoutPreset } from "../layout/LayoutPresetContext";
import { useEditorStore } from "../code/useEditorStore";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";
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

// ── SSR-safe dynamic import of EditorArea ─────────────────────

const EditorArea = dynamic(() => import("../code/EditorArea"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

// ── Default templates per language ────────────────────────────

const DEFAULT_CODE_BY_LANGUAGE: Record<RuntimeLanguage, string> = {
  js: "console.log('Hello, CS50');",
  python: "print('Hello, CS50')",
  html: "<h1>Hello, CS50</h1>",
  c: '#include <stdio.h>\n\nint main(void) {\n  printf("Hello, CS50\\n");\n  return 0;\n}\n',
};

const EXTENSION_BY_LANGUAGE: Record<RuntimeLanguage, string> = {
  js: "main.js",
  python: "main.py",
  html: "index.html",
  c: "main.c",
};

// ── Component ─────────────────────────────────────────────────

type CodePaneProps = {
  lessonId: string;
  onSnapshot?: (snapshot: CodeSnapshotSummary) => void;
  headerExtras?: ReactElement;
};

const CodePane = ({
  lessonId,
  onSnapshot,
  headerExtras,
}: CodePaneProps): ReactElement => {
  // TODO: language switching will be wired to environment configs (Phase 6)
  const [language] = useState<RuntimeLanguage>("js");
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    language: "js",
    status: "idle",
  });
  const [output, setOutput] = useState<RuntimeSnapshot | null>(null);

  const { activePreset } = useLayoutPreset();
  const showFileTree = activePreset !== "triple";

  const initializeFromTemplate = useFileSystemStore(
    (s) => s.initializeFromTemplate,
  );
  const isLoaded = useFileSystemStore((s) => s.isLoaded);
  const getMainFileContent = useFileSystemStore((s) => s.getMainFileContent);
  const openFile = useEditorStore((s) => s.openFile);

  // ── Initialize VFS on mount ───────────────────────────────

  useEffect(() => {
    if (isLoaded) return;

    const filename = EXTENSION_BY_LANGUAGE[language];
    const content = DEFAULT_CODE_BY_LANGUAGE[language];

    initializeFromTemplate([{ path: filename, content }]);

    // Open the main file in the editor
    void openFile(`/project/${filename}`);
  }, [isLoaded, language, initializeFromTemplate, openFile]);

  // ── Convex snapshot integration (backward compat) ─────────

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

  // ── Runtime warmup ────────────────────────────────────────

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

        const warmupDuration = Math.round(
          performance.now() - warmupStartedAt,
        );

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
  }, [language, lessonId, logEvent]);

  // ── Snapshot callback ─────────────────────────────────────

  useEffect(() => {
    if (!onSnapshot) return;

    const content = getMainFileContent();
    if (!content) return;

    // Fire snapshot with main file content for backward compat
    onSnapshot({
      id: "local-snapshot" as CodeSnapshotSummary["id"],
      userId: "local-user" as CodeSnapshotSummary["userId"],
      lessonId: lessonId as CodeSnapshotSummary["lessonId"],
      language,
      code: content,
      codeHash: "",
      updatedAt: Date.now(),
    });
  }, [getMainFileContent, language, lessonId, onSnapshot]);

  // ── Handlers ──────────────────────────────────────────────

  const handleRun = useCallback(async (): Promise<void> => {
    // Flush dirty files to VFS before running
    useEditorStore.getState().saveAll();

    const code = getMainFileContent();
    if (!code) return;

    setRuntimeState({
      language,
      status: "running",
      message: "Running...",
    });

    const result = await runRuntime(language, {
      code,
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
  }, [language, getMainFileContent]);

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
    <section className="flex h-full min-h-0 w-full flex-col rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Code workspace
          </p>
          <p className="text-xs text-text-muted">Editor + output scaffold</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {headerExtras}
          <button
            type="button"
            onClick={handleRun}
            className="rounded-full border border-border px-3 py-1 text-text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            Run
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="rounded-full border border-border px-3 py-1 text-text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-border px-3 py-1 text-text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <SplitPane
          direction="vertical"
          initialSplit={0.65}
          minFirst={0.2}
          minSecond={0.1}
          storageKey="niotebook:split-editor-output"
          first={
            <div className="flex min-h-0 flex-1 flex-col">
              <EditorArea showFileTree={showFileTree} />
            </div>
          }
          second={
            <div className="flex min-h-0 flex-1 flex-col bg-black text-slate-100 dark:bg-slate-50 dark:text-slate-900">
              <div className="px-3 pt-3">
                <RuntimeStatus
                  state={runtimeState}
                  className="text-slate-300 dark:text-slate-600"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 pt-2">
                <OutputPanel output={runtimeOutput} variant="inline" />
                {runtimeState.status === "error" ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    {runtimeState.message ?? "Runtime error"}
                  </div>
                ) : null}
                <div id="niotebook-runtime-frame" className="min-h-[120px]" />
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
};

export { CodePane };
