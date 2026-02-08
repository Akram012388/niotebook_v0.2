"use client";

import { forwardRef, useCallback, type ReactElement } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpSearchProps {
  value: string;
  onChange: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Icons (inline SVG -- matches NiotepadSearch exactly)
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

const HelpSearch = forwardRef<HTMLInputElement, HelpSearchProps>(
  function HelpSearch({ value, onChange }, ref): ReactElement {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    const handleClear = useCallback(() => {
      onChange("");
      // Re-focus is handled by the forwarded ref's owner if needed
    }, [onChange]);

    return (
      <div
        className="flex shrink-0 border-b px-3 py-1.5"
        style={{
          background: "var(--help-header-bg)",
          borderColor: "var(--help-border)",
        }}
      >
        {/* Search bar: rounded container with focus ring -- mirrors NiotepadSearch */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-0.5 transition-colors focus-within:border-accent">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center"
            style={{ color: "var(--help-text-muted)" }}
          >
            <SearchIcon />
          </span>

          {/* Inline style suppresses global :focus-visible outline (unlayered, beats Tailwind @layer) */}
          <input
            ref={ref}
            type="text"
            role="searchbox"
            aria-label="Search help entries"
            value={value}
            onChange={handleChange}
            placeholder="Search tools and shortcuts..."
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-text-subtle"
            style={{ outline: "none" }}
          />

          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              style={{ color: "var(--help-text-muted)" }}
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>
    );
  },
);

export { HelpSearch };
export type { HelpSearchProps };
