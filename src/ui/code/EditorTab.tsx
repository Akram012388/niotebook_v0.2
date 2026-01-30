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

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs transition ${
        isActive
          ? "border-blue-500 text-foreground"
          : "border-transparent text-text-muted hover:text-foreground"
      }`}
      onClick={handleClick}
      onMouseDown={handleMiddleClick}
    >
      <span className="truncate max-w-[120px]">{name}</span>
      {isDirty ? (
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400"
          aria-label="Unsaved changes"
        />
      ) : null}
      <span
        className="ml-0.5 flex-shrink-0 text-[10px] text-text-muted hover:text-foreground"
        onClick={handleClose}
        role="button"
        aria-label={`Close ${name}`}
        tabIndex={-1}
      >
        ✕
      </span>
    </button>
  );
};

export { EditorTab };
