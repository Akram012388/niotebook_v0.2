import type { ReactElement } from "react";

/**
 * Loading placeholder rendered while CodeMirror 6 is dynamically imported.
 * Mimics code lines with random widths.
 */
const SKELETON_LINES = 12;

const EditorSkeleton = (): ReactElement => (
  <div className="flex flex-1 flex-col gap-1 bg-workspace-editor p-4">
    {Array.from({ length: SKELETON_LINES }, (_, i) => (
      <div
        key={i}
        className="h-4 animate-pulse rounded bg-workspace-border"
        style={{ width: `${40 + ((i * 17) % 50)}%` }}
      />
    ))}
  </div>
);

export { EditorSkeleton };
