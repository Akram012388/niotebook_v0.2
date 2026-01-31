"use client";

import { WorkspaceGrid } from "./WorkspaceGrid";
import type { ReactElement } from "react";

const WorkspaceShell = (): ReactElement => {
  return (
    <div className="relative h-full min-h-0">
      <div className="hidden h-full min-h-0 lg:block">
        <WorkspaceGrid />
      </div>
      <div className="flex h-full min-h-0 items-center justify-center bg-background px-6 text-center lg:hidden">
        <p className="text-sm font-medium text-text-muted">
          niotebook is best experinced on desktop
        </p>
      </div>
    </div>
  );
};

export { WorkspaceShell };
