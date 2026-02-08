"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";
import { selectFilteredEntries } from "@/infra/niotepad/niotepadSelectors";
import { NiotepadDragHandle } from "./NiotepadDragHandle";
import {
  NiotepadResizeHandle,
  MIN_WIDTH,
  MIN_HEIGHT,
  MAX_WIDTH,
  MAX_HEIGHT,
} from "./NiotepadResizeHandle";
import { NiotepadScrollArea } from "./NiotepadScrollArea";
import { NiotepadEntry } from "./NiotepadEntry";
import { NiotepadComposer } from "./NiotepadComposer";

// 5-layer elevation shadow (plan Section 3.1)
const PANEL_SHADOW = [
  "0 0 0 1px color-mix(in srgb, var(--foreground) 5%, transparent)",
  "0 1px 2px 0 color-mix(in srgb, var(--foreground) 6%, transparent)",
  "0 4px 8px -2px color-mix(in srgb, var(--foreground) 8%, transparent)",
  "0 12px 24px -4px color-mix(in srgb, var(--foreground) 10%, transparent)",
  "0 32px 64px -8px color-mix(in srgb, var(--foreground) 12%, transparent)",
].join(", ");

const VIEWPORT_PADDING = 24;

const NiotepadPanel = (): ReactElement => {
  const isOpen = useNiotepadStore((s) => s.isOpen);
  const geometry = useNiotepadStore((s) => s.geometry);
  const pages = useNiotepadStore((s) => s.pages);
  const closePanel = useNiotepadStore((s) => s.closePanel);
  const updateGeometry = useNiotepadStore((s) => s.updateGeometry);
  const addEntry = useNiotepadStore((s) => s.addEntry);
  const updateEntry = useNiotepadStore((s) => s.updateEntry);
  const editingEntryId = useNiotepadStore((s) => s.editingEntryId);
  const setEditingEntry = useNiotepadStore((s) => s.setEditingEntry);
  const getOrCreatePage = useNiotepadStore((s) => s.getOrCreatePage);
  const filteredEntries = useNiotepadStore((s) => selectFilteredEntries(s));

  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // Compute total entry count across all pages
  const entryCount = useMemo(
    () => pages.reduce((sum, p) => sum + p.entries.length, 0),
    [pages],
  );

  // Resolve initial position — sentinel (-1, -1) means "compute default"
  const resolvedPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }
    const w = geometry.width;
    const h = geometry.height;
    if (geometry.x === -1 || geometry.y === -1) {
      return {
        x: window.innerWidth - w - VIEWPORT_PADDING,
        y: window.innerHeight - h - VIEWPORT_PADDING,
      };
    }
    return { x: geometry.x, y: geometry.y };
  }, [geometry.x, geometry.y, geometry.width, geometry.height]);

  // Focus trap: store previous active element, focus panel on mount
  useEffect(() => {
    if (!isOpen) return;
    lastActiveRef.current = document.activeElement as HTMLElement | null;

    // Focus the panel so ESC works
    const timer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      // Restore focus on close
      lastActiveRef.current?.focus();
      lastActiveRef.current = null;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        closePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePanel]);

  // Handle resize delta
  const handleResize = useCallback(
    (dx: number, dy: number) => {
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, geometry.width + dx),
      );
      const nextHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, geometry.height + dy),
      );
      updateGeometry({ width: nextWidth, height: nextHeight });
    },
    [geometry.width, geometry.height, updateGeometry],
  );

  // Persist geometry on resize end
  const handleResizeEnd = useCallback(() => {
    // updateGeometry already persists to localStorage
  }, []);

  // Persist position on drag end
  const handleDragEnd = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    updateGeometry({ x: rect.left, y: rect.top });
  }, [updateGeometry]);

  const handleDragHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragControls.start(e);
    },
    [dragControls],
  );

  // --- Entry handlers ---
  const handleStartEdit = useCallback(
    (id: string) => {
      setEditingEntry(id);
    },
    [setEditingEntry],
  );

  const handleSaveEdit = useCallback(
    (id: string, content: string) => {
      updateEntry(id, { content });
      setEditingEntry(null);
    },
    [updateEntry, setEditingEntry],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null);
  }, [setEditingEntry]);

  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (content: string) => {
      // Use a "general" page until page navigation wires in the actual lessonId
      const pageId = getOrCreatePage("general", "General Notes");
      addEntry({
        source: "manual",
        content,
        pageId,
        videoTimeSec: null,
        metadata: {},
      });
    },
    [getOrCreatePage, addEntry],
  );

  return (
    <motion.aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Niotepad -- personal notes"
      tabIndex={-1}
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl outline-none"
      style={{
        width: geometry.width,
        height: geometry.height,
        left: resolvedPosition.x,
        top: resolvedPosition.y,
        background: "var(--niotepad-panel-bg)",
        border: "1px solid var(--niotepad-panel-border)",
        boxShadow: PANEL_SHADOW,
      }}
      // Spring open animation
      initial={{ scale: 0.92, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 8 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.8,
      }}
      // Drag via handle only
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={{
        left: VIEWPORT_PADDING,
        top: VIEWPORT_PADDING,
        right:
          typeof window !== "undefined"
            ? window.innerWidth - geometry.width - VIEWPORT_PADDING
            : 800,
        bottom:
          typeof window !== "undefined"
            ? window.innerHeight - geometry.height - VIEWPORT_PADDING
            : 600,
      }}
      onDragEnd={handleDragEnd}
    >
      {/* Screen reader description */}
      <p id="niotepad-description" className="sr-only">
        A floating notebook for capturing notes from video lectures, code
        exercises, and AI chat conversations.
      </p>

      <NiotepadDragHandle
        entryCount={entryCount}
        onClose={closePanel}
        onPointerDown={handleDragHandlePointerDown}
      />

      {/* Ruled paper content area */}
      <NiotepadScrollArea onPaperClick={focusComposer}>
        <AnimatePresence initial={false}>
          {filteredEntries.map((entry) => (
            <NiotepadEntry
              key={entry.id}
              entry={entry}
              isEditing={editingEntryId === entry.id}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
          ))}
        </AnimatePresence>
        <NiotepadComposer
          ref={composerRef}
          onSubmit={handleSubmit}
          entryCount={filteredEntries.length}
        />
      </NiotepadScrollArea>

      <NiotepadResizeHandle
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
      />
    </motion.aside>
  );
};

export { NiotepadPanel };
