"use client";

import { useCallback, type ReactElement } from "react";
import type { HelpEntry } from "./helpEntries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpCardProps {
  entry: HelpEntry;
  onClick: (entry: HelpEntry) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HelpCard = ({ entry, onClick }: HelpCardProps): ReactElement => {
  const Icon = entry.icon;

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
      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
      style={{
        background:
          "color-mix(in srgb, var(--help-panel-bg) 80%, white 20%)",
        border: "1px solid color-mix(in srgb, var(--help-border) 50%, transparent)",
        padding: "16px 12px",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-1px)";
        el.style.borderColor = "var(--help-border)";
        el.style.boxShadow =
          "0 2px 8px -2px rgba(120, 90, 60, 0.12), 0 4px 16px -4px rgba(100, 75, 50, 0.10)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.borderColor =
          "color-mix(in srgb, var(--help-border) 50%, transparent)";
        el.style.boxShadow = "";
      }}
    >
      <Icon size={24} weight="duotone" style={{ color: "var(--help-text-muted)" }} />

      <div className="flex flex-col gap-0.5">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {entry.name}
        </span>
        <span
          className="line-clamp-2 text-xs"
          style={{ color: "var(--help-text-muted)" }}
        >
          {entry.description}
        </span>
      </div>

      {entry.shortcuts && entry.shortcuts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {entry.shortcuts.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] tracking-wide"
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

export { HelpCard };
export type { HelpCardProps };
