"use client";

/**
 * EditorArea — composes FileTreeSidebar + TabbedEditor.
 *
 * This component imports CM6 transitively (via TabbedEditor) and must be
 * loaded via `next/dynamic({ ssr: false })` from CodePane.
 */
import type { ReactElement } from "react";
import { FileTreeSidebar } from "./FileTreeSidebar";
import { TabbedEditor } from "./TabbedEditor";
import { SplitPane } from "./SplitPane";

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
