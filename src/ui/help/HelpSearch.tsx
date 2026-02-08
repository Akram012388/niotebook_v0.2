"use client";

import { forwardRef, useCallback, type ReactElement } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HelpSearchProps {
  value: string;
  onChange: (value: string) => void;
}

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

    return (
      <div
        className="flex shrink-0 items-center gap-2 border-b px-4 py-3"
        style={{
          borderColor: "var(--help-border)",
        }}
      >
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="shrink-0"
          style={{ color: "var(--help-text-subtle)" }}
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="text"
          role="searchbox"
          aria-label="Search help entries"
          value={value}
          onChange={handleChange}
          placeholder="Search tools and shortcuts..."
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:opacity-50"
          style={{
            color: "var(--foreground)",
          }}
        />
      </div>
    );
  },
);

export { HelpSearch };
export type { HelpSearchProps };
