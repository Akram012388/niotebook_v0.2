"use client";

import { memo, useCallback, useMemo, useRef, type ReactElement } from "react";
import type { NiotepadPage } from "@/domain/niotepad";

interface NiotepadPageNavProps {
  pages: NiotepadPage[];
  activePageId: string | null;
  onSelectPage: (pageId: string | null) => void;
}

/** Truncate a title to roughly maxLen characters, adding ellipsis if clipped. */
function abbreviateTitle(title: string, maxLen = 8): string {
  if (title.length <= maxLen) return title;
  return title.slice(0, maxLen).trimEnd() + "\u2026";
}

const NiotepadPageNav = memo(function NiotepadPageNav({
  pages,
  activePageId,
  onSelectPage,
}: NiotepadPageNavProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sort pages: numbered lectures ascending, null-lectureNumber pages at the end
  const sortedPages = useMemo(
    () =>
      [...pages].sort((a, b) => {
        if (a.lectureNumber == null && b.lectureNumber == null) return 0;
        if (a.lectureNumber == null) return 1;
        if (b.lectureNumber == null) return -1;
        return a.lectureNumber - b.lectureNumber;
      }),
    [pages],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const allIds: Array<string | null> = [
          null,
          ...sortedPages.map((p) => p.id),
        ];
        const currentIdx = allIds.indexOf(activePageId);
        let nextIdx: number;
        if (e.key === "ArrowLeft") {
          nextIdx = currentIdx > 0 ? currentIdx - 1 : allIds.length - 1;
        } else {
          nextIdx = currentIdx < allIds.length - 1 ? currentIdx + 1 : 0;
        }
        onSelectPage(allIds[nextIdx] ?? null);

        // Focus the next tab button
        const container = scrollRef.current;
        if (container) {
          const buttons =
            container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
          buttons[nextIdx]?.focus();
        }
      }
    },
    [sortedPages, activePageId, onSelectPage],
  );

  // Don't render nav if there are no pages
  if (pages.length === 0) return <></>;

  const tabBase =
    "shrink-0 px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1";
  const tabActive = "text-foreground font-semibold";
  const tabInactive = "text-text-muted hover:text-foreground";

  return (
    <nav
      aria-label="Notebook pages"
      className="shrink-0 border-b border-border-muted"
    >
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Lecture pages"
        className="niotepad-page-tabs flex overflow-x-auto px-2"
        onKeyDown={handleKeyDown}
      >
        {/* "All" tab -- always first */}
        <button
          type="button"
          role="tab"
          aria-selected={activePageId === null}
          aria-controls="niotepad-entries"
          tabIndex={activePageId === null ? 0 : -1}
          onClick={() => onSelectPage(null)}
          className={`${tabBase} ${activePageId === null ? tabActive : tabInactive} relative`}
        >
          All
          {activePageId === null && (
            <span
              className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Lecture tabs -- ordered by lectureNumber, null at end */}
        {sortedPages.map((page) => {
          const isActive = page.id === activePageId;
          const label =
            page.lectureNumber != null
              ? `L${page.lectureNumber}`
              : abbreviateTitle(page.title);
          return (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="niotepad-entries"
              tabIndex={isActive ? 0 : -1}
              title={page.title}
              onClick={() => onSelectPage(page.id)}
              className={`${tabBase} ${isActive ? tabActive : tabInactive} relative`}
            >
              {label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-accent"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export { NiotepadPageNav };
