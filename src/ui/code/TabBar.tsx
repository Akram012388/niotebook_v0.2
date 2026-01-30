"use client";

import { useCallback, type ReactElement } from "react";
import { useEditorStore } from "./useEditorStore";
import { EditorTab } from "./EditorTab";

const TabBar = (): ReactElement => {
  const openFiles = useEditorStore((s) => s.openFiles);
  const activeFileId = useEditorStore((s) => s.activeFileId);
  const setActiveFile = useEditorStore((s) => s.setActiveFile);
  const closeFile = useEditorStore((s) => s.closeFile);

  const handleActivate = useCallback(
    (id: string) => setActiveFile(id),
    [setActiveFile],
  );

  const handleClose = useCallback((id: string) => closeFile(id), [closeFile]);

  if (openFiles.length === 0) return <div />;

  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex items-center overflow-x-auto border-b border-workspace-border bg-workspace-tabbar"
    >
      {openFiles.map((file) => (
        <EditorTab
          key={file.id}
          id={file.id}
          name={file.name}
          isActive={file.id === activeFileId}
          isDirty={file.isDirty}
          onActivate={handleActivate}
          onClose={handleClose}
        />
      ))}
    </div>
  );
};

export { TabBar };
