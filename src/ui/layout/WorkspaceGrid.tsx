"use client";

import { useCallback, useState, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import { AiPane } from "../panes/AiPane";
import { CodePane } from "../panes/CodePane";
import { VideoPane } from "../panes/VideoPane";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";

const WorkspaceGrid = (): ReactElement => {
  const { activePreset } = useLayoutPreset();
  const searchParams = useSearchParams();
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

  if (!lessonId) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted text-sm text-text-muted">
        Select a lesson to start.
      </div>
    );
  }

  if (activePreset === "single") {
    return (
      <div className="flex h-full flex-col gap-6 overflow-y-auto pr-1">
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
          <div className="flex-1 min-h-0">
            <CodePane lessonId={lessonId} onSnapshot={handleSnapshot} />
          </div>
          <div className="flex-1 min-h-0">
            <AiPane
              lessonId={lessonId}
              onSeek={handleSeek}
              videoTimeSec={videoTimeSec}
              onThreadChange={handleThreadChange}
            />
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
