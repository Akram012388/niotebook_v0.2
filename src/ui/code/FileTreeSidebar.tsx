"use client";

import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from "react";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";
import { FileTreeActions } from "./FileTreeActions";
import { FileTreeNode } from "./FileTreeNode";

type ContextMenuState = {
  x: number;
  y: number;
  path: string | null;
  isDirectory: boolean;
} | null;

const FileTreeSidebar = (): ReactElement => {
  const vfs = useFileSystemStore((s) => s.vfs);
  const files = useFileSystemStore((s) => s.files);
  // Subscribe to files so we re-render on VFS changes
  void files;

  const [collapsed, setCollapsed] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const rootChildren = vfs.readDir("/project").sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent, path: string, isDirectory: boolean) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, path, isDirectory });
    },
    [],
  );

  const handleRootContextMenu = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path: null,
      isDirectory: true,
    });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  if (collapsed) {
    return (
      <div className="flex min-w-0 h-full w-full flex-col items-center bg-workspace-sidebar pt-2 text-workspace-text">
        <button
          type="button"
          className="text-xs text-workspace-text-muted hover:text-workspace-text"
          onClick={() => setCollapsed(false)}
          aria-label="Expand file explorer"
          title="Expand"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 h-full w-full flex-col bg-workspace-sidebar text-workspace-text">
      <div className="flex items-center justify-between border-b border-workspace-border-muted px-2 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-workspace-text-muted">
          Files
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="text-xs text-workspace-text-muted hover:text-workspace-text"
            onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                path: null,
                isDirectory: true,
              });
            }}
            aria-label="New file or folder"
            title="New..."
          >
            +
          </button>
          <button
            type="button"
            className="text-xs text-workspace-text-muted hover:text-workspace-text"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse file explorer"
            title="Collapse"
          >
            ◀
          </button>
        </div>
      </div>
      <nav
        className="flex-1 overflow-y-auto px-1 py-1"
        onContextMenu={handleRootContextMenu}
      >
        <ul role="tree" aria-label="File explorer">
          {rootChildren.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              onContextMenu={handleContextMenu}
            />
          ))}
        </ul>
      </nav>
      {contextMenu ? (
        <FileTreeActions
          targetPath={contextMenu.path}
          isDirectory={contextMenu.isDirectory}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      ) : null}
    </div>
  );
};

export { FileTreeSidebar };
