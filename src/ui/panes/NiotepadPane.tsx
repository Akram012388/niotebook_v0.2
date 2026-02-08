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
  onSendToChat?: (content: string) => void;
  onInsertToEditor?: (content: string) => void;
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
  onSendToChat,
  onInsertToEditor,
}: NiotepadPaneProps): ReactElement => {
  const entries = useNiotepadStore((s) => s.entries);
  const isLoaded = useNiotepadStore((s) => s.isLoaded);
  const loadLesson = useNiotepadStore((s) => s.loadLesson);
  const addEntry = useNiotepadStore((s) => s.addEntry);
  const clearAll = useNiotepadStore((s) => s.clearAll);

  const [composerValue, setComposerValue] = useState("");
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

  const handleAddEntry = useCallback(() => {
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
        handleAddEntry();
      }
    },
    [handleAddEntry],
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

  /* Lined-paper background: faint horizontal rules at 28px intervals.
     All entry content uses line-height: 28px to sit on these ruled lines. */
  const linedPaperBg = `repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, var(--border) 27px, var(--border) 28px)`;

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      {/* Header — matches AiPane/VideoPane: h-14, border-b, px-4 */}
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            Niotepad
          </p>
          {entries.length > 0 ? (
            <span className="text-xs text-text-muted">({entries.length})</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtras}
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

        {/* Entry list — scrollable, with lined-paper background */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto"
          style={{
            paddingLeft: BINDER_RIGHT_EDGE + 8,
            zIndex: 2,
            backgroundImage: linedPaperBg,
          }}
        >
          {!isLoaded ? (
            <div className="flex items-center justify-center py-12 text-xs text-text-muted">
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted">
              <p className="text-sm">No entries yet</p>
              <p className="mt-1 text-xs">
                Capture thoughts from chat, code, or video
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <NiotepadEntry
                key={entry.id}
                entry={entry}
                onSeek={onSeek}
                onSendToChat={onSendToChat}
                onInsertToEditor={onInsertToEditor}
              />
            ))
          )}
        </div>

        {/* Composer — bottom of pane */}
        <div
          className="relative shrink-0 border-t border-border bg-surface-muted px-3 py-2"
          style={{ paddingLeft: BINDER_RIGHT_EDGE + 8, zIndex: 2 }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={composerValue}
              onChange={(e) => setComposerValue(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Capture a thought..."
              className="min-h-[36px] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-1 text-sm leading-[28px] text-foreground placeholder:text-text-subtle focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
              rows={1}
            />
            <button
              type="button"
              onClick={handleAddEntry}
              disabled={!composerValue.trim()}
              className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { NiotepadPane };
export type { NiotepadPaneProps };
