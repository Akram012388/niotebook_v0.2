"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
  type ReactElement,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AiPane } from "../panes/AiPane";
import { CodePane } from "../panes/CodePane";
import { VideoPane } from "../panes/VideoPane";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";
import { storageAdapter } from "../../infra/storageAdapter";
import type { CodeSnapshotSummary } from "../../domain/resume";

const DEFAULT_LESSON_ID: string | null =
  process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID ?? null;

// ── Video time external store ─────────────────────────────────
// Module-level store so video time updates only re-render subscribers (AiPane),
// not the entire WorkspaceGrid tree.
const videoTimeListeners = new Set<() => void>();
let videoTimeSnapshot = 0;

const notifyVideoTime = (): void => {
  for (const listener of videoTimeListeners) {
    listener();
  }
};

const setVideoTime = (timeSec: number): void => {
  videoTimeSnapshot = timeSec;
  notifyVideoTime();
};

const subscribeVideoTime = (onStoreChange: () => void): (() => void) => {
  videoTimeListeners.add(onStoreChange);
  return () => {
    videoTimeListeners.delete(onStoreChange);
  };
};

const getVideoTimeSnapshot = (): number => videoTimeSnapshot;
const getVideoTimeServerSnapshot = (): number => 0;

/**
 * Subscribe to the current video display time without causing re-renders
 * in WorkspaceGrid. Only components that call this hook will re-render.
 */
const useVideoDisplayTime = (): number => {
  return useSyncExternalStore(
    subscribeVideoTime,
    getVideoTimeSnapshot,
    getVideoTimeServerSnapshot,
  );
};

// ── PaneSwitcher ─────────────────────────────────────────────
type PaneSwitcherOption = {
  label: string;
  ariaLabel: string;
  value: string;
};

type PaneSwitcherProps = {
  options: PaneSwitcherOption[];
  active: string;
  onSelect: (value: string) => void;
  disabledValues?: string[];
};

