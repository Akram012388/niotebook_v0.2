"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import {
  buildPageMarkdown,
  buildAllPagesMarkdown,
  slugify,
  todayIso,
} from "@/domain/niotepadExport";
import { downloadMarkdownFile } from "@/infra/niotepad/downloadFile";
import { NiotepadDragHandle } from "./NiotepadDragHandle";
import { NiotepadScrollArea } from "./NiotepadScrollArea";
import { NiotepadEntry } from "./NiotepadEntry";
import { NiotepadComposer } from "./NiotepadComposer";
import { NiotepadPageNav } from "./NiotepadPageNav";
import { NiotepadSearch } from "./NiotepadSearch";

// 5-layer elevation shadow — warm-tinted to harmonize with the parchment panel
const PANEL_SHADOW = [
  "0 0 0 1px color-mix(in srgb, var(--niotepad-panel-border) 60%, transparent)",
  "0 1px 2px 0 rgba(120, 90, 60, 0.08)",
  "0 4px 8px -2px rgba(120, 90, 60, 0.10)",
  "0 12px 24px -4px rgba(100, 75, 50, 0.12)",
  "0 32px 64px -8px rgba(80, 60, 40, 0.14)",
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
      selectFilteredEntries({
        pages,
        activePageId,
        sourceFilters,
        searchQuery,
      }),
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

  // Position computed once at mount — CSS left stays constant for the lifetime
  // of this component instance. Framer Motion manages all drag offsets via its
  // internal x transform. This prevents the double-offset bug where both CSS
  // left and FM's transform contain the drag delta after handleDragEnd updates
  // geometry.x and triggers a re-render.
  // The component remounts on each open/close cycle (conditional rendering in
  // NiotepadPortal), so the persisted geometry.x is applied fresh each time.
  const [mountPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: TOPNAV_HEIGHT + VIEWPORT_PADDING };
    }
    const vw = document.documentElement.clientWidth;
    const workspaceHeight = window.innerHeight - TOPNAV_HEIGHT;
    const y =
      TOPNAV_HEIGHT +
      Math.max(VIEWPORT_PADDING, (workspaceHeight - PANEL_HEIGHT) / 2);
    const maxX = Math.max(
      VIEWPORT_PADDING,
      vw - PANEL_WIDTH - VIEWPORT_PADDING,
    );
    const rawX = geometry.x === -1 ? maxX : geometry.x;
    const x = Math.max(VIEWPORT_PADDING, Math.min(rawX, maxX));
    return { x, y };
  });

  // Object-based drag constraints — smoother than ref-based constraints.
  // FM object constraints are RELATIVE to the element's CSS left position,
  // so we compute how far left/right the panel can travel from mountPosition.x.
  const computeConstraints = useCallback(() => {
    if (typeof window === "undefined") return { left: 0, right: 0 };
    const vw = document.documentElement.clientWidth;
    return {
      left: VIEWPORT_PADDING - mountPosition.x,
      right: vw - PANEL_WIDTH - VIEWPORT_PADDING - mountPosition.x,
    };
  }, [mountPosition.x]);

  const [dragConstraints, setDragConstraints] = useState(computeConstraints);

  // Re-compute constraints on viewport resize
  useEffect(() => {
    const onResize = () => setDragConstraints(computeConstraints());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [computeConstraints]);

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

  // Persist visual X on drag end for the next mount. FM's object constraints
  // enforce bounds during drag, and the mount initializer re-clamps on open.
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

  // --- Export handlers ---
  const handleExportPage = useCallback(() => {
    const state = useNiotepadStore.getState();
    const page = state.activePageId
      ? state.pages.find((p) => p.id === state.activePageId)
      : state.pages[0];
    if (!page) return;
    const md = buildPageMarkdown(page);
    const filename = `niotepad-${slugify(page.title)}-${todayIso()}.md`;
    downloadMarkdownFile(md, filename);
  }, []);

  const handleExportAll = useCallback(() => {
    const state = useNiotepadStore.getState();
    if (state.pages.length === 0) return;
    // Try to derive course title from first page's title
    const courseTitle = state.pages[0]?.title?.split(":")[0]?.trim();
    const md = buildAllPagesMarkdown(state.pages, courseTitle);
    const filename = `niotepad-all-${slugify(courseTitle || "notes")}-${todayIso()}.md`;
    downloadMarkdownFile(md, filename);
  }, []);

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
      aria-modal="false"
      aria-label="Niotepad -- personal notes"
      aria-describedby="niotepad-description"
      tabIndex={-1}
      onKeyDown={handlePanelKeyDown}
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl outline-none"
      style={{
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        left: mountPosition.x,
        top: mountPosition.y,
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
      dragElastic={0.04}
      dragConstraints={dragConstraints}
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
        onExportPage={handleExportPage}
        onExportAll={handleExportAll}
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
            <p
              className="py-8 text-center text-xs"
              style={{ color: "var(--niotepad-text-muted)" }}
            >
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
