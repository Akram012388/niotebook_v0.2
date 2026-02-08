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
import type { LessonEnvironment } from "../../domain/lessonEnvironment";
import { getPresetOrDefault } from "../../infra/runtime/envPresets";
import { storageAdapter } from "../../infra/storageAdapter";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";
import { useVideoDisplayTime } from "../layout/WorkspaceGrid";

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
  sql: "-- Write your SQL queries here\nSELECT 'hello, SQL';\n",
  r: 'cat("hello, world\\n")\n',
};

const EXTENSION_BY_LANGUAGE: Record<RuntimeLanguage, string> = {
  js: "main.js",
  python: "main.py",
  html: "index.html",
  c: "main.c",
  css: "styles.css",
  sql: "queries.sql",
  r: "main.R",
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

  const [language, setLanguage] = useState<RuntimeLanguage>(() => {
    const stored = storageAdapter.getItem("niotebook.language");
    if (stored && Object.keys(DEFAULT_CODE_BY_LANGUAGE).includes(stored)) {
      return stored as RuntimeLanguage;
    }
    return environment.primaryLanguage;
  });
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    language: "js",
    status: "idle",
  });

  const { activePreset } = useLayoutPreset();
  const showFileTree = activePreset !== "triple";
  const shouldResetSplits = true;
  const fileTreeLayoutKey = activePreset === "single" ? "single" : "split";

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
  const terminalIsRunning = useTerminalStore((s) => s.isRunning);

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

  const terminalActionsDisabled =
    activeLanguage === "html" || activeLanguage === "css";

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

    const activeFileName = mainFilePath
      ? mainFilePath.split("/").pop()
      : undefined;

    onSnapshot({
      id: "local-snapshot" as CodeSnapshotSummary["id"],
      userId: "local-user" as CodeSnapshotSummary["userId"],
      lessonId: lessonId as CodeSnapshotSummary["lessonId"],
      language: activeLanguage,
      code: mainFileContent,
      codeHash: "",
      updatedAt: Date.now(),
      fileName: activeFileName,
    });
  }, [mainFileContent, mainFilePath, activeLanguage, lessonId, onSnapshot]);

  // ── Handlers ──────────────────────────────────────────────

  const handleRun = async (): Promise<void> => {
    if (terminalActionsDisabled) {
      return;
    }
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
    termStore.write("\x1b[2K\r");
    termStore.writeLn(`\x1b[90m$ run ${activeLanguage}\x1b[0m`);

    const vfs = useFileSystemStore.getState().vfs;
    const formatErrorChunk = (chunk: string): string => {
      const prefix = "\x1b[31m[err]\x1b[0m ";
      const lines = chunk.split("\n");
      return lines
        .map((line, index) => {
          if (line.length === 0 && index === lines.length - 1) {
            return "";
          }
          return prefix + line;
        })
        .join("\n");
    };

    try {
      const result = await runRuntime(activeLanguage, {
        code,
        timeoutMs: environment.runtimeSettings.timeoutMs,
        filesystem: vfs,
        packages: environment.packages,
        onStdout: (chunk: string) => termStore.write(chunk),
        onStderr: (chunk: string) => termStore.write(formatErrorChunk(chunk)),
      });

      // Write remaining buffered output not already streamed
      if (result.stdout && !result.stdout.includes("\x00__streamed__")) {
        // Strip SVG plot marker before writing to terminal
        const cleanStdout = result.stdout.replace(
          /\x00__plot_svg__[\s\S]*$/,
          "",
        );
        if (cleanStdout) {
          termStore.write(cleanStdout);
        }
      }
      if (result.stderr && !result.stderr.includes("\x00__streamed__")) {
        termStore.write(formatErrorChunk(result.stderr));
      }

      // Render R plot SVG in the HTML preview pane if present
      if (result.stdout?.includes("\x00__plot_svg__")) {
        const svgData = result.stdout.split("\x00__plot_svg__")[1];
        if (svgData) {
          const container = document.getElementById("niotebook-runtime-frame");
          if (container) {
            const frame = document.createElement("iframe");
            frame.style.width = "100%";
            frame.style.height = "100%";
            frame.style.border = "none";
            frame.srcdoc = `<!DOCTYPE html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;background:#1C1917;min-height:100vh}svg{max-width:100%;max-height:100vh}</style></head><body>${svgData}</body></html>`;
            container.replaceChildren(frame);
          }
        }
      }

      if (result.timedOut) {
        useTerminalStore.getState().setLastRunError("Runtime timed out");
      } else if (result.stderr) {
        useTerminalStore
          .getState()
          .setLastRunError(result.stderr.slice(0, 500));
      } else {
        useTerminalStore.getState().setLastRunError(null);
      }

      setRuntimeState({
        language: activeLanguage,
        status: result.timedOut ? "error" : "ready",
        message: result.timedOut
          ? "Runtime timed out"
          : `${activeLanguage.toUpperCase()} runtime ready`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Runtime failed";
      termStore.write(formatErrorChunk(`${message}\n`));
      useTerminalStore.getState().setLastRunError(message);
      setRuntimeState({
        language: activeLanguage,
        status: "error",
        message: "Runtime failed",
      });
    } finally {
      termStore.writePrompt();
    }
  };

  const handleStop = useCallback((): void => {
    if (terminalActionsDisabled) {
      return;
    }
    stopRuntime(activeLanguage).catch(() => undefined);
    clearRuntime(activeLanguage);
    useTerminalStore.getState().kill();
    setRuntimeState({
      language: activeLanguage,
      status: "ready",
      message: `${activeLanguage.toUpperCase()} runtime ready`,
    });
  }, [activeLanguage, terminalActionsDisabled]);

  const handleClear = useCallback((): void => {
    if (terminalActionsDisabled) {
      return;
    }
    useTerminalStore.getState().clear({ withPrompt: true });
  }, [terminalActionsDisabled]);

  const handleLanguageChange = useCallback(
    (nextLanguage: RuntimeLanguage): void => {
      if (!allowedLanguages.includes(nextLanguage)) return;
      setLanguage(nextLanguage);
      storageAdapter.setItem("niotebook.language", nextLanguage);
    },
    [allowedLanguages],
  );

  // ── Push-to-niotepad shortcut (Cmd/Ctrl+Shift+N) ────────
  const videoTimeSec = useVideoDisplayTime();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (
        e.key.toLowerCase() !== "n" ||
        !e.shiftKey ||
        !(e.metaKey || e.ctrlKey)
      ) {
        return;
      }

      // Get active file's editor state for selection
      const editorStore = useEditorStore.getState();
      const activeFile = editorStore.openFiles.find(
        (f) => f.id === editorStore.activeFileId,
      );
      if (!activeFile) return;

      const { selection } = activeFile.editorState;
      const mainRange = selection.main;
      if (mainRange.empty) return;

      const selectedCode = activeFile.editorState.doc.sliceString(
        mainRange.from,
        mainRange.to,
      );
      if (!selectedCode.trim()) return;

      e.preventDefault();

      const lang = activeFile.language ?? activeLanguage;
      const content = `\`\`\`${lang}\n${selectedCode}\n\`\`\``;
      const lectureTitle = `Lesson ${lessonId}`;

      const store = useNiotepadStore.getState();
      const pageId = store.getOrCreatePage(lessonId, lectureTitle);
      store.addEntry({
        source: "code",
        content,
        pageId,
        videoTimeSec,
        metadata: {
          filePath: activeFile.path,
          language: lang,
        },
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLanguage, lessonId, videoTimeSec]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <p className="truncate text-sm font-semibold text-foreground">Code</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
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
          minSecond={128}
          storageKey="niotebook:split-editor-output"
          resetOnLoad={shouldResetSplits ? "second" : undefined}
          first={
            <div className="flex min-h-0 h-full flex-1 flex-col bg-workspace-editor">
              <EditorArea
                showFileTree={showFileTree}
                layoutKey={fileTreeLayoutKey}
              />
            </div>
          }
          second={
            <div className="flex min-h-0 h-full flex-1 flex-col bg-workspace-terminal">
              <TerminalPanel
                onRun={handleRun}
                onStop={handleStop}
                onClear={handleClear}
                isRunning={
                  runtimeState.status === "running" || terminalIsRunning
                }
                actionsDisabled={terminalActionsDisabled}
              />
            </div>
          }
        />
      </div>
    </section>
  );
};

export { CodePane };
