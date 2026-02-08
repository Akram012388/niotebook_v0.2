"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";
import { selectFilteredEntries } from "@/infra/niotepad/niotepadSelectors";
import { NiotepadDragHandle } from "./NiotepadDragHandle";
import { NiotepadScrollArea } from "./NiotepadScrollArea";
import { NiotepadEntry } from "./NiotepadEntry";
import { NiotepadComposer } from "./NiotepadComposer";
import { NiotepadPageNav } from "./NiotepadPageNav";
import { NiotepadSearch } from "./NiotepadSearch";

// 5-layer elevation shadow (plan Section 3.1)
const PANEL_SHADOW = [
  "0 0 0 1px color-mix(in srgb, var(--foreground) 5%, transparent)",
  "0 1px 2px 0 color-mix(in srgb, var(--foreground) 6%, transparent)",
  "0 4px 8px -2px color-mix(in srgb, var(--foreground) 8%, transparent)",
  "0 12px 24px -4px color-mix(in srgb, var(--foreground) 10%, transparent)",
  "0 32px 64px -8px color-mix(in srgb, var(--foreground) 12%, transparent)",
].join(", ");

const VIEWPORT_PADDING = 16;
const TOPNAV_HEIGHT = 72;
const PANEL_WIDTH = 440;
const PANEL_HEIGHT = 560;

