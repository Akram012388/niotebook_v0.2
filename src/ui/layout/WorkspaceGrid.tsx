"use client";

import type { ReactElement } from "react";
import { AiPane } from "../panes/AiPane";
import { CodePane } from "../panes/CodePane";
import { VideoPane } from "../panes/VideoPane";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";

const WorkspaceGrid = (): ReactElement => {
  const { activePreset } = useLayoutPreset();

  if (activePreset === "single") {
    return (
      <div className="flex flex-col gap-6">
        <VideoPane />
        <CodePane />
        <AiPane />
      </div>
    );
  }

  if (activePreset === "split") {
    return (
      <div className="flex gap-6">
        <div className="min-w-0 flex-[3]">
          <VideoPane />
        </div>
        <div className="flex min-w-0 flex-[2] flex-col gap-6">
          <CodePane />
          <AiPane />
        </div>
      </div>
    );
  }

  return (
    <LayoutGrid preset={activePreset}>
      <VideoPane />
      <CodePane />
      <AiPane />
    </LayoutGrid>
  );
};

export { WorkspaceGrid };