const PaneSwitcher = memo(function PaneSwitcher({
  options,
  active,
  onSelect,
  disabledValues,
}: PaneSwitcherProps): ReactElement {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
      {options.map((option) => {
        const isActive = option.value === active;
        const isDisabled = disabledValues?.includes(option.value) ?? false;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            disabled={isDisabled}
            className={`rounded-full px-2 py-1 text-[11px] transition ${
              isActive
                ? "bg-accent-muted text-accent shadow-sm font-semibold"
                : isDisabled
                  ? "text-text-subtle"
                  : "text-text-muted hover:bg-surface hover:text-foreground"
            }`}
            aria-label={option.ariaLabel}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});

const VC_OPTIONS: PaneSwitcherOption[] = [
  { label: "V", ariaLabel: "Show video", value: "video" },
  { label: "C", ariaLabel: "Show code", value: "code" },
];

const AC_OPTIONS: PaneSwitcherOption[] = [
  { label: "A", ariaLabel: "Show assistant", value: "chat" },
  { label: "C", ariaLabel: "Show code", value: "code" },
];

// ── Pane state external store ─────────────────────────────────
const paneListeners = new Set<() => void>();
let singlePaneSnapshot: "video" | "code" = "video";
let leftPaneSnapshot: "video" | "code" = "video";
let rightPaneSnapshot: "chat" | "code" = "chat";

const notifyPane = (): void => {
  for (const listener of paneListeners) {
    listener();
  }
};

const readSinglePane = (): "video" | "code" => {
  const stored = storageAdapter.getItem("niotebook.pane.single");
  if (stored === "video" || stored === "code") {
    return stored;
  }
  return "video";
};

const readLeftPane = (): "video" | "code" => {
  const stored = storageAdapter.getItem("niotebook.pane.left");
  if (stored === "video" || stored === "code") {
    return stored;
  }
  return "video";
};

const readRightPane = (): "chat" | "code" => {
  const stored = storageAdapter.getItem("niotebook.pane.right");
  if (stored === "chat" || stored === "code") {
    return stored;
  }
  return "chat";
};

const hydratePaneStore = (): void => {
  const storedSingle = readSinglePane();
  const storedLeft = readLeftPane();
  const storedRight = readRightPane();

  if (storedSingle !== singlePaneSnapshot) {
    singlePaneSnapshot = storedSingle;
  }

  if (storedLeft !== leftPaneSnapshot) {
    leftPaneSnapshot = storedLeft;
  }

  if (leftPaneSnapshot === "code") {
    rightPaneSnapshot = "chat";
    storageAdapter.setItem("niotebook.pane.right", "chat");
  } else if (storedRight !== rightPaneSnapshot) {
    rightPaneSnapshot = storedRight;
  }

  notifyPane();
};

const WorkspaceGrid = (): ReactElement => {
  const { activePreset, setPreset } = useLayoutPreset();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscribe = useCallback((onStoreChange: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    paneListeners.add(onStoreChange);

    const handleStorage = (event: StorageEvent): void => {
      if (
        event.key !== "niotebook.pane.single" &&
        event.key !== "niotebook.pane.left" &&
        event.key !== "niotebook.pane.right"
      ) {
        return;
      }

      const nextSingle = readSinglePane();
      const nextLeft = readLeftPane();
      const nextRight = readRightPane();

      if (nextSingle !== singlePaneSnapshot) {
        singlePaneSnapshot = nextSingle;
      }

      if (nextLeft !== leftPaneSnapshot) {
        leftPaneSnapshot = nextLeft;
      }

      if (leftPaneSnapshot === "code") {
        rightPaneSnapshot = "chat";
        storageAdapter.setItem("niotebook.pane.right", "chat");
      } else if (nextRight !== rightPaneSnapshot) {
        rightPaneSnapshot = nextRight;
      }

      notifyPane();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      paneListeners.delete(onStoreChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const singlePane = useSyncExternalStore(
    subscribe,
    (): "video" | "code" => singlePaneSnapshot,
    (): "video" | "code" => "video",
  );

  const leftPane = useSyncExternalStore(
    subscribe,
    (): "video" | "code" => leftPaneSnapshot,
    (): "video" | "code" => "video",
  );

  const rightPane = useSyncExternalStore(
    subscribe,
    (): "chat" | "code" => rightPaneSnapshot,
    (): "chat" | "code" => "chat",
  );

  const setRightPane = useCallback((next: "chat" | "code"): void => {
    rightPaneSnapshot = next;
    storageAdapter.setItem("niotebook.pane.right", next);
    notifyPane();
  }, []);

  const setSinglePane = useCallback((next: "video" | "code"): void => {
    singlePaneSnapshot = next;
    storageAdapter.setItem("niotebook.pane.single", next);
    notifyPane();
  }, []);

  const setLeftPane = useCallback((next: "video" | "code"): void => {
    leftPaneSnapshot = next;
    storageAdapter.setItem("niotebook.pane.left", next);
    if (next === "code") {
      rightPaneSnapshot = "chat";
      storageAdapter.setItem("niotebook.pane.right", "chat");
    }
    notifyPane();
  }, []);
  const [seekRequest, setSeekRequest] = useState<{
    timeSec: number;
    token: number;
  } | null>(null);
  const videoTimeRef = useRef<number>(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [codeHash, setCodeHash] = useState<string | null>(null);
  const [codeSnapshot, setCodeSnapshot] = useState<CodeSnapshotSummary | null>(
    null,
  );
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    hydratePaneStore();
  }, []);

  const handleSeek = useCallback((timestampSec: number): void => {
    setSeekRequest((prev) => ({
      timeSec: timestampSec,
      token: (prev?.token ?? 0) + 1,
    }));
  }, []);

  const handleVideoTime = useCallback((timestampSec: number): void => {
    videoTimeRef.current = timestampSec;
    setVideoTime(timestampSec);
  }, []);

  const handleVideoDisplayTime = useCallback((timestampSec: number): void => {
    videoTimeRef.current = timestampSec;
    setVideoTime(timestampSec);
  }, []);

  const handleThreadChange = useCallback(
    (nextThreadId: string | null): void => {
      setThreadId(nextThreadId);
    },
    [],
  );

  const handleSnapshot = useCallback((snapshot: CodeSnapshotSummary): void => {
    setCodeHash(snapshot.codeHash);
    setCodeSnapshot(snapshot);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const key = event.key.toLowerCase();

      if (key === "1") {
        setPreset("single");
        return;
      }

      if (key === "2") {
        setPreset("split");
        return;
      }

      if (key === "3") {
        setPreset("triple");
        return;
      }

      if (key === "v") {
        if (activePreset === "single") {
          setSinglePane("video");
        } else if (activePreset === "split") {
          setLeftPane("video");
        }
        return;
      }

      if (key === "c") {
        if (activePreset === "single") {
          setSinglePane("code");
        } else if (activePreset === "split") {
          if (leftPane === "video") {
            setRightPane("code");
          } else {
            setLeftPane("code");
          }
        }
        return;
      }

      if (key === "a") {
        if (activePreset === "split") {
          setRightPane("chat");
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [
    activePreset,
    leftPane,
    setLeftPane,
    setPreset,
    setRightPane,
    setSinglePane,
  ]);

  const lessonId = searchParams.get("lessonId");
  // Cache localStorage read so it doesn't hit storage on every render
  const storedLessonId = useMemo(
    () => (isMounted ? storageAdapter.getItem("niotebook.lesson") : null),
    [isMounted],
  );
  const startLessonId = storedLessonId ?? DEFAULT_LESSON_ID;

  useEffect(() => {
    if (lessonId || !startLessonId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("lessonId", startLessonId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [lessonId, pathname, router, searchParams, startLessonId]);

  const handleSelectSingle = useCallback(
    (value: string) => setSinglePane(value as "video" | "code"),
    [setSinglePane],
  );

  const handleSelectLeft = useCallback(
    (value: string) => setLeftPane(value as "video" | "code"),
    [setLeftPane],
  );

  const handleSelectRight = useCallback(
    (value: string) => setRightPane(value as "chat" | "code"),
    [setRightPane],
  );

  const rightDisabled = useMemo(
    () => (leftPane === "code" ? ["code"] : undefined),
    [leftPane],
  );

  const activeLessonId = lessonId ?? startLessonId;

  if (!activeLessonId) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-sm text-text-muted">
        <div>Loading workspace...</div>
      </div>
    );
  }

  const effectivePreset = isMounted ? activePreset : "split";

  if (effectivePreset === "single") {
    return (
      <div className="flex h-full min-h-0 divide-x divide-border">
        {singlePane === "video" ? (
          <div className="flex min-w-0 flex-1">
            <VideoPane
              lessonId={activeLessonId}
              seekRequest={seekRequest}
              onTimeChange={handleVideoTime}
              onTimeUpdate={handleVideoDisplayTime}
              threadId={threadId ?? undefined}
              codeHash={codeHash ?? undefined}
              showInfoStrip
              headerExtras={
                <PaneSwitcher
                  options={VC_OPTIONS}
                  active="video"
                  onSelect={handleSelectSingle}
                />
              }
            />
          </div>
        ) : null}
        {singlePane === "code" ? (
          <div className="flex min-w-0 flex-1">
            <CodePane
              lessonId={activeLessonId}
              onSnapshot={handleSnapshot}
              headerExtras={
                <PaneSwitcher
                  options={VC_OPTIONS}
                  active="code"
                  onSelect={handleSelectSingle}
                />
              }
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (effectivePreset === "split") {
    return (
      <div className="flex h-full min-h-0 divide-x divide-border">
        <div className="flex min-w-0 flex-[7] flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {leftPane === "video" ? (
              <VideoPane
                lessonId={activeLessonId}
                seekRequest={seekRequest}
                onTimeChange={handleVideoTime}
                onTimeUpdate={handleVideoDisplayTime}
                threadId={threadId ?? undefined}
                codeHash={codeHash ?? undefined}
                showInfoStrip
                headerExtras={
                  <PaneSwitcher
                    options={VC_OPTIONS}
                    active="video"
                    onSelect={handleSelectLeft}
                  />
                }
              />
            ) : null}
            {leftPane === "code" ? (
              <CodePane
                lessonId={activeLessonId}
                onSnapshot={handleSnapshot}
                headerExtras={
                  <PaneSwitcher
                    options={VC_OPTIONS}
                    active="code"
                    onSelect={handleSelectLeft}
                  />
                }
              />
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-[3] flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {rightPane === "chat" ? (
              <AiPane
                lessonId={activeLessonId}
                onSeek={handleSeek}
                codeSnapshot={codeSnapshot}
                onThreadChange={handleThreadChange}
                headerExtras={
                  <PaneSwitcher
                    options={AC_OPTIONS}
                    active="chat"
                    onSelect={handleSelectRight}
                    disabledValues={rightDisabled}
                  />
                }
              />
            ) : null}
            {rightPane === "code" ? (
              <CodePane
                lessonId={activeLessonId}
                onSnapshot={handleSnapshot}
                headerExtras={
                  <PaneSwitcher
                    options={AC_OPTIONS}
                    active="code"
                    onSelect={handleSelectRight}
                    disabledValues={rightDisabled}
                  />
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <LayoutGrid preset={effectivePreset}>
      <VideoPane
        lessonId={activeLessonId}
        seekRequest={seekRequest}
        onTimeChange={handleVideoTime}
        onTimeUpdate={handleVideoDisplayTime}
        threadId={threadId ?? undefined}
        codeHash={codeHash ?? undefined}
        showInfoStrip
      />
      <CodePane lessonId={activeLessonId} onSnapshot={handleSnapshot} />
      <AiPane
        lessonId={activeLessonId}
        onSeek={handleSeek}
        codeSnapshot={codeSnapshot}
        onThreadChange={handleThreadChange}
      />
    </LayoutGrid>
  );
};

export { useVideoDisplayTime, WorkspaceGrid };
