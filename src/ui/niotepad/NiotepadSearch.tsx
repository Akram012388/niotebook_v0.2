"use client";

import { memo, useCallback, useEffect, useRef, type ReactElement } from "react";
import type { NiotepadEntrySource } from "@/domain/niotepad";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NiotepadSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  activeFilters: NiotepadEntrySource[];
  onFilterToggle: (source: NiotepadEntrySource) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  /** Number of entries matching the current search/filter, for aria-live announcement */
  resultCount?: number;
}

// ---------------------------------------------------------------------------
// Filter chip config
// ---------------------------------------------------------------------------

const FILTER_CHIPS: { label: string; source: NiotepadEntrySource }[] = [
  { label: "Code", source: "code" },
  { label: "Chat", source: "chat" },
  { label: "Video", source: "video" },
  { label: "Notes", source: "manual" },
];

// ---------------------------------------------------------------------------
// Icons (inline SVG -- no external dependency)
// ---------------------------------------------------------------------------

const SearchIcon = (): ReactElement => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
  >
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M9.5 9.5L12.5 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ClearIcon = (): ReactElement => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M3 3l6 6M9 3l-6 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NiotepadSearch = memo(function NiotepadSearch({
  query,
  onQueryChange,
  activeFilters,
  onFilterToggle,
  isExpanded,
  onToggleExpanded,
  resultCount,
}: NiotepadSearchProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the search expands
  useEffect(() => {
    if (isExpanded) {
      // Delay slightly so the DOM has rendered the input
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleClear = useCallback(() => {
    onQueryChange("");
    inputRef.current?.focus();
  }, [onQueryChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(e.target.value);
    },
    [onQueryChange],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        // If query is non-empty, clear it first; otherwise collapse
        if (query) {
          onQueryChange("");
        } else if (activeFilters.length === 0) {
          onToggleExpanded();
        }
      }
    },
    [query, activeFilters.length, onQueryChange, onToggleExpanded],
  );

  // --- Collapsed state: just a magnifier icon button ---
  if (!isExpanded) {
    return (
      <div
        className="flex shrink-0 items-center border-b px-3 py-1.5"
        style={{
          background: "var(--niotepad-header-bg)",
          borderColor: "var(--niotepad-header-border)",
        }}
      >
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          style={{ color: "var(--niotepad-text-muted)" }}
          aria-label="Open search"
        >
          <SearchIcon />
        </button>
      </div>
    );
  }

  // --- Expanded state: search input + filter chips (single row) ---
  return (
    <div
      className="flex shrink-0 border-b px-3 py-1.5"
      style={{
        background: "var(--niotepad-header-bg)",
        borderColor: "var(--niotepad-header-border)",
      }}
    >
      {/* Search bar: rounded container with focus ring */}
      <div className="niotepad-search-bar flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-0.5 transition-colors focus-within:border-accent">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          style={{ color: "var(--niotepad-text-muted)" }}
          aria-label="Close search"
        >
          <SearchIcon />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Search notes..."
          aria-label="Search notes"
          className="niotepad-composer min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-text-subtle"
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            style={{ color: "var(--niotepad-text-muted)" }}
            aria-label="Clear search"
          >
            <ClearIcon />
          </button>
        )}

        {/* Subtle separator before chips */}
        <div
          className="mx-0.5 h-3.5 w-px shrink-0"
          style={{ background: "var(--niotepad-header-border)" }}
        />

        {/* Filter chips inline */}
        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label="Filter by source"
        >
          {FILTER_CHIPS.map(({ label, source }) => {
            const isActive = activeFilters.includes(source);
            return (
              <button
                key={source}
                type="button"
                onClick={() => onFilterToggle(source)}
                aria-pressed={isActive}
                className={`rounded-full px-1.5 py-px text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isActive ? "bg-accent text-white" : "hover:text-foreground"
                }`}
                style={
                  !isActive
                    ? {
                        background: "var(--niotepad-surface-muted)",
                        color: "var(--niotepad-text-muted)",
                      }
                    : undefined
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen reader announcement for result count */}
      <div aria-live="polite" className="sr-only">
        {(query || activeFilters.length > 0) &&
          resultCount != null &&
          `${resultCount} ${resultCount === 1 ? "note" : "notes"} found${query ? ` for "${query}"` : ""}`}
      </div>
    </div>
  );
});

export { NiotepadSearch };
export type { NiotepadSearchProps };