const NiotepadPanel = (): ReactElement => {
  const isOpen = useNiotepadStore((s) => s.isOpen);
  const geometry = useNiotepadStore((s) => s.geometry);
  const pages = useNiotepadStore((s) => s.pages);
  const closePanel = useNiotepadStore((s) => s.closePanel);
  const updateGeometry = useNiotepadStore((s) => s.updateGeometry);
  const addEntry = useNiotepadStore((s) => s.addEntry);
  const updateEntry = useNiotepadStore((s) => s.updateEntry);
  const deleteEntry = useNiotepadStore((s) => s.deleteEntry);
  const editingEntryId = useNiotepadStore((s) => s.editingEntryId);
  const setEditingEntry = useNiotepadStore((s) => s.setEditingEntry);
  const getOrCreatePage = useNiotepadStore((s) => s.getOrCreatePage);
  const activePageId = useNiotepadStore((s) => s.activePageId);
  const setActivePage = useNiotepadStore((s) => s.setActivePage);
  const searchQuery = useNiotepadStore((s) => s.searchQuery);
  const setSearchQuery = useNiotepadStore((s) => s.setSearchQuery);
  const sourceFilters = useNiotepadStore((s) => s.sourceFilters);
  const toggleSourceFilter = useNiotepadStore((s) => s.toggleSourceFilter);
  const isSearchExpanded = useNiotepadStore((s) => s.isSearchExpanded);
  const toggleSearchExpanded = useNiotepadStore((s) => s.toggleSearchExpanded);

  // Derive filtered entries via useMemo — NOT inside a Zustand selector,
  // because selectFilteredEntries returns a new array reference each call
  // which triggers infinite re-renders with Zustand's Object.is comparison.
  const filteredEntries = useMemo(
    () =>
      selectFilteredEntries({ pages, activePageId, sourceFilters, searchQuery }),
    [pages, activePageId, sourceFilters, searchQuery],
  );

  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // Compute total entry count across all pages
  const entryCount = useMemo(
    () => pages.reduce((sum, p) => sum + p.entries.length, 0),
    [pages],
  );

  // Y is fixed: vertically centered in the workspace area (below TopNav).
  // X is persisted; sentinel (-1) means "default to right side".
  // Use clientWidth (excludes scrollbar) for accurate viewport measurement.
  const resolvedPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: TOPNAV_HEIGHT + VIEWPORT_PADDING };
    }
    const vw = document.documentElement.clientWidth;
    const workspaceHeight = window.innerHeight - TOPNAV_HEIGHT;
    const y = TOPNAV_HEIGHT + Math.max(VIEWPORT_PADDING, (workspaceHeight - PANEL_HEIGHT) / 2);
    const maxX = vw - PANEL_WIDTH - VIEWPORT_PADDING;
    const rawX =
      geometry.x === -1
        ? maxX
        : geometry.x;
    // Clamp so the panel stays within the viewport even with stale geometry
    const x = Math.max(VIEWPORT_PADDING, Math.min(rawX, maxX));
    return { x, y };
  }, [geometry.x]);

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

  // Scoped ESC: cancel editing first, then collapse search, then close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      const state = useNiotepadStore.getState();
      if (state.editingEntryId) {
        setEditingEntry(null);
      } else if (state.isSearchExpanded) {
        toggleSearchExpanded();
      } else {
        closePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePanel, setEditingEntry, toggleSearchExpanded]);

  // Persist X position on drag end (Y is fixed, not persisted)
  const handleDragEnd = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    updateGeometry({ x: el.getBoundingClientRect().left });
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

  const handleDeleteEntry = useCallback(
    (id: string) => {
      deleteEntry(id);
    },
    [deleteEntry],
  );

  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (content: string) => {
      // If a specific page is selected, add to that page; otherwise use "General Notes"
      const pageId =
        activePageId ?? getOrCreatePage("general", "General Notes");
      addEntry({
        source: "manual",
        content,
        pageId,
        videoTimeSec: null,
        metadata: {},
      });
    },
    [activePageId, getOrCreatePage, addEntry],
  );

  // Focus trap: wrap Tab to keep focus inside the panel
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Instant transitions when user prefers reduced motion
  const panelTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.8 };

  return (
    <motion.aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Niotepad -- personal notes"
      aria-describedby="niotepad-description"
      tabIndex={-1}
      onKeyDown={handlePanelKeyDown}
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl outline-none"
      style={{
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        left: resolvedPosition.x,
        top: resolvedPosition.y,
        background: "var(--niotepad-panel-bg)",
        border: "1px solid var(--niotepad-panel-border)",
        boxShadow: PANEL_SHADOW,
      }}
      // Spring open animation (instant when reduced motion preferred)
      initial={
        prefersReducedMotion
          ? { opacity: 1 }
          : { scale: 0.92, opacity: 0, y: 12 }
      }
      animate={
        prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }
      }
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { scale: 0.95, opacity: 0, y: 8 }
      }
      transition={panelTransition}
      // X-axis only drag via handle — Y is locked
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.08}
      // Constraints are relative offsets from the element's CSS left position.
      // Negative left = how far the panel can move leftward.
      // Positive right = how far the panel can move rightward.
      dragConstraints={{
        left: VIEWPORT_PADDING - resolvedPosition.x,
        right:
          typeof window !== "undefined"
            ? document.documentElement.clientWidth -
              PANEL_WIDTH -
              VIEWPORT_PADDING -
              resolvedPosition.x
            : 0,
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

      {pages.length > 1 && (
        <NiotepadPageNav
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setActivePage}
        />
      )}

      <NiotepadSearch
        query={searchQuery}
        onQueryChange={setSearchQuery}
        activeFilters={sourceFilters}
        onFilterToggle={toggleSourceFilter}
        isExpanded={isSearchExpanded}
        onToggleExpanded={toggleSearchExpanded}
        resultCount={filteredEntries.length}
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
              onDelete={handleDeleteEntry}
            />
          ))}
        </AnimatePresence>

        {/* Empty state when search/filter yields no results */}
        {filteredEntries.length === 0 &&
          (searchQuery || sourceFilters.length > 0) && (
            <p className="py-8 text-center text-xs text-text-muted">
              No notes match your search
            </p>
          )}

        <NiotepadComposer
          ref={composerRef}
          onSubmit={handleSubmit}
          entryCount={filteredEntries.length}
        />
      </NiotepadScrollArea>

    </motion.aside>
  );
};

export { NiotepadPanel };
