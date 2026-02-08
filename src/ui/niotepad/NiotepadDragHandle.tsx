"use client";

import { memo, type ReactElement } from "react";
import { X } from "@phosphor-icons/react";

interface NiotepadDragHandleProps {
  pageTitle?: string;
  entryCount: number;
  onClose: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}

const GripDots = (): ReactElement => (
  <svg
    width="8"
    height="14"
    viewBox="0 0 8 14"
    aria-hidden="true"
    className="shrink-0 text-text-subtle"
  >
    {/* 3 rows x 2 cols of 3px circles, gap ~4px */}
    <circle cx="2" cy="2" r="1.5" fill="currentColor" />
    <circle cx="6" cy="2" r="1.5" fill="currentColor" />
    <circle cx="2" cy="7" r="1.5" fill="currentColor" />
    <circle cx="6" cy="7" r="1.5" fill="currentColor" />
    <circle cx="2" cy="12" r="1.5" fill="currentColor" />
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const NiotepadDragHandle = memo(function NiotepadDragHandle({
  pageTitle,
  entryCount,
  onClose,
  onPointerDown,
}: NiotepadDragHandleProps): ReactElement {
  return (
    <div
      className="flex h-10 shrink-0 cursor-grab items-center gap-2 border-b px-3 select-none active:cursor-grabbing"
      style={{ borderColor: "var(--border)" }}
      onPointerDown={onPointerDown}
    >
      {/* Left: grip + title */}
      <GripDots />
      <span className="text-[13px] font-semibold text-foreground">
        Niotepad
      </span>

      {/* Center: page subtitle + count */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        {pageTitle && (
          <span className="truncate text-[11px] text-text-muted">
            {pageTitle}
          </span>
        )}
        {entryCount > 0 && (
          <span className="shrink-0 text-[11px] text-text-muted">
            ({entryCount})
          </span>
        )}
      </div>

      {/* Right: close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="Close niotepad"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
});

export { NiotepadDragHandle };
