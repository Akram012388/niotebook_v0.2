import { nanoid } from "nanoid";
import { create } from "zustand";

import type { NiotepadEntry } from "../../domain/niotepad";
import { loadSnapshot, saveSnapshot } from "./indexedDbNiotepad";

type NiotepadState = {
  entries: NiotepadEntry[];
  lessonId: string | null;
  isLoaded: boolean;
};

type NiotepadActions = {
  loadLesson: (lessonId: string) => Promise<void>;
  addEntry: (
    entry: Omit<NiotepadEntry, "id" | "createdAt" | "updatedAt">,
  ) => string;
  updateEntry: (
    id: string,
    updates: Partial<Pick<NiotepadEntry, "content">>,
  ) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const SAVE_DEBOUNCE_MS = 500;

function scheduleSave(): void {
  const store = useNiotepadStore.getState();
  if (!store.lessonId) return;
  if (saveTimer !== undefined) {
    clearTimeout(saveTimer);
  }
  const lessonId = store.lessonId;
  saveTimer = setTimeout(() => {
    saveTimer = undefined;
    const { entries } = useNiotepadStore.getState();
    void saveSnapshot(lessonId, { lessonId, entries, version: 1 });
  }, SAVE_DEBOUNCE_MS);
}

const useNiotepadStore = create<NiotepadState & NiotepadActions>()(
  (set, get) => ({
    entries: [],
    lessonId: null,
    isLoaded: false,

    loadLesson: async (lessonId) => {
      set({ entries: [], lessonId, isLoaded: false });
      const snapshot = await loadSnapshot(lessonId);
      set({
        entries: snapshot?.entries ?? [],
        lessonId,
        isLoaded: true,
      });
    },

    addEntry: (entry) => {
      const now = Date.now();
      const id = nanoid();
      const newEntry: NiotepadEntry = {
        ...entry,
        id,
        createdAt: now,
        updatedAt: now,
      };
      set({ entries: [...get().entries, newEntry] });
      scheduleSave();
      return id;
    },

    updateEntry: (id, updates) => {
      const entries = get().entries.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: Date.now() }
          : entry,
      );
      set({ entries });
      scheduleSave();
    },

    deleteEntry: (id) => {
      const entries = get().entries.filter((entry) => entry.id !== id);
      set({ entries });
      scheduleSave();
    },

    clearAll: () => {
      set({ entries: [] });
      scheduleSave();
    },
  }),
);

export { useNiotepadStore };
export type { NiotepadActions, NiotepadState };
