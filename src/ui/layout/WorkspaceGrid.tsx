"use client";

import type { ReactElement } from "react";
import { LayoutGrid } from "./LayoutGrid";
import { useLayoutPreset } from "./LayoutPresetContext";

const WorkspaceGrid = (): ReactElement => {
  const { activePreset } = useLayoutPreset();

  return (
    <LayoutGrid preset={activePreset}>
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
        Video pane placeholder
      </section>
      {activePreset !== "single" ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
          Code pane placeholder
        </section>
      ) : null}
      {activePreset === "triple" ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm text-slate-500">
          AI pane placeholder
        </section>
      ) : null}
    </LayoutGrid>
  );
};

export { WorkspaceGrid };
