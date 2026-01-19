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
  const [seekTimeSec, setSeekTimeSec] = useState<number | null>(null);
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [codeHash, setCodeHash] = useState<string | null>(null);

  const handleSeek = useCallback((timestampSec: number): void => {
    setSeekTimeSec(timestampSec);
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
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted text-sm text-text-muted">
        Select a lesson to start.
      </div>
    );
  }

  if (activePreset === "single") {
    return (
      <div className="flex flex-col gap-6">
        <VideoPane
          lessonId={lessonId}
          seekTimeSec={seekTimeSec}
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
      <div className="flex gap-6">
        <div className="min-w-0 flex-[3]">
          <VideoPane
            lessonId={lessonId}
            seekTimeSec={seekTimeSec}
            onTimeChange={handleVideoTime}
            threadId={threadId ?? undefined}
            codeHash={codeHash ?? undefined}
          />
        </div>
        <div className="flex min-w-0 flex-[2] flex-col gap-6">
          <CodePane lessonId={lessonId} onSnapshot={handleSnapshot} />

          <AiPane
            lessonId={lessonId}
            onSeek={handleSeek}
            videoTimeSec={videoTimeSec}
            onThreadChange={handleThreadChange}
          />
        </div>
      </div>
    );
  }

  return (
    <LayoutGrid preset={activePreset}>
      <VideoPane
        lessonId={lessonId}
        seekTimeSec={seekTimeSec}
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
