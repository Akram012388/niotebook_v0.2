"use client";

/**
 * TabbedEditor — TabBar + CodeMirrorEditor.
 *
 * Maintains ONE EditorView (inside CodeMirrorEditor) and swaps EditorState
 * when the active tab changes. This is the CM6 multi-document pattern.
 *
 * This component imports CM6 directly and must be loaded via dynamic import.
 */
import { useCallback, useMemo, type ReactElement } from "react";
import type { EditorState } from "@codemirror/state";
import { useEditorStore } from "./useEditorStore";
import { TabBar } from "./TabBar";
import { CodeMirrorEditor } from "./CodeMirrorEditor";

const TabbedEditor = (): ReactElement => {
  const openFiles = useEditorStore((s) => s.openFiles);
  const activeFileId = useEditorStore((s) => s.activeFileId);
  const updateEditorState = useEditorStore((s) => s.updateEditorState);
  const markDirty = useEditorStore((s) => s.markDirty);
  const saveFile = useEditorStore((s) => s.saveFile);

  const activeFile = useMemo(
    () => openFiles.find((f) => f.id === activeFileId) ?? null,
    [openFiles, activeFileId],
  );

  const handleStateChange = useCallback(
    (state: EditorState, docChanged?: boolean) => {
      if (!activeFileId) return;
      updateEditorState(activeFileId, state);

      // Use the docChanged flag from CM6 transaction instead of O(n) toString comparison
      if (docChanged) {
        markDirty(activeFileId, true);
      }
    },
    [activeFileId, updateEditorState, markDirty],
  );

  // Ctrl+S handler is inside CM6 keymaps — but we also wire it here for safety
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeFileId) saveFile(activeFileId);
      }
    },
    [activeFileId, saveFile],
  );

  return (
    <div
      className="flex min-h-0 h-full flex-1 flex-col bg-workspace-editor text-workspace-text"
      onKeyDown={handleKeyDown}
    >
      <TabBar />
      {activeFile ? (
        <CodeMirrorEditor
          editorState={activeFile.editorState}
          onStateChange={handleStateChange}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-workspace-text-muted">
          Open a file from the tree to start editing
        </div>
      )}
    </div>
  );
};

export default TabbedEditor;
export { TabbedEditor };
