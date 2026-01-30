"use client";

import { useCallback, type ReactElement } from "react";

type EditorTabProps = {
  id: string;
  name: string;
  isActive: boolean;
  isDirty: boolean;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
};

const EditorTab = ({
  id,
  name,
  isActive,
  isDirty,
  onActivate,
  onClose,
}: EditorTabProps): ReactElement => {
  const handleClick = useCallback(() => onActivate(id), [id, onActivate]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(id);
    },
    [id, onClose],
  );

  const handleMiddleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        onClose(id);
      }
    },
    [id, onClose],
  );

  const handleCloseKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.stopPropagation();
        onClose(id);
      }
    },
    [id, onClose],
  );

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs transition ${
        isActive
          ? "border-workspace-accent bg-workspace-editor text-workspace-text"
          : "border-transparent text-workspace-text-muted hover:bg-workspace-editor hover:text-workspace-text"
      }`}
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(id);
        }
      }}
    >
      <span className="truncate max-w-[120px]">{name}</span>
      {isDirty ? (
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400"
          aria-label="Unsaved changes"
        />
      ) : null}
      <button
        type="button"
        className="ml-0.5 flex-shrink-0 text-[10px] text-workspace-text-muted hover:text-workspace-text"
        onClick={handleClose}
        onKeyDown={handleCloseKeyDown}
        aria-label={`Close ${name}`}
        tabIndex={-1}
      >
        ✕
      </button>
    </div>
  );
};

export { EditorTab };
