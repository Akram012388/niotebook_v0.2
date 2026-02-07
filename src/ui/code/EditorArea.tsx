"use client";

/**
 * EditorArea — composes FileTreeSidebar + TabbedEditor.
 *
 * This component imports CM6 transitively (via TabbedEditor) and must be
 * loaded via `next/dynamic({ ssr: false })` from CodePane.
 */
import { useEffect, type ReactElement } from "react";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { TabbedEditor } from "./TabbedEditor";
import { SplitPane } from "./SplitPane";

/** Clear persisted file-tree width so it always starts at minFirst. */
function clearFileTreeSplit(layoutKey: string | undefined): void {
  try {
    const key = `niotebook:split-file-tree:${layoutKey ?? "split"}`;
    localStorage.removeItem(key);
    sessionStorage.removeItem(`${key}:reset-on-load`);
  } catch {
    // storage unavailable
  }
}

type EditorAreaProps = {
  /** Whether to show the file tree sidebar. Hidden in triple layout. */
  showFileTree: boolean;
  /** Layout key used to scope per-layout split state. */
  layoutKey?: "single" | "split";
};

const EditorArea = ({
  showFileTree,
  layoutKey,
}: EditorAreaProps): ReactElement => {
  useEffect(() => {
    clearFileTreeSplit(layoutKey);
  }, [layoutKey]);

  if (!showFileTree) {
    return (
      <div className="flex min-h-0 h-full flex-1 bg-workspace-editor">
        <TabbedEditor />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-full flex-1 bg-workspace-editor">
      <SplitPane
        direction="horizontal"
        initialSplit={120}
        minFirst={120}
        maxFirst={300}
        minSecond={240}
        storageKey={`niotebook:split-file-tree:${layoutKey ?? "split"}`}
        resetOnLoad="first"
        first={
          <div className="flex min-h-0 h-full bg-workspace-sidebar">
            <FileTreeSidebar />
          </div>
        }
        second={
          <div className="flex min-h-0 h-full bg-workspace-editor">
            <TabbedEditor />
          </div>
        }
      />
    </div>
  );
};

export default EditorArea;
export { EditorArea };
export type { EditorAreaProps };
