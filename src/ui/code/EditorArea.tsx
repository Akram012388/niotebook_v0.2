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
};

const EditorArea = ({ showFileTree }: EditorAreaProps): ReactElement => {
  if (!showFileTree) {
    return (
      <div className="flex min-h-0 flex-1">
        <TabbedEditor />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <SplitPane
        direction="horizontal"
        initialSplit={0.22}
        minFirst={180}
        maxFirst={360}
        minSecond={240}
        storageKey="niotebook:split-file-tree"
        first={<FileTreeSidebar />}
        second={<TabbedEditor />}
      />
    </div>
  );
};

export default EditorArea;
export { EditorArea };
export type { EditorAreaProps };
