import { create } from "zustand";

import type {
  AddEntryParams,
  NiotepadEntrySource,
  NiotepadPage,
} from "../../domain/niotepad";
import { storageAdapter } from "../storageAdapter";
import { loadNotebook, saveNotebook } from "./indexedDbNiotepad";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEOMETRY_KEY = "niotebook.niotepad.geometry";
const UNREAD_KEY = "niotebook.niotepad.unread";

const DEFAULT_GEOMETRY = {
  x: -1, // sentinel: computed on first open relative to viewport
  y: -1,
  width: 440,
  height: 560,
};

// ---------------------------------------------------------------------------
// Debounced persistence
// ---------------------------------------------------------------------------

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 500;

function schedulePersist(): void {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const { pages } = useNiotepadStore.getState();
    void saveNotebook({ pages, version: 1 });
  }, PERSIST_DEBOUNCE_MS);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PanelGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NiotepadState = {
  // Panel
  isOpen: boolean;
  geometry: PanelGeometry;
  activePageId: string | null;
  searchQuery: string;
  sourceFilters: NiotepadEntrySource[];
  isSearchExpanded: boolean;
  hasUnread: boolean;

  // Data
  pages: NiotepadPage[];
  isLoaded: boolean;
  editingEntryId: string | null;
};

type NiotepadActions = {
  // Panel
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  updateGeometry: (partial: Partial<PanelGeometry>) => void;

  // Pages
  setActivePage: (pageId: string | null) => void;
  createPage: (lessonId: string, lectureTitle: string) => string;
  getOrCreatePage: (lessonId: string, lectureTitle: string) => string;

  // Entries
  addEntry: (params: AddEntryParams) => string;
  updateEntry: (
    id: string,
    updates: Partial<Pick<import("../../domain/niotepad").NiotepadEntryData, "content">>,
  ) => void;
  deleteEntry: (id: string) => void;

  // Search
  setSearchQuery: (query: string) => void;
  toggleSourceFilter: (source: NiotepadEntrySource) => void;
  toggleSearchExpanded: () => void;

  // Edit mode
  setEditingEntry: (id: string | null) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  clearPage: (pageId: string) => void;

  // Badge
  markRead: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readGeometry(): PanelGeometry {
  const raw = storageAdapter.getItem(GEOMETRY_KEY);
  if (!raw) return { ...DEFAULT_GEOMETRY };
  try {
    const parsed = JSON.parse(raw) as PanelGeometry;
    return {
      x: typeof parsed.x === "number" ? parsed.x : DEFAULT_GEOMETRY.x,
      y: typeof parsed.y === "number" ? parsed.y : DEFAULT_GEOMETRY.y,
      width:
        typeof parsed.width === "number"
          ? parsed.width
          : DEFAULT_GEOMETRY.width,
      height:
        typeof parsed.height === "number"
          ? parsed.height
          : DEFAULT_GEOMETRY.height,
    };
  } catch {
    return { ...DEFAULT_GEOMETRY };
  }
}

function readUnread(): boolean {
  return storageAdapter.getItem(UNREAD_KEY) === "true";
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useNiotepadStore = create<NiotepadState & NiotepadActions>()(
  (set, get) => ({
    // ----- Panel state -----
    isOpen: false,
    geometry: readGeometry(),
    activePageId: null,
    searchQuery: "",
    sourceFilters: [],
    isSearchExpanded: false,
    hasUnread: readUnread(),

    // ----- Data state -----
    pages: [],
    isLoaded: false,
    editingEntryId: null,

    // ----- Panel actions -----

    openPanel: () => {
      set({ isOpen: true });
      get().markRead();
    },

    closePanel: () => {
      set({ isOpen: false, editingEntryId: null });
    },

    togglePanel: () => {
      const { isOpen } = get();
      if (isOpen) {
        get().closePanel();
      } else {
        get().openPanel();
      }
    },

    updateGeometry: (partial) => {
      const geometry = { ...get().geometry, ...partial };
      set({ geometry });
      storageAdapter.setItem(GEOMETRY_KEY, JSON.stringify(geometry));
    },

    // ----- Page actions -----

    setActivePage: (pageId) => {
      set({ activePageId: pageId, editingEntryId: null });
    },

    createPage: (lessonId, lectureTitle) => {
      const id = crypto.randomUUID();
      const page: NiotepadPage = {
        id,
        lessonId,
        title: lectureTitle,
        lectureNumber: null,
        entries: [],
        createdAt: Date.now(),
      };
      set({ pages: [...get().pages, page] });
      schedulePersist();
      return id;
    },

    getOrCreatePage: (lessonId, lectureTitle) => {
      const existing = get().pages.find((p) => p.lessonId === lessonId);
      if (existing) return existing.id;
      return get().createPage(lessonId, lectureTitle);
    },

    // ----- Entry actions -----

    addEntry: (params) => {
      const id = crypto.randomUUID();
      const now = Date.now();
      const entry = {
        id,
        source: params.source,
        content: params.content,
        createdAt: now,
        updatedAt: now,
        videoTimeSec: params.videoTimeSec,
        pageId: params.pageId,
        metadata: params.metadata,
      };

      const pages = get().pages.map((page) =>
        page.id === params.pageId
          ? { ...page, entries: [...page.entries, entry] }
          : page,
      );

      const updates: Partial<NiotepadState> = { pages };

      if (!get().isOpen) {
        updates.hasUnread = true;
        storageAdapter.setItem(UNREAD_KEY, "true");
      }

      set(updates);
      schedulePersist();
      return id;
    },

    updateEntry: (id, updates) => {
      const pages = get().pages.map((page) => ({
        ...page,
        entries: page.entries.map((entry) =>
          entry.id === id
            ? { ...entry, ...updates, updatedAt: Date.now() }
            : entry,
        ),
      }));
      set({ pages });
      schedulePersist();
    },

    deleteEntry: (id) => {
      const pages = get().pages.map((page) => ({
        ...page,
        entries: page.entries.filter((entry) => entry.id !== id),
      }));
      set({ pages });
      schedulePersist();
    },

    // ----- Search actions -----

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    toggleSourceFilter: (source) => {
      const { sourceFilters } = get();
      const next = sourceFilters.includes(source)
        ? sourceFilters.filter((s) => s !== source)
        : [...sourceFilters, source];
      set({ sourceFilters: next });
    },

    toggleSearchExpanded: () => {
      set({ isSearchExpanded: !get().isSearchExpanded });
    },

    // ----- Edit mode -----

    setEditingEntry: (id) => {
      set({ editingEntryId: id });
    },

    // ----- Persistence -----

    loadFromStorage: async () => {
      const geometry = readGeometry();
      const hasUnread = readUnread();

      const snapshot = await loadNotebook();
      const pages = snapshot?.pages ?? [];

      set({ pages, geometry, hasUnread, isLoaded: true });
    },

    clearPage: (pageId) => {
      const pages = get().pages.map((page) =>
        page.id === pageId ? { ...page, entries: [] } : page,
      );
      set({ pages });
      schedulePersist();
    },

    // ----- Badge -----

    markRead: () => {
      set({ hasUnread: false });
      storageAdapter.removeItem(UNREAD_KEY);
    },
  }),
);

export { useNiotepadStore };
export type { NiotepadActions, NiotepadState, PanelGeometry };
