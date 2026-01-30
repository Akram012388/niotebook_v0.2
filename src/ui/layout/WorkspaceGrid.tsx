"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
  type ReactElement,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AiPane } from "../panes/AiPane";
import { CodePane } from "../panes/CodePane";
import { VideoPane } from "../panes/VideoPane";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";
import { storageAdapter } from "../../infra/storageAdapter";
import type { CodeSnapshotSummary } from "../../domain/resume";

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
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
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
    setVideoTimeSec(timestampSec);
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
        return;
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
  const defaultLessonId = useMemo((): string | null => {
    return process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID ?? null;
  }, []);
  const storedLessonId = isMounted
    ? storageAdapter.getItem("niotebook.lesson")
    : null;
  const startLessonId = storedLessonId ?? defaultLessonId;

  useEffect(() => {
    if (lessonId || !startLessonId) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("lessonId", startLessonId);
    router.replace(`/?${params.toString()}`);
  }, [lessonId, router, searchParams, startLessonId]);

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
      <div className="flex h-full min-h-0 gap-4">
        {singlePane === "video" ? (
          <div className="flex min-w-0 flex-1">
            <VideoPane
              lessonId={activeLessonId}
              seekRequest={seekRequest}
              onTimeChange={handleVideoTime}
              threadId={threadId ?? undefined}
              codeHash={codeHash ?? undefined}
              showInfoStrip
              headerExtras={
                <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
                  <button
                    type="button"
                    onClick={() => setSinglePane("video")}
                    className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition"
                    aria-label="Show video"
                  >
                    V
                  </button>
                  <button
                    type="button"
                    onClick={() => setSinglePane("code")}
                    className="rounded-full px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface hover:text-foreground"
                    aria-label="Show code"
                  >
                    C
                  </button>
                </div>
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
                <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
                  <button
                    type="button"
                    onClick={() => setSinglePane("video")}
                    className="rounded-full px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface hover:text-foreground"
                    aria-label="Show video"
                  >
                    V
                  </button>
                  <button
                    type="button"
                    onClick={() => setSinglePane("code")}
                    className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition"
                    aria-label="Show code"
                  >
                    C
                  </button>
                </div>
              }
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (effectivePreset === "split") {
    return (
      <div className="flex h-full min-h-0 gap-4">
        <div className="flex min-w-0 flex-[3] flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {leftPane === "video" ? (
              <VideoPane
                lessonId={activeLessonId}
                seekRequest={seekRequest}
                onTimeChange={handleVideoTime}
                threadId={threadId ?? undefined}
                codeHash={codeHash ?? undefined}
                showInfoStrip
                headerExtras={
                  <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
                    <button
                      type="button"
                      onClick={() => setLeftPane("video")}
                      className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition"
                      aria-label="Show video"
                    >
                      V
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftPane("code")}
                      className="rounded-full px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface hover:text-foreground"
                      aria-label="Show code"
                    >
                      C
                    </button>
                  </div>
                }
              />
            ) : null}
            {leftPane === "code" ? (
              <CodePane
                lessonId={activeLessonId}
                onSnapshot={handleSnapshot}
                headerExtras={
                  <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
                    <button
                      type="button"
                      onClick={() => setLeftPane("video")}
                      className="rounded-full px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface hover:text-foreground"
                      aria-label="Show video"
                    >
                      V
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftPane("code")}
                      className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition"
                      aria-label="Show code"
                    >
                      C
                    </button>
                  </div>
                }
              />
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-[2] flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            {rightPane === "chat" ? (
              <AiPane
                lessonId={activeLessonId}
                onSeek={handleSeek}
                videoTimeSec={videoTimeSec}
                codeSnapshot={codeSnapshot}
                onThreadChange={handleThreadChange}
                headerExtras={
                  <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
                    <button
                      type="button"
                      onClick={() => setRightPane("chat")}
                      className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition"
                      aria-label="Show assistant"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPane("code")}
                      className={`rounded-full px-2 py-1 text-[11px] transition ${
                        leftPane === "code"
                          ? "text-text-subtle"
                          : "text-text-muted hover:bg-surface hover:text-foreground"
                      }`}
                      disabled={leftPane === "code"}
                      aria-label="Show code"
                    >
                      C
                    </button>
                  </div>
                }
              />
            ) : null}
            {rightPane === "code" ? (
              <CodePane
                lessonId={activeLessonId}
                onSnapshot={handleSnapshot}
                headerExtras={
                  <div className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
                    <button
                      type="button"
                      onClick={() => setRightPane("chat")}
                      className="rounded-full px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface hover:text-foreground"
                      aria-label="Show assistant"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPane("code")}
                      className="rounded-full bg-surface px-2 py-1 text-[11px] text-foreground transition"
                      disabled={leftPane === "code"}
                      aria-label="Show code"
                    >
                      C
                    </button>
                  </div>
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
        threadId={threadId ?? undefined}
        codeHash={codeHash ?? undefined}
        showInfoStrip
      />
      <CodePane lessonId={activeLessonId} onSnapshot={handleSnapshot} />
      <AiPane
        lessonId={activeLessonId}
        onSeek={handleSeek}
        videoTimeSec={videoTimeSec}
        codeSnapshot={codeSnapshot}
        onThreadChange={handleThreadChange}
      />
    </LayoutGrid>
  );
};

export { WorkspaceGrid };
