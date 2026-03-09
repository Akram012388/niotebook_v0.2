import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import dynamic from "next/dynamic";
import { EditorSkeleton } from "../code/EditorSkeleton";
import { SplitPane } from "../code/SplitPane";
import { useLayoutPreset } from "../layout/LayoutPresetContext";
import { useEditorStore } from "../code/useEditorStore";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";
import { LanguageSelect } from "../code/LanguageSelect";
import type { CodeSnapshotSummary } from "../../domain/resume";
import type { RuntimeLanguage } from "../../infra/runtime/types";
import type { LessonEnvironment } from "../../domain/lessonEnvironment";
import { getPresetOrDefault } from "../../infra/runtime/envPresets";
import { storageAdapter } from "../../infra/storageAdapter";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";
import { useVideoDisplayTime } from "../layout/WorkspaceGrid";
import { useCodeExecution } from "./useCodeExecution";
import { useBookmarkConfirm } from "./useBookmarkConfirm";

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

  const { activePreset } = useLayoutPreset();
  const showFileTree = activePreset !== "triple";
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

  // ── Runtime warmup + execution hooks ─────────────────────

  const { isRunning, handleRun, handleStop, handleClear } = useCodeExecution({
    lessonId,
    activeLanguage,
    environment,
    terminalActionsDisabled,
  });

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

  const handleLanguageChange = useCallback(
    (nextLanguage: RuntimeLanguage): void => {
      if (!allowedLanguages.includes(nextLanguage)) return;
      setLanguage(nextLanguage);
      storageAdapter.setItem("niotebook.language", nextLanguage);
    },
    [allowedLanguages],
  );

  // ── Bookmark to niotepad ────────────────────────────────

  const videoTimeSec = useVideoDisplayTime();
  const videoTimeSecRef = useRef(videoTimeSec);
  useEffect(() => {
    videoTimeSecRef.current = videoTimeSec;
  }, [videoTimeSec]);
  // Use a human-readable label so niotepad pages show "Lecture N" not a raw ID
  const lectureLabel = `Lesson ${lessonId}`;
  const { bookmarkSaved, handleBookmark: doBookmark } = useBookmarkConfirm(
    lessonId,
    lectureLabel,
  );

  const handleBookmark = useCallback((): void => {
    const mainContent = getMainFileContent();
    if (!mainContent) return;
    doBookmark({
      source: "code",
      content: mainContent,
      videoTimeSec: videoTimeSecRef.current,
      metadata: {
        filePath: mainFilePath ?? undefined,
        language: activeLanguage,
      },
    });
  }, [doBookmark, getMainFileContent, mainFilePath, activeLanguage]);

  // ── Push-to-niotepad shortcut (Cmd/Ctrl+Shift+N) ────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (
        e.key.toLowerCase() !== "n" ||
        !e.shiftKey ||
        !(e.metaKey || e.ctrlKey)
      )
        return;

      const { openFiles, activeFileId } = useEditorStore.getState();
      const activeFile = openFiles.find((f) => f.id === activeFileId);
      if (!activeFile) return;

      const mainRange = activeFile.editorState.selection.main;
      if (mainRange.empty) return;

      const selectedCode = activeFile.editorState.doc.sliceString(
        mainRange.from,
        mainRange.to,
      );
      if (!selectedCode.trim()) return;

      e.preventDefault();

      const store = useNiotepadStore.getState();
      const pageId = store.getOrCreatePage(lessonId, lectureLabel);
      store.addEntry({
        source: "code",
        content: selectedCode,
        pageId,
        videoTimeSec: videoTimeSecRef.current,
        metadata: {
          filePath: activeFile.path,
          language: activeFile.language ?? activeLanguage,
        },
      });
    },
    [activeLanguage, lessonId, lectureLabel],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <p className="truncate text-sm font-semibold text-foreground">Code</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleBookmark}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Bookmark code to niotepad"
          >
            {bookmarkSaved ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7L6 10L11 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3.5 2.5H10.5V12L7 9.5L3.5 12V2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
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
          resetOnLoad="second"
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
                isRunning={isRunning}
                actionsDisabled={terminalActionsDisabled}
              />
            </div>
          }
        />
      </div>
    </section>
  );
};

const MemoizedCodePane = memo(CodePane);
export { MemoizedCodePane as CodePane };
