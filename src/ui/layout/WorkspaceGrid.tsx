"use client";

import { useCallback, useState, type ReactElement } from "react";
import { AiPane } from "../panes/AiPane";
import { CodePane } from "../panes/CodePane";
import { VideoPane } from "../panes/VideoPane";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";

const WorkspaceGrid = (): ReactElement => {
  const { activePreset } = useLayoutPreset();
  const [seekTimeSec, setSeekTimeSec] = useState<number | null>(null);

  const handleSeek = useCallback((timestampSec: number): void => {
    setSeekTimeSec(timestampSec);
  }, []);

  if (activePreset === "single") {
    return (
      <div className="flex flex-col gap-6">
        <VideoPane seekTimeSec={seekTimeSec} />
        <CodePane />
        <AiPane onSeek={handleSeek} />
      </div>
    );
  }

  if (activePreset === "split") {
    return (
      <div className="flex gap-6">
        <div className="min-w-0 flex-[3]">
          <VideoPane seekTimeSec={seekTimeSec} />
        </div>
        <div className="flex min-w-0 flex-[2] flex-col gap-6">
          <CodePane />
          <AiPane onSeek={handleSeek} />
        </div>
      </div>
    );
  }

  return (
    <LayoutGrid preset={activePreset}>
      <VideoPane seekTimeSec={seekTimeSec} />
      <CodePane />
      <AiPane onSeek={handleSeek} />
    </LayoutGrid>
  );
};

export { WorkspaceGrid };
