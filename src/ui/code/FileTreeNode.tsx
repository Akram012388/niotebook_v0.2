"use client";

import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from "react";
import type { VFSNode } from "../../infra/vfs/types";
import { useEditorStore } from "./useEditorStore";

type FileTreeNodeProps = {
  node: VFSNode;
  depth: number;
  onContextMenu: (
    e: ReactMouseEvent,
    path: string,
    isDirectory: boolean,
  ) => void;
};

const FILE_ICONS: Record<string, string> = {
  js: "📄",
  python: "🐍",
  html: "🌐",
  c: "⚙️",
  css: "🎨",
};

const FileTreeNode = ({
  node,
  depth,
  onContextMenu,
}: FileTreeNodeProps): ReactElement => {
  const [expanded, setExpanded] = useState(true);
  const activeFileId = useEditorStore((s) => s.activeFileId);
  const openFile = useEditorStore((s) => s.openFile);

  const isDirectory = node.kind === "directory";
  const isActive = !isDirectory && activeFileId === node.path;

  const handleClick = useCallback(() => {
    if (isDirectory) {
      setExpanded((prev) => !prev);
    } else {
      void openFile(node.path);
    }
  }, [isDirectory, openFile, node.path]);

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      onContextMenu(e, node.path, isDirectory);
    },
    [onContextMenu, node.path, isDirectory],
  );

  const icon = isDirectory
    ? expanded
      ? "📂"
      : "📁"
    : FILE_ICONS[node.kind === "file" ? (node.language ?? "") : ""] ?? "📄";

  const children =
    isDirectory && node.kind === "directory"
      ? Array.from(node.children.values()).sort((a, b) => {
          // Directories first, then alphabetical
          if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
      : [];

  return (
    <li
      role="treeitem"
      aria-expanded={isDirectory ? expanded : undefined}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
    >
      <button
        type="button"
        className={`flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs ${
          isActive
            ? "bg-surface-muted font-medium text-foreground"
            : "text-text-muted hover:bg-surface-muted hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="flex-shrink-0 text-[10px]">{icon}</span>
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && expanded && children.length > 0 ? (
        <ul role="group">
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

export { FileTreeNode };
