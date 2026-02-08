"use client";

import { useCallback, type ReactElement } from "react";
import type { HelpEntry } from "./helpEntries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpRowProps {
  entry: HelpEntry;
  isActive: boolean;
  onClick: (entry: HelpEntry) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HelpRow = ({ entry, isActive, onClick }: HelpRowProps): ReactElement => {
  const handleClick = useCallback(() => {
    onClick(entry);
  }, [entry, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(entry);
      }
    },
    [entry, onClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group relative flex h-[44px] cursor-pointer items-center gap-3 px-4 transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-inset"
    >
      {/* Left accent bar — terracotta, visible on hover/focus/active */}
      <div
        className={`absolute left-0 top-0 h-full w-[3px] transition-opacity duration-150 ease-in-out ${
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
        style={{ background: "var(--help-accent-bar, var(--accent))" }}
      />

      {/* Title */}
      <span
        className="shrink-0 text-sm font-medium"
        style={{ color: "var(--foreground)" }}
      >
        {entry.name}
      </span>

      {/* Description — truncated single line, fills available space */}
      <span
        className="min-w-0 flex-1 truncate text-xs"
        style={{ color: "var(--help-text-muted)" }}
      >
        {entry.description}
      </span>

      {/* Shortcut badges */}
      {entry.shortcuts && entry.shortcuts.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          {entry.shortcuts.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center rounded-[6px] px-2 py-0.5 font-mono text-[11px] tracking-wide"
              style={{
                background:
                  "color-mix(in srgb, var(--help-border) 30%, transparent)",
                color: "var(--help-text-muted)",
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export { HelpRow };
export type { HelpRowProps };
