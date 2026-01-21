"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useSearchParams } from "next/navigation";
import { AiPane } from "../panes/AiPane";
import { CodePane } from "../panes/CodePane";
import { VideoPane } from "../panes/VideoPane";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";

const WorkspaceGrid = (): ReactElement => {
  const { activePreset } = useLayoutPreset();
  const searchParams = useSearchParams();
  const [singlePane, setSinglePane] = useState<"video" | "code" | "chat">(() => {
    if (typeof window === "undefined") {
      return "video";
    }
    const storedSingle = window.localStorage.getItem("niotebook.pane.single");
    if (storedSingle === "video" || storedSingle === "code" || storedSingle === "chat") {
      return storedSingle;
    }
    return "video";
  });
  const [rightPane, setRightPane] = useState<"chat" | "code">(() => {
    if (typeof window === "undefined") {
      return "chat";
    }
    const storedRight = window.localStorage.getItem("niotebook.pane.right");
    if (storedRight === "chat" || storedRight === "code") {
      return storedRight;
    }
    return "chat";
  });
  const [seekRequest, setSeekRequest] = useState<{
    timeSec: number;
    token: number;
  } | null>(null);
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [codeHash, setCodeHash] = useState<string | null>(null);

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

  const handleSnapshot = useCallback((snapshot: { codeHash: string }): void => {
    setCodeHash(snapshot.codeHash);
  }, []);

  const lessonId = searchParams.get("lessonId");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("niotebook.pane.single", singlePane);
    }
  }, [singlePane]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("niotebook.pane.right", rightPane);
    }
  }, [rightPane]);

  const rightPaneLabel = useMemo(
    () => (rightPane === "chat" ? "Assistant" : "Code"),
    [rightPane],
  );

  if (!lessonId) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted text-sm text-text-muted">
        Select a lesson to start.
      </div>
    );
  }

  if (activePreset === "single") {
    return (
      <div className="flex h-full min-h-0">
        {singlePane === "video" ? (
          <VideoPane
            lessonId={lessonId}
            seekRequest={seekRequest}
            onTimeChange={handleVideoTime}
            threadId={threadId ?? undefined}
            codeHash={codeHash ?? undefined}
          />
        ) : null}
        {singlePane === "code" ? (
          <CodePane lessonId={lessonId} onSnapshot={handleSnapshot} />
        ) : null}
        {singlePane === "chat" ? (
          <AiPane
            lessonId={lessonId}
            onSeek={handleSeek}
            videoTimeSec={videoTimeSec}
            onThreadChange={handleThreadChange}
          />
        ) : null}
      </div>
    );
  }

  if (activePreset === "split") {
    return (
      <div className="flex h-full min-h-0 gap-6">
        <div className="flex min-w-0 flex-[3] flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <VideoPane
              lessonId={lessonId}
              seekRequest={seekRequest}
              onTimeChange={handleVideoTime}
              threadId={threadId ?? undefined}
              codeHash={codeHash ?? undefined}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-[2] flex-col gap-6 min-h-0">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-xs text-text-muted">
            <span className="font-medium text-foreground">{rightPaneLabel}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRightPane("chat")}
                className={`rounded-full border px-2.5 py-1 ${
                  rightPane === "chat"
                    ? "border-border bg-surface text-foreground"
                    : "border-border text-text-muted"
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setRightPane("code")}
                className={`rounded-full border px-2.5 py-1 ${
                  rightPane === "code"
                    ? "border-border bg-surface text-foreground"
                    : "border-border text-text-muted"
                }`}
              >
                Code
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {rightPane === "chat" ? (
              <AiPane
                lessonId={lessonId}
                onSeek={handleSeek}
                videoTimeSec={videoTimeSec}
                onThreadChange={handleThreadChange}
              />
            ) : null}
            {rightPane === "code" ? (
              <CodePane lessonId={lessonId} onSnapshot={handleSnapshot} />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <LayoutGrid preset={activePreset}>
      <VideoPane
        lessonId={lessonId}
        seekRequest={seekRequest}
        onTimeChange={handleVideoTime}
        threadId={threadId ?? undefined}
        codeHash={codeHash ?? undefined}
      />
      <CodePane lessonId={lessonId} onSnapshot={handleSnapshot} />
      <AiPane
        lessonId={lessonId}
        onSeek={handleSeek}
        videoTimeSec={videoTimeSec}
        onThreadChange={handleThreadChange}
      />
    </LayoutGrid>
  );
};

export { WorkspaceGrid };
