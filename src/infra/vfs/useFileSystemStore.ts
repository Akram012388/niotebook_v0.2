/**
 * Zustand v5 store for the Virtual Filesystem.
 *
 * State sync ordering (HIGH issue #7):
 *   VFS is the single source of truth.
 *   Editor reads from VFS on open, writes back on save.
 *   Auto-save is debounced at 500ms (handled by the editor store, not here).
 *   Runtime always reads fresh from VFS before execution.
 */
import { create } from "zustand";

import { VirtualFS } from "./VirtualFS";
import type { VFSSnapshotNode } from "./VirtualFS";
import {
  loadProject,
  saveProject,
} from "./indexedDbBackend";
import type { VFSDirectory, VFSFile, VFSNode } from "./types";
import type { LessonEnvironment } from "../../domain/lessonEnvironment";

type TemplateFile = {
  path: string;
  content: string;
};

type FileSystemState = {
  vfs: VirtualFS;
  projectRoot: string;
  files: VFSFile[];
  directories: VFSDirectory[];
  isLoaded: boolean;
  mainFilePath: string | null;
};

type FileSystemActions = {
  createFile: (path: string, content?: string) => VFSFile;
  createDirectory: (path: string) => VFSDirectory;
  updateFile: (path: string, content: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (oldPath: string, newPath: string) => void;
  loadFromIndexedDB: (lessonId: string) => Promise<boolean>;
  persistToIndexedDB: (lessonId: string) => Promise<void>;
  initializeFromTemplate: (files: TemplateFile[]) => void;
  initializeFromEnvironment: (env: LessonEnvironment) => void;
  getMainFileContent: () => string;
  refreshDerivedState: () => void;
};

function collectNodes(
  nodes: VFSNode[],
  files: VFSFile[],
  dirs: VFSDirectory[],
): void {
  for (const node of nodes) {
    if (node.kind === "file") {
      files.push(node);
    } else {
      dirs.push(node);
      collectNodes(Array.from(node.children.values()), files, dirs);
    }
  }
}

function deriveState(vfs: VirtualFS): {
  files: VFSFile[];
  directories: VFSDirectory[];
} {
  const files: VFSFile[] = [];
  const directories: VFSDirectory[] = [];
  const rootChildren = vfs.readDir("/");
  collectNodes(rootChildren, files, directories);
  return { files, directories };
}

const useFileSystemStore = create<FileSystemState & FileSystemActions>()(
  (set, get) => ({
    vfs: new VirtualFS(),
    projectRoot: "/project",
    files: [],
    directories: [],
    isLoaded: false,
    mainFilePath: null,

    createFile: (path, content) => {
      const { vfs } = get();
      const file = vfs.writeFile(path, content ?? "");
      set(deriveState(vfs));
      return file;
    },

    createDirectory: (path) => {
      const { vfs } = get();
      const dir = vfs.mkdir(path);
      set(deriveState(vfs));
      return dir;
    },

    updateFile: (path, content) => {
      const { vfs } = get();
      vfs.writeFile(path, content);
      set(deriveState(vfs));
    },

    deleteNode: (path) => {
      const { vfs } = get();
      vfs.delete(path);
      const mainFilePath =
        get().mainFilePath === path ? null : get().mainFilePath;
      set({ ...deriveState(vfs), mainFilePath });
    },

    renameNode: (oldPath, newPath) => {
      const { vfs } = get();
      vfs.rename(oldPath, newPath);
      const mainFilePath =
        get().mainFilePath === oldPath ? newPath : get().mainFilePath;
      set({ ...deriveState(vfs), mainFilePath });
    },

    loadFromIndexedDB: async (lessonId) => {
      const { vfs } = get();
      const snapshot = await loadProject(lessonId);
      if (!snapshot) return false;
      vfs.restore(snapshot);
      set({ ...deriveState(vfs), isLoaded: true });
      return true;
    },

    persistToIndexedDB: async (lessonId) => {
      const { vfs } = get();
      const snapshot = vfs.snapshot() as VFSSnapshotNode;
      await saveProject(lessonId, snapshot);
    },

    initializeFromTemplate: (files) => {
      const { vfs, projectRoot } = get();
      for (const file of files) {
        const fullPath = file.path.startsWith("/")
          ? file.path
          : `${projectRoot}/${file.path}`;
        vfs.writeFile(fullPath, file.content);
      }
      // Set main file to first file if not already set
      if (!get().mainFilePath && files.length > 0) {
        const firstPath = files[0].path.startsWith("/")
          ? files[0].path
          : `${projectRoot}/${files[0].path}`;
        vfs.setMainFile(firstPath);
        set({ mainFilePath: firstPath });
      }
      set({ ...deriveState(vfs), isLoaded: true });
    },

    initializeFromEnvironment: (env) => {
      const { vfs, projectRoot } = get();
      const templateFiles: TemplateFile[] = env.starterFiles.map((sf) => ({
        path: sf.path.startsWith("/") ? sf.path : `${projectRoot}/${sf.path}`,
        content: sf.content,
      }));

      for (const file of templateFiles) {
        vfs.writeFile(file.path, file.content);
      }

      if (!get().mainFilePath && templateFiles.length > 0) {
        const firstPath = templateFiles[0].path;
        vfs.setMainFile(firstPath);
        set({ mainFilePath: firstPath });
      }

      set({ ...deriveState(vfs), isLoaded: true });
    },

    getMainFileContent: () => {
      const { vfs } = get();
      return vfs.getMainFileContent();
    },

    refreshDerivedState: () => {
      const { vfs } = get();
      set(deriveState(vfs));
    },
  }),
);

export { useFileSystemStore };
export type { FileSystemActions, FileSystemState, TemplateFile };
