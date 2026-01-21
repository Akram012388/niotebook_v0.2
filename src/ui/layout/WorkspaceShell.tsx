"use client";

import { WorkspaceGrid } from "./WorkspaceGrid";
import type { ReactElement } from "react";

const WorkspaceShell = (): ReactElement => {
  return (
    <div className="h-full min-h-0">
      <WorkspaceGrid />
    </div>
  );
};

export { WorkspaceShell };
