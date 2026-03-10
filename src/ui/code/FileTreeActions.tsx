"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
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

type InlineMode =
  | { kind: "newFile" }
  | { kind: "newFolder" }
  | { kind: "rename"; defaultValue: string }
  | { kind: "confirmDelete" }
  | null;

const FileTreeActions = ({
  targetPath,
  isDirectory,
  x,
  y,
  onClose,
}: FileTreeActionsProps): ReactElement => {
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { createFile, createDirectory, deleteNode, renameNode } =
    useFileSystemStore();
  const [mode, setMode] = useState<InlineMode>(null);

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

  // Auto-focus inline input
  useEffect(() => {
    if (mode && mode.kind !== "confirmDelete") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [mode]);

  const parentDir =
    isDirectory && targetPath
      ? targetPath
      : targetPath
        ? targetPath.slice(0, targetPath.lastIndexOf("/")) || "/"
        : "/project";

  const submitInput = useCallback(
    (value: string) => {
      if (!value.trim()) return;
      if (!mode) return;

      switch (mode.kind) {
        case "newFile":
          createFile(`${parentDir}/${value.trim()}`);
          break;
        case "newFolder":
          createDirectory(`${parentDir}/${value.trim()}`);
          break;
        case "rename": {
          if (!targetPath) break;
          const newPath =
            (targetPath.slice(0, targetPath.lastIndexOf("/")) || "/") +
            "/" +
            value.trim();
          renameNode(targetPath, newPath);
          break;
        }
      }
      onClose();
    },
    [
      mode,
      parentDir,
      targetPath,
      createFile,
      createDirectory,
      renameNode,
      onClose,
    ],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submitInput(e.currentTarget.value);
      } else if (e.key === "Escape") {
        onClose();
      }
      e.stopPropagation();
    },
    [submitInput, onClose],
  );

  const handleDelete = useCallback(() => {
    if (!targetPath) return;
    deleteNode(targetPath);
    onClose();
  }, [targetPath, deleteNode, onClose]);

  const itemClass =
    "px-3 py-1.5 text-xs cursor-pointer hover:bg-workspace-editor text-workspace-text";

  // Inline input mode
  if (mode && mode.kind !== "confirmDelete") {
    const label =
      mode.kind === "newFile"
        ? "File name:"
        : mode.kind === "newFolder"
          ? "Folder name:"
          : "Rename to:";

    return (
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[180px] rounded-md border border-workspace-border bg-workspace-sidebar p-2 shadow-lg"
        style={{ left: x, top: y }}
      >
        <label className="mb-1 block text-[10px] text-workspace-text-muted">
          {label}
        </label>
        <input
          ref={inputRef}
          type="text"
          defaultValue={mode.kind === "rename" ? mode.defaultValue : ""}
          onKeyDown={handleInputKeyDown}
          onBlur={() => onClose()}
          className="w-full rounded border border-workspace-border bg-workspace-editor px-2 py-1 text-xs text-workspace-text outline-none focus:border-accent"
        />
      </div>
    );
  }

  // Confirm delete mode
  if (mode?.kind === "confirmDelete") {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[180px] rounded-md border border-workspace-border bg-workspace-sidebar p-2 shadow-lg"
        style={{ left: x, top: y }}
      >
        <p className="mb-2 text-xs text-workspace-text">
          Delete &ldquo;{targetPath?.split("/").pop()}&rdquo;?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="rounded bg-status-error px-2 py-1 text-xs text-white"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded border border-workspace-border px-2 py-1 text-xs text-workspace-text"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Default menu
  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[140px] rounded-md border border-workspace-border bg-workspace-sidebar py-1 text-workspace-text shadow-lg"
      style={{ left: x, top: y }}
      role="menu"
    >
      <div
        role="menuitem"
        className={itemClass}
        onClick={() => setMode({ kind: "newFile" })}
      >
        New File
      </div>
      <div
        role="menuitem"
        className={itemClass}
        onClick={() => setMode({ kind: "newFolder" })}
      >
        New Folder
      </div>
      {targetPath ? (
        <>
          <div
            role="separator"
            className="my-1 border-t border-workspace-border-muted"
          />
          <div
            role="menuitem"
            className={itemClass}
            onClick={() =>
              setMode({
                kind: "rename",
                defaultValue: targetPath.slice(targetPath.lastIndexOf("/") + 1),
              })
            }
          >
            Rename
          </div>
          <div
            role="menuitem"
            className={`${itemClass} text-status-error`}
            onClick={() => setMode({ kind: "confirmDelete" })}
          >
            Delete
          </div>
        </>
      ) : null}
    </div>
  );
};

export { FileTreeActions };
export type { FileTreeActionsProps };
