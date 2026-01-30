import type { RuntimeLanguage } from "../runtime/types";
import type { VFSDirectory, VFSEvent, VFSFile, VFSNode } from "./types";

const EXTENSION_LANGUAGE_MAP: Record<string, RuntimeLanguage> = {
  ".js": "js",
  ".mjs": "js",
  ".cjs": "js",
  ".py": "python",
  ".html": "html",
  ".htm": "html",
  ".c": "c",
  ".h": "c",
};

/**
 * Serializable snapshot of the VFS tree.
 * Uses plain arrays instead of Maps for JSON compatibility.
 */
type VFSSnapshot = {
  kind: "directory";
  name: string;
  path: string;
  createdAt: number;
  children: VFSSnapshotNode[];
};

type VFSSnapshotFile = {
  kind: "file";
  name: string;
  path: string;
  content: string;
  language: RuntimeLanguage | null;
  createdAt: number;
  updatedAt: number;
};

type VFSSnapshotNode = VFSSnapshotFile | VFSSnapshot;

class VirtualFS {
  private root: VFSDirectory;
  private listeners: Set<(event: VFSEvent) => void> = new Set();
  private mainFilePath: string | null = null;

  constructor() {
    this.root = this.createDirectory("/", "/");
  }

  // ── Read ──────────────────────────────────────────────────

  readFile(path: string): string | null {
    const node = this.getNode(this.normalizePath(path));
    if (node?.kind === "file") return node.content;
    return null;
  }

  readDir(path: string): VFSNode[] {
    const node = this.getNode(this.normalizePath(path));
    if (node?.kind === "directory") return Array.from(node.children.values());
    return [];
  }

  stat(path: string): VFSNode | null {
    return this.getNode(this.normalizePath(path));
  }

  exists(path: string): boolean {
    return this.getNode(this.normalizePath(path)) !== null;
  }

  glob(pattern: string): VFSFile[] {
    const results: VFSFile[] = [];
    const regex = this.globToRegex(pattern);
    this.walkFiles(this.root, (file) => {
      if (regex.test(file.path)) results.push(file);
    });
    return results;
  }

  // ── Write ─────────────────────────────────────────────────

