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

type EditorAreaProps = {
  /** Whether to show the file tree sidebar. Hidden in triple layout. */
  showFileTree: boolean;
};

const EditorArea = ({ showFileTree }: EditorAreaProps): ReactElement => (
  <div className="flex min-h-0 flex-1">
    {showFileTree ? <FileTreeSidebar /> : null}
    <TabbedEditor />
  </div>
);

export default EditorArea;
export { EditorArea };
export type { EditorAreaProps };
