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
import { EditorSkeleton } from "../code/EditorSkeleton";
import { SplitPane } from "../code/SplitPane";
import { useLayoutPreset } from "../layout/LayoutPresetContext";
import { useEditorStore } from "../code/useEditorStore";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";
import { useTerminalStore } from "../code/terminal/useTerminalStore";
import { LanguageSelect } from "../code/LanguageSelect";
import type { EventLogResult } from "../../domain/events";
import type { CodeSnapshotSummary } from "../../domain/resume";
import {
  clearRuntime,
  loadExecutor,
  runRuntime,
  stopRuntime,
} from "../../infra/runtime/runtimeManager";
import type { RuntimeLanguage, RuntimeState } from "../../infra/runtime/types";
import { RUNTIME_TIMEOUT_MS } from "../../infra/runtime/runtimeConstants";
import type { LessonEnvironment } from "../../domain/lessonEnvironment";
import { getPresetOrDefault } from "../../infra/runtime/envPresets";

// ── SSR-safe dynamic import of EditorArea ─────────────────────

const EditorArea = dynamic(() => import("../code/EditorArea"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const TerminalPanel = dynamic(() => import("../code/terminal/TerminalPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 animate-pulse rounded-lg bg-workspace-terminal" />
  ),
});

// ── Default templates per language ────────────────────────────

const DEFAULT_CODE_BY_LANGUAGE: Record<RuntimeLanguage, string> = {
  js: "console.log('Hello, CS50');",
  python: "print('Hello, CS50')",
  html: "<h1>Hello, CS50</h1>",
  c: '#include <stdio.h>\n\nint main(void) {\n  printf("Hello, CS50\\n");\n  return 0;\n}\n',
  css: "body {\n  font-family: system-ui, sans-serif;\n}\n",
};

const EXTENSION_BY_LANGUAGE: Record<RuntimeLanguage, string> = {
  js: "main.js",
  python: "main.py",
  html: "index.html",
  c: "main.c",
  css: "styles.css",
};

// ── Component ─────────────────────────────────────────────────

type CodePaneProps = {
  lessonId: string;
  onSnapshot?: (snapshot: CodeSnapshotSummary) => void;
  headerExtras?: ReactElement;
  /** Optional preset id or full environment config. Falls back to "sandbox". */
  environmentPresetId?: string;
  environmentConfig?: LessonEnvironment;
};

const CodePane = ({
  lessonId,
  onSnapshot,
  headerExtras,
  environmentPresetId,
  environmentConfig,
}: CodePaneProps): ReactElement => {
  // Resolve the active environment: explicit config > preset id > sandbox default
  const environment: LessonEnvironment = useMemo(
    () => environmentConfig ?? getPresetOrDefault(environmentPresetId),
    [environmentConfig, environmentPresetId],
  );

  const [language, setLanguage] = useState<RuntimeLanguage>(
    environment.primaryLanguage,
  );
  const [, setRuntimeState] = useState<RuntimeState>({
    language: "js",
    status: "idle",
  });

  const { activePreset } = useLayoutPreset();
  const showFileTree = activePreset !== "triple";

  const initializeFromTemplate = useFileSystemStore(
    (s) => s.initializeFromTemplate,
  );
  const initializeFromEnvironment = useFileSystemStore(
    (s) => s.initializeFromEnvironment,
  );
  const createFile = useFileSystemStore((s) => s.createFile);
  const setMainFile = useFileSystemStore((s) => s.setMainFile);
  const vfs = useFileSystemStore((s) => s.vfs);
  const projectRoot = useFileSystemStore((s) => s.projectRoot);
  const isLoaded = useFileSystemStore((s) => s.isLoaded);
  const getMainFileContent = useFileSystemStore((s) => s.getMainFileContent);
  const mainFilePath = useFileSystemStore((s) => s.mainFilePath);
  const files = useFileSystemStore((s) => s.files);
  const openFile = useEditorStore((s) => s.openFile);

  const allowedLanguages = useMemo(() => {
    const candidates =
      environment.allowedLanguages.length > 0
        ? environment.allowedLanguages
        : [environment.primaryLanguage];
    return Array.from(new Set(candidates));
  }, [environment.allowedLanguages, environment.primaryLanguage]);

  const activeLanguage = useMemo(() => {
    if (allowedLanguages.includes(language)) {
      return language;
    }
    return environment.primaryLanguage;
  }, [allowedLanguages, environment.primaryLanguage, language]);

  // ── Initialize VFS on mount ───────────────────────────────

  useEffect(() => {
    if (isLoaded) return;

    // Use environment config if available; otherwise fall back to simple template
    if (environment.starterFiles.length > 0) {
      initializeFromEnvironment(environment);

      // Open the first starter file in the editor
      const firstFile = environment.starterFiles[0];
      const firstPath = firstFile.path.startsWith("/")
        ? firstFile.path
        : `/project/${firstFile.path}`;
      void openFile(firstPath);
    } else {
      const filename = EXTENSION_BY_LANGUAGE[activeLanguage];
      const content = DEFAULT_CODE_BY_LANGUAGE[activeLanguage];
      initializeFromTemplate([{ path: filename, content }]);
      void openFile(`/project/${filename}`);
    }
  }, [
    isLoaded,
    activeLanguage,
    environment,
    initializeFromTemplate,
    initializeFromEnvironment,
    openFile,
  ]);

  useEffect(() => {
    if (!isLoaded) return;

    const { files: currentFiles, mainFilePath: currentMainFilePath } =
      useFileSystemStore.getState();

    const matchingMain = currentFiles.find(
      (file) =>
        file.path === currentMainFilePath && file.language === activeLanguage,
    );
    const matchingFile = currentFiles.find(
      (file) => file.language === activeLanguage,
    );

    let nextPath = matchingMain?.path ?? matchingFile?.path;
    if (!nextPath) {
      const filename = EXTENSION_BY_LANGUAGE[activeLanguage];
      nextPath = filename.startsWith("/")
        ? filename
        : `${projectRoot}/${filename}`;

      if (!vfs.exists(nextPath)) {
        createFile(nextPath, DEFAULT_CODE_BY_LANGUAGE[activeLanguage]);
      }
    }

    setMainFile(nextPath);
    void openFile(nextPath);
  }, [
    activeLanguage,
    createFile,
    isLoaded,
    openFile,
    projectRoot,
    setMainFile,
    vfs,
  ]);

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

  // ── Runtime warmup ────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const warmupStartedAt = performance.now();

    const timeout = window.setTimeout(() => {
      setRuntimeState({
        language: activeLanguage,
        status: "warming",
        message: "Preparing runtime...",
      });
    }, 0);

    if (process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
      void logEvent({
        eventType: "runtime_warmup_start",
        lessonId,
        metadata: { language: activeLanguage, durationMs: 0 },
      });
    }

    loadExecutor(activeLanguage)
      .then(() => {
        if (cancelled) return;

        const warmupDuration = Math.round(performance.now() - warmupStartedAt);

        if (process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
          void logEvent({
            eventType: "runtime_warmup_end",
            lessonId,
            metadata: { language: activeLanguage, durationMs: warmupDuration },
          });
        }

        setRuntimeState({
          language: activeLanguage,
          status: "ready",
          message: `${activeLanguage.toUpperCase()} runtime ready`,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setRuntimeState({
          language: activeLanguage,
          status: "error",
          message: "Runtime failed to load",
        });
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeLanguage, lessonId, logEvent]);

  // ── Snapshot callback — reactive to VFS main file changes ──

  // Derive main file content reactively so onSnapshot fires when it changes
  const mainFileContent = useMemo(() => {
    // Subscribe to files list so this recalculates when VFS mutates
    void files;
    return getMainFileContent();
  }, [files, getMainFileContent]);

  useEffect(() => {
    if (!onSnapshot) return;
    if (!mainFileContent) return;

    onSnapshot({
      id: "local-snapshot" as CodeSnapshotSummary["id"],
      userId: "local-user" as CodeSnapshotSummary["userId"],
      lessonId: lessonId as CodeSnapshotSummary["lessonId"],
      language: activeLanguage,
      code: mainFileContent,
      codeHash: "",
      updatedAt: Date.now(),
    });
  }, [mainFileContent, mainFilePath, activeLanguage, lessonId, onSnapshot]);

  // ── Handlers ──────────────────────────────────────────────

  const handleRun = useCallback(async (): Promise<void> => {
    // Flush dirty files to VFS before running
    useEditorStore.getState().saveAll();

    const code = getMainFileContent();
    if (!code) return;

    setRuntimeState({
      language: activeLanguage,
      status: "running",
      message: "Running...",
    });

    // Stream output to terminal
    const termStore = useTerminalStore.getState();
    termStore.writeLn(`\x1b[90m$ run ${activeLanguage}\x1b[0m`);

    const vfs = useFileSystemStore.getState().vfs;
    const result = await runRuntime(activeLanguage, {
      code,
      timeoutMs: RUNTIME_TIMEOUT_MS,
      filesystem: vfs,
      onStdout: (chunk: string) => termStore.write(chunk),
      onStderr: (chunk: string) => termStore.write(`\x1b[31m${chunk}\x1b[0m`),
    });

    // Write remaining buffered output not already streamed
    if (result.stdout && !result.stdout.includes("\x00__streamed__")) {
      termStore.write(result.stdout);
    }
    if (result.stderr && !result.stderr.includes("\x00__streamed__")) {
      termStore.write(`\x1b[31m${result.stderr}\x1b[0m`);
    }

    setRuntimeState({
      language: activeLanguage,
      status: result.timedOut ? "error" : "ready",
      message: result.timedOut
        ? "Runtime timed out"
        : `${activeLanguage.toUpperCase()} runtime ready`,
    });
  }, [activeLanguage, getMainFileContent]);

  const handleStop = useCallback((): void => {
    stopRuntime(activeLanguage).catch(() => undefined);
    clearRuntime(activeLanguage);
    useTerminalStore.getState().kill();
    setRuntimeState({
      language: activeLanguage,
      status: "ready",
      message: `${activeLanguage.toUpperCase()} runtime ready`,
    });
  }, [activeLanguage]);

  const handleClear = useCallback((): void => {
    useTerminalStore.getState().clear();
  }, []);

  const handleLanguageChange = useCallback(
    (nextLanguage: RuntimeLanguage): void => {
      if (!allowedLanguages.includes(nextLanguage)) return;
      setLanguage(nextLanguage);
    },
    [allowedLanguages],
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-foreground">
            Code workspace
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <LanguageSelect
            value={activeLanguage}
            options={allowedLanguages}
            onChange={handleLanguageChange}
          />
          {headerExtras}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <SplitPane
          direction="vertical"
          initialSplit={0.65}
          minFirst={100}
          minSecond={60}
          storageKey="niotebook:split-editor-output"
          first={
            <div className="flex min-h-0 flex-1 flex-col">
              <EditorArea showFileTree={showFileTree} />
            </div>
          }
          second={
            <div className="flex min-h-0 flex-1 flex-col">
              <TerminalPanel
                onRun={handleRun}
                onStop={handleStop}
                onClear={handleClear}
              />
            </div>
          }
        />
      </div>
    </section>
  );
};

export { CodePane };
