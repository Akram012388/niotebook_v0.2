/**
 * Zustand v5 store for multi-tab editor state.
 *
 * Each open file holds a CM6 EditorState (preserving cursor, undo history,
 * selection). The store manages open/close/activate tabs and reads/writes
 * from the VFS store.
 */
import { create } from "zustand";
import { EditorState } from "@codemirror/state";

import type { RuntimeLanguage } from "../../infra/runtime/types";
import { useFileSystemStore } from "../../infra/vfs/useFileSystemStore";
import { baseExtensions, loadLanguage, themeExtension } from "./codemirrorSetup";

// ── Types ───────────────────────────────────────────────────

type OpenFile = {
  /** VFS absolute path — used as unique key. */
  id: string;
  path: string;
  name: string;
  language: RuntimeLanguage | null;
  editorState: EditorState;
  isDirty: boolean;
};

type EditorStoreState = {
  openFiles: OpenFile[];
  activeFileId: string | null;
};

type EditorStoreActions = {
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateEditorState: (path: string, state: EditorState) => void;
  markDirty: (path: string, dirty: boolean) => void;
  saveFile: (path: string) => void;
  saveAll: () => void;
  closeAll: () => void;
};

// ── Helpers ─────────────────────────────────────────────────

function basename(path: string): string {
  const last = path.lastIndexOf("/");
  return last === -1 ? path : path.slice(last + 1);
}

function isDarkMode(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

async function createEditorState(
  content: string,
  language: RuntimeLanguage | null,
): Promise<EditorState> {
  const extensions = [...baseExtensions(), themeExtension(isDarkMode())];

  if (language) {
    const langSupport = await loadLanguage(language);
    extensions.push(langSupport);
  }

  return EditorState.create({ doc: content, extensions });
}

// ── Store ───────────────────────────────────────────────────

const useEditorStore = create<EditorStoreState & EditorStoreActions>()(
  (set, get) => ({
    openFiles: [],
    activeFileId: null,

    openFile: async (path) => {
      const { openFiles } = get();

      // Already open — just activate
      const existing = openFiles.find((f) => f.id === path);
      if (existing) {
        set({ activeFileId: path });
        return;
      }

      // Read content from VFS
      const vfs = useFileSystemStore.getState().vfs;
      const content = vfs.readFile(path) ?? "";
      const language = vfs.inferLanguage(basename(path));
      const editorState = await createEditorState(content, language);

      const file: OpenFile = {
        id: path,
        path,
        name: basename(path),
        language,
        editorState,
        isDirty: false,
      };

      set({
        openFiles: [...get().openFiles, file],
        activeFileId: path,
      });
    },

    closeFile: (path) => {
      const { openFiles, activeFileId } = get();
      const idx = openFiles.findIndex((f) => f.id === path);
      if (idx === -1) return;

      const next = openFiles.filter((f) => f.id !== path);
      let nextActive = activeFileId;

      if (activeFileId === path) {
        // Activate adjacent tab or null
        if (next.length === 0) {
          nextActive = null;
        } else if (idx < next.length) {
          nextActive = next[idx].id;
        } else {
          nextActive = next[next.length - 1].id;
        }
      }

      set({ openFiles: next, activeFileId: nextActive });
    },

    setActiveFile: (path) => {
      set({ activeFileId: path });
    },

    updateEditorState: (path, state) => {
      set({
        openFiles: get().openFiles.map((f) =>
          f.id === path ? { ...f, editorState: state } : f,
        ),
      });
    },

    markDirty: (path, dirty) => {
      set({
        openFiles: get().openFiles.map((f) =>
          f.id === path ? { ...f, isDirty: dirty } : f,
        ),
      });
    },

    saveFile: (path) => {
      const file = get().openFiles.find((f) => f.id === path);
      if (!file) return;

      const content = file.editorState.doc.toString();
      useFileSystemStore.getState().updateFile(path, content);

      set({
        openFiles: get().openFiles.map((f) =>
          f.id === path ? { ...f, isDirty: false } : f,
        ),
      });
    },

    saveAll: () => {
      const { openFiles } = get();
      const fsStore = useFileSystemStore.getState();

      for (const file of openFiles) {
        if (file.isDirty) {
          const content = file.editorState.doc.toString();
          fsStore.updateFile(file.path, content);
        }
      }

      set({
        openFiles: openFiles.map((f) => ({ ...f, isDirty: false })),
      });
    },

    closeAll: () => {
      set({ openFiles: [], activeFileId: null });
    },
  }),
);

export { useEditorStore };
export type { EditorStoreActions, EditorStoreState, OpenFile };
