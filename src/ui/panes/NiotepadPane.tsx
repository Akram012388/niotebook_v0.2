"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";
import { NiotepadEntry } from "./NiotepadEntry";

interface NiotepadPaneProps {
  lessonId: string;
  headerExtras?: ReactElement;
  onSeek?: (timestampSec: number) => void;
}

/* Binder geometry — adapted from NotebookFrame for pane context.
   Tighter left inset (8px vs 20px) since the binder is flush to the pane edge. */
const RAIL_W = 2;
const RAIL_GAP = 2;
const HOLE_D = 6;
const HOLE_SPACING = 12;
const BINDER_LEFT = 8;
const BINDER_CONTAINER_W = RAIL_W * 2 + RAIL_GAP;
const BINDER_RIGHT_EDGE = BINDER_LEFT + BINDER_CONTAINER_W;

const holeR = HOLE_D / 2;

const stripMask = {
  WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
  maskImage: `radial-gradient(circle at 50% 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
  WebkitMaskSize: `100% ${HOLE_SPACING}px`,
  maskSize: `100% ${HOLE_SPACING}px`,
  WebkitMaskRepeat: "repeat-y",
  maskRepeat: "repeat-y",
} as React.CSSProperties;

const binderPosition = {
  left: BINDER_LEFT,
  top: 0,
  bottom: 0,
  width: BINDER_CONTAINER_W,
};

/** Content padding to the right of the binder edge. */
const CONTENT_LEFT = BINDER_RIGHT_EDGE + 8;

function generateMarkdownExport(
  entries: Array<{ source: string; content: string; createdAt: number }>,
): string {
  const lines = ["# Niotepad Export", ""];
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  for (const entry of entries) {
    lines.push(`## ${formatter.format(entry.createdAt)} [${entry.source}]`);
    lines.push("");
    lines.push(entry.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

const NiotepadPane = ({
  lessonId,
  headerExtras,
  onSeek,
}: NiotepadPaneProps): ReactElement => {
  const entries = useNiotepadStore((s) => s.entries);
  const isLoaded = useNiotepadStore((s) => s.isLoaded);
  const loadLesson = useNiotepadStore((s) => s.loadLesson);
  const addEntry = useNiotepadStore((s) => s.addEntry);
  const clearAll = useNiotepadStore((s) => s.clearAll);

  const [composerValue, setComposerValue] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevEntryCountRef = useRef(entries.length);

  // Load entries for lesson
  useEffect(() => {
    void loadLesson(lessonId);
  }, [lessonId, loadLesson]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (entries.length > prevEntryCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevEntryCountRef.current = entries.length;
  }, [entries.length]);

  const handleSubmitEntry = useCallback(() => {
    const trimmed = composerValue.trim();
    if (!trimmed) return;
    addEntry({
      source: "manual",
      content: trimmed,
      lessonId,
      videoTimeSec: null,
      metadata: {},
    });
    setComposerValue("");
  }, [addEntry, composerValue, lessonId]);

  const handleComposerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmitEntry();
      }
    },
    [handleSubmitEntry],
  );

  /** Click on the paper surface focuses the textarea at the bottom. */
  const handlePaperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-niotepad-entry]")) return;
      composerRef.current?.focus();
    },
    [],
  );

  const handleExport = useCallback(() => {
    const markdown = generateMarkdownExport(entries);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `niotepad-${lessonId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, lessonId]);

  const handleClearAll = useCallback(() => {
    if (window.confirm("Clear all Niotepad entries for this lesson?")) {
      clearAll();
    }
  }, [clearAll]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      {/* Header — matches AiPane/VideoPane: h-14, border-b, px-4 */}
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            Niotepad
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {entries.length > 0 ? (
            <>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label="Export as Markdown"
                title="Export .md"
              >
                Export
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:text-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label="Clear all entries"
                title="Clear all"
              >
                Clear
              </button>
            </>
          ) : null}
          {headerExtras}
        </div>
      </header>

      {/* Content area with binder frame */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Binder rails — flush to left edge of content area */}
        <div
          className="pointer-events-none absolute"
          aria-hidden="true"
          style={{ ...binderPosition, zIndex: 0 }}
        >
          <div
            className="absolute inset-y-0"
            style={{ left: 0, width: RAIL_W, background: "var(--foreground)" }}
          />
          <div
            className="absolute inset-y-0"
            style={{
              right: 0,
              width: RAIL_W,
              background: "var(--foreground)",
            }}
          />
        </div>

        {/* Binder mask strip with punch-holes */}
        <div
          className="pointer-events-none absolute bg-surface"
          aria-hidden="true"
          style={{ ...binderPosition, ...stripMask, zIndex: 1 }}
        />

        {/* Grid paper surface — scrollable, click anywhere to write */}
        <div
          ref={scrollRef}
          className="relative flex-1 cursor-text overflow-y-auto"
          style={{
            paddingLeft: CONTENT_LEFT,
            zIndex: 2,
            backgroundImage: `linear-gradient(var(--niotepad-grid) 1px, transparent 1px), linear-gradient(90deg, var(--niotepad-grid) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
            backgroundAttachment: "local",
          }}
          onClick={handlePaperClick}
        >
          {!isLoaded ? (
            <p className="pr-4 text-sm leading-6 text-text-muted">
              Loading...
            </p>
          ) : (
            <>
              {entries.map((entry) => (
                <NiotepadEntry
                  key={entry.id}
                  entry={entry}
                  onSeek={onSeek}
                />
              ))}
              {/* Divider between last entry and composer */}
              {entries.length > 0 && (
                <div className="border-t border-border-muted" />
              )}
              {/* Always-visible textarea that IS the paper surface.
                  No border, no box shadow, no outline — just a blinking cursor
                  on the grid. Fills remaining space via large min-height. */}
              <textarea
                ref={composerRef}
                value={composerValue}
                onChange={(e) => setComposerValue(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={entries.length === 0 ? "Click anywhere to start writing..." : ""}
                className="block w-full appearance-none resize-none bg-transparent p-0 pr-4 pt-2 text-sm leading-6 text-foreground caret-foreground placeholder:text-text-subtle"
                style={{ border: "none", outline: "none", boxShadow: "none", minHeight: 560 }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export { NiotepadPane };
export type { NiotepadPaneProps };