  writeFile(path: string, content: string): VFSFile {
    const normalized = this.normalizePath(path);
    const existing = this.getNode(normalized);

    if (existing?.kind === "file") {
      existing.content = content;
      existing.updatedAt = Date.now();
      this.emit({ type: "update", path: normalized, node: existing });
      return existing;
    }

    // Ensure parent directories exist
    const parentPath = this.parentOf(normalized);
    if (parentPath !== normalized) {
      this.mkdir(parentPath);
    }

    const name = this.basename(normalized);
    const file: VFSFile = {
      kind: "file",
      name,
      path: normalized,
      content,
      language: this.inferLanguage(name),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const parent = this.getNode(parentPath);
    if (parent?.kind === "directory") {
      parent.children.set(name, file);
    }

    this.emit({ type: "create", path: normalized, node: file });
    return file;
  }

  mkdir(path: string): VFSDirectory {
    const normalized = this.normalizePath(path);
    const existing = this.getNode(normalized);
    if (existing?.kind === "directory") return existing;

    // Recursively create parent directories
    const parentPath = this.parentOf(normalized);
    if (parentPath !== normalized) {
      this.mkdir(parentPath);
    }

    const name = this.basename(normalized);
    const dir = this.createDirectory(name, normalized);

    const parent = this.getNode(parentPath);
    if (parent?.kind === "directory") {
      parent.children.set(name, dir);
    }

    this.emit({ type: "create", path: normalized, node: dir });
    return dir;
  }

  rename(oldPath: string, newPath: string): void {
    const normalizedOld = this.normalizePath(oldPath);
    const normalizedNew = this.normalizePath(newPath);
    const node = this.getNode(normalizedOld);
    if (!node) return;

    // Remove from old parent
    const oldParentPath = this.parentOf(normalizedOld);
    const oldParent = this.getNode(oldParentPath);
    if (oldParent?.kind === "directory") {
      oldParent.children.delete(node.name);
    }

    // Ensure new parent exists
    const newParentPath = this.parentOf(normalizedNew);
    this.mkdir(newParentPath);

    // Update node
    const newName = this.basename(normalizedNew);
    node.name = newName;
    node.path = normalizedNew;
    if (node.kind === "file") {
      node.language = this.inferLanguage(newName);
    }

    // Update children paths recursively if directory
    if (node.kind === "directory") {
      this.updateChildPaths(node, normalizedNew);
    }

    // Add to new parent
    const newParent = this.getNode(newParentPath);
    if (newParent?.kind === "directory") {
      newParent.children.set(newName, node);
    }

    this.emit({ type: "rename", path: normalizedOld, node });
  }

  delete(path: string): void {
    const normalized = this.normalizePath(path);
    const node = this.getNode(normalized);
    if (!node) return;

    const parentPath = this.parentOf(normalized);
    const parent = this.getNode(parentPath);
    if (parent?.kind === "directory") {
      parent.children.delete(node.name);
    }

    if (this.mainFilePath === normalized) {
      this.mainFilePath = null;
    }

    this.emit({ type: "delete", path: normalized });
  }

  // ── Bulk ──────────────────────────────────────────────────

  snapshot(): VFSSnapshotNode {
    return this.serializeNode(this.root);
  }

  restore(snapshot: VFSSnapshotNode): void {
    if (snapshot.kind !== "directory") return;
    this.root = this.deserializeDirectory(snapshot);
    this.emit({ type: "create", path: "/", node: this.root });
  }

  // ── Events ────────────────────────────────────────────────

  subscribe(listener: (event: VFSEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Helpers ───────────────────────────────────────────────

  inferLanguage(filename: string): RuntimeLanguage | null {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex === -1) return null;
    const ext = filename.slice(dotIndex).toLowerCase();
    return EXTENSION_LANGUAGE_MAP[ext] ?? null;
  }

  resolvePath(base: string, relative: string): string {
    if (relative.startsWith("/")) return this.normalizePath(relative);
    const baseDir = base.endsWith("/") ? base : this.parentOf(base);
    const segments = this.normalizePath(baseDir).split("/").filter(Boolean);
    for (const part of relative.split("/")) {
      if (part === "..") segments.pop();
      else if (part !== ".") segments.push(part);
    }
    return "/" + segments.join("/");
  }

  // ── Backward Compatibility ────────────────────────────────

  getMainFileContent(): string {
    if (this.mainFilePath) {
      return this.readFile(this.mainFilePath) ?? "";
    }
    return "";
  }

  setMainFile(path: string): void {
    this.mainFilePath = this.normalizePath(path);
  }

  getMainFilePath(): string | null {
    return this.mainFilePath;
  }

  // ── Private ───────────────────────────────────────────────

  private createDirectory(name: string, path: string): VFSDirectory {
    return {
      kind: "directory",
      name,
      path,
      children: new Map(),
      createdAt: Date.now(),
    };
  }

  private getNode(path: string): VFSNode | null {
    if (path === "/") return this.root;
    const segments = path.split("/").filter(Boolean);
    let current: VFSNode = this.root;
    for (const segment of segments) {
      if (current.kind !== "directory") return null;
      const child = current.children.get(segment);
      if (!child) return null;
      current = child;
    }
    return current;
  }

  private normalizePath(path: string): string {
    const cleaned = ("/" + path).replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    return cleaned;
  }

  private parentOf(path: string): string {
    const lastSlash = path.lastIndexOf("/");
    if (lastSlash <= 0) return "/";
    return path.slice(0, lastSlash);
  }

  private basename(path: string): string {
    const lastSlash = path.lastIndexOf("/");
    return path.slice(lastSlash + 1);
  }

  private emit(event: VFSEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private walkFiles(node: VFSNode, callback: (file: VFSFile) => void): void {
    if (node.kind === "file") {
      callback(node);
    } else {
      for (const child of node.children.values()) {
        this.walkFiles(child, callback);
      }
    }
  }

  private globToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "{{GLOBSTAR}}")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]")
      .replace(/\{\{GLOBSTAR\}\}/g, ".*");
    return new RegExp(`^${escaped}$`);
  }

  private updateChildPaths(dir: VFSDirectory, newBasePath: string): void {
    for (const child of dir.children.values()) {
      child.path = newBasePath + "/" + child.name;
      if (child.kind === "directory") {
        this.updateChildPaths(child, child.path);
      }
    }
  }

  private serializeNode(node: VFSNode): VFSSnapshotNode {
    if (node.kind === "file") {
      return {
        kind: "file",
        name: node.name,
        path: node.path,
        content: node.content,
        language: node.language,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };
    }
    return {
      kind: "directory",
      name: node.name,
      path: node.path,
      createdAt: node.createdAt,
      children: Array.from(node.children.values()).map((c) =>
        this.serializeNode(c),
      ),
    };
  }

  private deserializeDirectory(snapshot: VFSSnapshot): VFSDirectory {
    const dir: VFSDirectory = {
      kind: "directory",
      name: snapshot.name,
      path: snapshot.path,
      createdAt: snapshot.createdAt,
      children: new Map(),
    };
    for (const child of snapshot.children) {
      if (child.kind === "file") {
        dir.children.set(child.name, { ...child });
      } else {
        dir.children.set(child.name, this.deserializeDirectory(child));
      }
    }
    return dir;
  }
}

export { VirtualFS };
export type { VFSSnapshot, VFSSnapshotFile, VFSSnapshotNode };
