"use client";

import { useCallback, useEffect, useRef, type ReactElement } from "react";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";

type FileTreeActionsProps = {
  /** The VFS path the context menu was opened on. Null = root-level. */
  targetPath: string | null;
  /** Whether the target is a directory. */
  isDirectory: boolean;
  /** Screen coordinates for the menu. */
  x: number;
  y: number;
  /** Close the context menu. */
  onClose: () => void;
};

const FileTreeActions = ({
  targetPath,
  isDirectory,
  x,
  y,
  onClose,
}: FileTreeActionsProps): ReactElement => {
  const menuRef = useRef<HTMLUListElement>(null);
  const { createFile, createDirectory, deleteNode, renameNode } =
    useFileSystemStore();

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const parentDir =
    isDirectory && targetPath
      ? targetPath
      : targetPath
        ? targetPath.slice(0, targetPath.lastIndexOf("/")) || "/"
        : "/project";

  const handleNewFile = useCallback(() => {
    const name = window.prompt("New file name:");
    if (!name) return;
    createFile(`${parentDir}/${name}`);
    onClose();
  }, [parentDir, createFile, onClose]);

  const handleNewFolder = useCallback(() => {
    const name = window.prompt("New folder name:");
    if (!name) return;
    createDirectory(`${parentDir}/${name}`);
    onClose();
  }, [parentDir, createDirectory, onClose]);

  const handleRename = useCallback(() => {
    if (!targetPath) return;
    const oldName = targetPath.slice(targetPath.lastIndexOf("/") + 1);
    const newName = window.prompt("Rename to:", oldName);
    if (!newName || newName === oldName) return;
    const newPath =
      (targetPath.slice(0, targetPath.lastIndexOf("/")) || "/") + "/" + newName;
    renameNode(targetPath, newPath);
    onClose();
  }, [targetPath, renameNode, onClose]);

  const handleDelete = useCallback(() => {
    if (!targetPath) return;
    const confirmed = window.confirm(`Delete "${targetPath}"?`);
    if (!confirmed) return;
    deleteNode(targetPath);
    onClose();
  }, [targetPath, deleteNode, onClose]);

  const itemClass =
    "px-3 py-1.5 text-xs cursor-pointer hover:bg-workspace-editor text-workspace-text";

  return (
    <ul
      ref={menuRef}
      className="fixed z-50 min-w-[140px] rounded-md border border-workspace-border bg-workspace-sidebar py-1 text-workspace-text shadow-lg"
      style={{ left: x, top: y }}
      role="menu"
    >
      <li role="menuitem" className={itemClass} onClick={handleNewFile}>
        New File
      </li>
      <li role="menuitem" className={itemClass} onClick={handleNewFolder}>
        New Folder
      </li>
      {targetPath ? (
        <>
          <li
            role="separator"
            className="my-1 border-t border-workspace-border-muted"
          />
          <li role="menuitem" className={itemClass} onClick={handleRename}>
            Rename
          </li>
          <li
            role="menuitem"
            className={`${itemClass} text-red-500`}
            onClick={handleDelete}
          >
            Delete
          </li>
        </>
      ) : null}
    </ul>
  );
};

export { FileTreeActions };
export type { FileTreeActionsProps };
