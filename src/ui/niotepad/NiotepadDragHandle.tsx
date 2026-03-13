"use client";

import { memo, useEffect, useRef, useState, type ReactElement } from "react";
import { DownloadSimple, X } from "@phosphor-icons/react";

interface NiotepadDragHandleProps {
  pageTitle?: string;
  entryCount: number;
  onClose: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onExportPage: () => void;
  onExportAll: () => void;
}

const GripDots = (): ReactElement => (
  <svg
    width="8"
    height="14"
    viewBox="0 0 8 14"
    aria-hidden="true"
    className="shrink-0"
    style={{ color: "var(--niotepad-text-subtle)" }}
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
  onExportPage,
  onExportAll,
}: NiotepadDragHandleProps): ReactElement {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleMouseDown = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isDropdownOpen]);

  return (
    <div
      role="toolbar"
      aria-label="Niotepad title bar — drag to reposition"
      aria-roledescription="draggable"
      className="flex h-10 shrink-0 cursor-grab items-center gap-2 border-b px-3 select-none active:cursor-grabbing"
      style={{
        background: "var(--niotepad-header-bg)",
        borderColor: "var(--niotepad-header-border)",
      }}
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
          <span
            className="truncate text-[11px]"
            style={{ color: "var(--niotepad-text-muted)" }}
          >
            {pageTitle}
          </span>
        )}
        {entryCount > 0 && (
          <span
            className="shrink-0 text-[11px]"
            style={{ color: "var(--niotepad-text-muted)" }}
          >
            ({entryCount})
          </span>
        )}
      </div>

      {/* Right: export + close buttons */}
      <div ref={dropdownRef} className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen((prev) => !prev);
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          style={{ color: "var(--niotepad-text-muted)" }}
          aria-label="Export notes"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
        >
          <DownloadSimple size={14} weight="bold" />
        </button>

        {isDropdownOpen && (
          <div
            role="menu"
            className="absolute top-full right-0 z-10 mt-1 min-w-[140px] overflow-hidden rounded-lg border py-1 shadow-lg"
            style={{
              background: "var(--niotepad-header-bg)",
              borderColor: "var(--niotepad-header-border)",
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-1.5 text-left text-[12px] transition hover:bg-accent/10 hover:text-foreground"
              style={{ color: "var(--niotepad-text-muted)" }}
              onClick={(e) => {
                e.stopPropagation();
                onExportPage();
                setIsDropdownOpen(false);
              }}
            >
              Export Page
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-1.5 text-left text-[12px] transition hover:bg-accent/10 hover:text-foreground"
              style={{ color: "var(--niotepad-text-muted)" }}
              onClick={(e) => {
                e.stopPropagation();
                onExportAll();
                setIsDropdownOpen(false);
              }}
            >
              Export All
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          style={{ color: "var(--niotepad-text-muted)" }}
          aria-label="Close niotepad"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
});

export { NiotepadDragHandle };
