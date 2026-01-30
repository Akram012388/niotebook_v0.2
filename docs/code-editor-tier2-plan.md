# Tier 2 Code Editor — Implementation Plan

> **Status:** Draft  
> **Author:** Jarvis (AI)  
> **Date:** 2026-01-30  
> **Branch:** `jarvis/code-editor-tier2`  
> **Total Estimated Effort:** ~120–150 hours

---

## Table of Contents

1. [Viewport Policy](#viewport-policy)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Virtual Filesystem](#phase-1-virtual-filesystem)
4. [Phase 2: File Tree + Tabbed Editor](#phase-2-file-tree--tabbed-editor)
5. [Phase 3: xterm.js Terminal](#phase-3-xtermjs-terminal)
6. [Phase 4: Wasmer/WASIX Integration ✅ COMPLETED](#phase-4-wasmerwasix-integration)
7. [Phase 5: Cross-file Imports ✅ COMPLETED](#phase-5-cross-file-imports)
8. [Phase 6: Lesson-aware Environment Configs ✅ COMPLETED](#phase-6-lesson-aware-environment-configs)
9. [Phase 7: Split-pane Resizable Layout](#phase-7-split-pane-resizable-layout)
10. [Phase 8: Enhanced Autocomplete ✅ COMPLETED](#phase-8-enhanced-autocomplete)

---

## Viewport Policy

**Niotebook is desktop-only for the code editor.**

| Viewport | Min Width | Support Level |
|----------|-----------|---------------|
| Laptop | 1024px | ✅ Full support |
| Desktop | 1280px | ✅ Full support |
| XL Desktop | 1536px+ | ✅ Full support |
| Tablet / iPad | < 1024px | ❌ Not supported for editor |
| Mobile | < 768px | ❌ Not supported for editor |

**Viewports below 1024px** render a friendly message: *"Niotebook is best experienced on desktop. Please switch to a laptop or desktop browser for the full coding experience."*

**Exceptions:** The landing page, signup, and login flows work on all viewports.

**What this means for implementation:**
- NO touch event handling for split-pane drag — mouse only
- NO mobile-responsive file tree — fixed 200px sidebar
- NO mobile considerations in any phase
- NO `@media (max-width: ...)` breakpoints for editor components
- NO virtual keyboard handling for xterm.js or CodeMirror

---

## Cost Analysis

All Tier 2 dependencies are **MIT-licensed open-source** with **zero infrastructure cost**. Everything runs client-side in the browser:

| Dependency | License | Cost | Notes |
|-----------|---------|------|-------|
| Zustand | MIT | $0 | Client-side state management |
| idb | ISC | $0 | IndexedDB wrapper |
| @xterm/xterm + addons | MIT | $0 | Terminal UI, no server |
| CodeMirror 6 | MIT | $0 | **NOT yet installed** — must be added from scratch |
| Pyodide | MPL-2.0 | $0 | Python WASM, loaded from CDN |
| Wasmer JS SDK | MIT | $0 | WASM runtime, client-side |

No backend servers, no paid APIs, no SaaS dependencies. The only "infrastructure" is the user's browser and the existing Convex backend (already provisioned).

---

## Architecture Overview

### Current State

The editor is a **plain `<textarea>`** in `CodeEditor.tsx`. There is **no CodeMirror 6 component** — no `@codemirror/*` packages exist in `package.json`. Execution goes through `runtimeManager.ts` which dispatches to per-language stubs (`jsExecutor.ts`, `pythonExecutor.ts`, `cExecutor.ts`, `htmlExecutor.ts`). Output is rendered in `OutputPanel.tsx` as plain text. There is no filesystem, no terminal, no multi-file support, and Python/C runtimes are stubs.

Code persistence uses a Convex `resume:upsertCodeSnapshot` mutation storing a single `{ lessonId, language, code }` tuple per snapshot.

### Target State

```
┌─────────────────────────────────────────────────────────────────┐
│  CodePane (refactored)                                          │
│ ┌──────────────┬────────────────────────────────────────────┐   │
│ │  FileTree     │  TabbedEditorArea                          │   │
│ │  sidebar      │  ┌──────────────────────────────────────┐  │   │
│ │               │  │ Tab Bar (main.py | utils.py | + )    │  │   │
│ │  📁 /project  │  ├──────────────────────────────────────┤  │   │
│ │   📄 main.py  │  │                                      │  │   │
│ │   📄 utils.py │  │  CodeMirror 6 EditorView              │  │   │
│ │   📄 style.css│  │  (per-tab EditorState)                │  │   │
│ │               │  │                                      │  │   │
│ │               │  └──────────────────────────────────────┘  │   │
│ │               ├────────────────────────────────────────────┤   │
│ │               │  TerminalPanel (xterm.js)                  │   │
│ │               │  $ python3 main.py                         │   │
│ │               │  Hello, CS50                               │   │
│ │               │  $                                         │   │
│ └──────────────┴────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 🚨 Project-Wide Rule: SSR Safety

**ALL browser-only components MUST be loaded via `next/dynamic` with `{ ssr: false }`.**

Next.js 16 with App Router renders components on the server by default. Libraries like CodeMirror 6, xterm.js, and Wasmer access `document`, `window`, and DOM APIs at import time. Importing them at the top level **will crash SSR**.

**Mandatory pattern for every browser-only component:**

```typescript
import dynamic from "next/dynamic";

// ✅ CORRECT — lazy-loaded, SSR-safe
const CodeMirrorEditor = dynamic(
  () => import("./CodeMirrorEditor"),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

const TerminalPanel = dynamic(
  () => import("./terminal/TerminalPanel"),
  { ssr: false, loading: () => <TerminalSkeleton /> }
);

// ❌ WRONG — will crash on server
import { CodeMirrorEditor } from "./CodeMirrorEditor";
```

**This applies to:** CodeMirror 6 (Phase 2), xterm.js (Phase 3), Wasmer SDK (Phase 4), and any component that imports them.

### New Component Tree

```
CodePane
├── CodePaneHeader          (run/stop/clear + env indicator)
├── SplitPane               (horizontal resizable divider)
│   ├── EditorArea
│   │   ├── FileTreeSidebar
│   │   │   ├── FileTreeNode (recursive)
│   │   │   └── FileTreeActions (new file, new folder, delete)
│   │   └── TabbedEditor
│   │       ├── TabBar
│   │       │   └── EditorTab (per open file)
│   │       └── CodeMirrorEditor (NEW — built from scratch)
│   └── TerminalPanel
│       ├── TerminalToolbar  (clear, kill)
│       └── XTermView        (xterm.js instance)
├── RuntimeStatus           (existing, enhanced)
└── LessonEnvBadge          (shows active environment config)
```

### Data Flow

```
VirtualFS (singleton, SOURCE OF TRUTH)
  ↕ read/write
EditorStore (Zustand)          TerminalStore (Zustand)
  - openFiles[]                  - history[]
  - activeFileId                 - isRunning
  - dirtyFlags                   - shellInstance
  ↕                              ↕
CodeMirrorEditor              XTermView
  ↕ onChange                     ↕ onData
RuntimeManager (enhanced)
  - delegates to executor
  - reads/writes VirtualFS
  - pipes stdout/stderr → TerminalStore
```

### State Management

Currently all state lives in React `useState` within `CodePane.tsx` and `CodeEditor.tsx`. The Tier 2 architecture introduces **Zustand** for cross-component state that the file tree, tabs, editor, and terminal all need to share.

**Three stores:**
1. **`useFileSystemStore`** — file tree, CRUD operations, active project
2. **`useEditorStore`** — open tabs, active tab, dirty flags, CM6 EditorState per tab
3. **`useTerminalStore`** — terminal output buffer, running process, shell reference

---

## Phase 1: Virtual Filesystem ✅ COMPLETED

**Goal:** In-memory filesystem with IndexedDB persistence. All runtimes read/write files through this layer. Files survive page reload.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/infra/vfs/VirtualFS.ts` | Core filesystem class — in-memory tree + CRUD API |
| `src/infra/vfs/types.ts` | `VFSNode`, `VFSFile`, `VFSDirectory`, `VFSEvent` types |
| `src/infra/vfs/indexedDbBackend.ts` | IndexedDB persistence (save/load entire tree) |
| `src/infra/vfs/useFileSystemStore.ts` | Zustand store wrapping VirtualFS for React |
| `src/infra/vfs/__tests__/VirtualFS.test.ts` | Unit tests for CRUD, path resolution, events |

### Files to Modify

| Path | Change |
|------|--------|
| `package.json` | Add `zustand@^5.0.0`, `idb@^8.0.1` |
| `src/infra/runtime/runtimeManager.ts` | Accept `VirtualFS` instance, pass to executors |
| `src/infra/runtime/types.ts` | Add `filesystem?: VirtualFS` to `RuntimeRunInput` |
| `src/infra/runtime/pythonExecutor.ts` | Read files from VFS for Pyodide FS mounting |
| `src/infra/runtime/jsExecutor.ts` | Read files from VFS for `require()` shim |
| `src/infra/runtime/cExecutor.ts` | Read files from VFS for multi-file compilation |

### Key Interfaces

```typescript
// src/infra/vfs/types.ts

type VFSNodeKind = "file" | "directory";

type VFSFile = {
  kind: "file";
  name: string;
  path: string;           // absolute, e.g. "/project/main.py"
  content: string;
  language: RuntimeLanguage | null;  // inferred from extension
  createdAt: number;
  updatedAt: number;
};

type VFSDirectory = {
  kind: "directory";
  name: string;
  path: string;
  children: Map<string, VFSNode>;
  createdAt: number;
};

type VFSNode = VFSFile | VFSDirectory;

type VFSEventType = "create" | "update" | "delete" | "rename";

type VFSEvent = {
  type: VFSEventType;
  path: string;
  node?: VFSNode;
};

// src/infra/vfs/VirtualFS.ts — public API
class VirtualFS {
  // Read
  readFile(path: string): string | null;
  readDir(path: string): VFSNode[];
  stat(path: string): VFSNode | null;
  exists(path: string): boolean;
  glob(pattern: string): VFSFile[];

  // Write
  writeFile(path: string, content: string): VFSFile;
  mkdir(path: string): VFSDirectory;
  rename(oldPath: string, newPath: string): void;
  delete(path: string): void;

  // Bulk
  snapshot(): VFSNode;             // serialize entire tree
  restore(snapshot: VFSNode): void; // hydrate from IndexedDB

  // Events
  subscribe(listener: (event: VFSEvent) => void): () => void;

  // Helpers
  inferLanguage(filename: string): RuntimeLanguage | null;
  resolvePath(base: string, relative: string): string;

  // Backward compatibility (for existing snapshot integration)
  getMainFileContent(): string;    // returns primary file content
  setMainFile(path: string): void; // designates the "main" file
}
```

### Zustand v5 Store Pattern

> **Note:** Zustand v5 uses a simplified `create()` API. The store definition syntax changed from v4. Do NOT use the old `(set, get) => ({...})` wrapper — v5 uses `create<T>()(() => ({...}))` with `useStore.setState()` for mutations.

```typescript
// src/infra/vfs/useFileSystemStore.ts
import { create } from "zustand";

// Zustand v5 pattern — no set function wrapper
type FileSystemState = {
  vfs: VirtualFS;
  projectRoot: string;          // e.g. "/project"
  files: VFSFile[];             // flat list, derived from tree
  directories: VFSDirectory[];
  isLoaded: boolean;
  mainFilePath: string | null;  // for backward compat with snapshot system
};

type FileSystemActions = {
  createFile: (path: string, content?: string) => VFSFile;
  createDirectory: (path: string) => VFSDirectory;
  updateFile: (path: string, content: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (oldPath: string, newPath: string) => void;
  loadFromIndexedDB: (lessonId: string) => Promise<void>;
  persistToIndexedDB: (lessonId: string) => Promise<void>;
  initializeFromTemplate: (template: LessonTemplate) => void;
  getMainFileContent: () => string;  // backward compat
};

const useFileSystemStore = create<FileSystemState & FileSystemActions>()(
  (set, get) => ({
    vfs: new VirtualFS(),
    projectRoot: "/project",
    files: [],
    directories: [],
    isLoaded: false,
    mainFilePath: null,

    createFile: (path, content) => {
      const file = get().vfs.writeFile(path, content ?? "");
      // refresh derived state...
      return file;
    },
    // ... other actions
    getMainFileContent: () => {
      const { vfs, mainFilePath } = get();
      if (!mainFilePath) return "";
      return vfs.readFile(mainFilePath) ?? "";
    },
  })
);
```

### Snapshot Integration & Migration

The current `CodeEditor.tsx` persists code via Convex `resume:upsertCodeSnapshot` — a single `{ lessonId, language, code }` tuple. The VFS introduces multi-file state in IndexedDB. These systems must coexist:

**Migration strategy:**
1. **VFS exposes `getMainFileContent()`** — returns the primary file's content. This lets existing `onSnapshot` callbacks in `CodePane` continue working unchanged.
2. **Load order:** IndexedDB first → Convex snapshot fallback → lesson template fallback.
3. **The existing `onSnapshot` callback** in CodePane reads from VFS's main file, NOT from a separate code string.
4. **Future (Phase 6):** Add `vfsSnapshot: string` (JSON-serialized file tree) to the Convex snapshot table for full multi-file cloud persistence.

```typescript
// In CodePane.tsx — backward-compatible snapshot integration
const mainContent = useFileSystemStore((s) => s.getMainFileContent());

// Existing onSnapshot still works:
useEffect(() => {
  onSnapshot?.({
    ...snapshotMeta,
    code: mainContent,
  });
}, [mainContent]);
```

### State Synchronization

**VFS is the single source of truth.** All other stores are derived views.

**Sync order:**
1. VFS holds the canonical file content
2. Editor reads from VFS when a file is opened (`openFile` → `vfs.readFile()`)
3. Editor writes to VFS on save (explicit `Ctrl+S` or auto-save debounced **500ms**)
4. Terminal/runtime reads from VFS on command execution (always fresh)
5. Never read stale state — before `runCommand()`, flush all dirty editor states to VFS

**Cross-store sync via Zustand subscriptions:**
```typescript
// In useEditorStore — subscribe to VFS changes
const unsubscribe = useFileSystemStore.subscribe(
  (state) => state.files,
  (files) => {
    // Update open tabs if underlying files changed
    // (e.g., terminal wrote to a file)
  }
);
```

**Auto-save flow:**
```
User types → CM6 onChange → debounce 500ms → editorStore.saveFile(path) → vfs.writeFile(path)
```

### IndexedDB Fallback Strategy

IndexedDB may be unavailable (private browsing, corporate policy, Safari quirks). **VFS must work without persistence.**

```typescript
// src/infra/vfs/indexedDbBackend.ts

async function saveProject(key: string, root: VFSNode): Promise<void> {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, { /* ... */ });
    await db.put(STORE_NAME, JSON.stringify(root), key);
  } catch (error) {
    console.warn("[VFS] IndexedDB write failed, running in-memory only:", error);
    // VFS continues working — just no persistence across reloads
  }
}

async function loadProject(key: string): Promise<VFSNode | null> {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, { /* ... */ });
    const data = await db.get(STORE_NAME, key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.warn("[VFS] IndexedDB read failed:", error);
    return null; // fall back to Convex snapshot or lesson template
  }
}
```

**If IndexedDB is blocked:** Show a subtle warning banner: *"Your browser is blocking local storage. Files won't persist across reloads."* VFS works purely in-memory — it's a nice-to-have, not a requirement.

### IndexedDB Schema

```typescript
// src/infra/vfs/indexedDbBackend.ts
// Uses `idb` library for promise-based IndexedDB

const DB_NAME = "niotebook-vfs";
const DB_VERSION = 1;
const STORE_NAME = "projects";

// Key: `${userId}:${lessonId}`
// Value: serialized VFSNode tree (JSON)

async function deleteProject(key: string): Promise<void>;
async function listProjects(): Promise<string[]>;
```

### Dependencies to Install

```bash
bun add zustand@^5.0.0 idb@^8.0.1
```

### Estimated Effort: **16 hours**

### Commit Message
```
feat(vfs): add virtual filesystem with IndexedDB persistence

- VirtualFS class with full CRUD, path resolution, glob, events
- getMainFileContent() for backward-compatible snapshot integration
- IndexedDB backend with try/catch fallback to in-memory
- Zustand v5 store (useFileSystemStore) for React integration
- State synchronization: VFS as source of truth, 500ms auto-save
- Updated RuntimeRunInput to accept filesystem reference
- Unit tests for VirtualFS operations
```

---

## Phase 2: File Tree + Tabbed Editor ✅ COMPLETED

**Goal:** Sidebar file explorer + tabbed multi-document editing with CodeMirror 6 (built from scratch). Each tab has its own CM6 `EditorState`. Switching tabs is instant (no re-parse).

### ⚠️ Critical: CodeMirror 6 Does NOT Exist Yet

The current codebase has **NO CodeMirror** — `CodeEditor.tsx` is a plain `<textarea>`. There are **zero** `@codemirror/*` packages in `package.json`. This phase must install and set up CM6 from scratch.

**What exists:** `CodeEditor.tsx` with a `<textarea>` element, `onChange` handler updating React state, and Convex snapshot persistence.

**What must happen:** Complete replacement of the textarea with a CM6 `EditorView`. This is NOT a refactor — it's a ground-up build.

### Dependencies to Install

```bash
# Core CM6 packages — ALL required
bun add @codemirror/state @codemirror/view @codemirror/language @codemirror/commands \
       @codemirror/autocomplete @codemirror/search @codemirror/lint \
       @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-html \
       @codemirror/lang-cpp
```

> **Note:** C language support comes from `@codemirror/lang-cpp` — there is no `@codemirror/lang-c` package. The `lang-cpp` package handles both C and C++ syntax.

**Estimated bundle sizes:**
| Package Group | Gzipped Size |
|--------------|-------------|
| @codemirror/state + view + commands | ~80KB |
| @codemirror/language + autocomplete + search + lint | ~60KB |
| Language modes (js + python + html + cpp) | ~60KB |
| **Total CM6** | **~200KB gzipped** |

### SSR Safety — MANDATORY

CodeMirror 6 accesses DOM APIs at import time. It **MUST** be dynamically imported:

```typescript
// In EditorArea.tsx or wherever CM6 is rendered
import dynamic from "next/dynamic";

const TabbedEditor = dynamic(
  () => import("./TabbedEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 animate-pulse bg-surface-secondary rounded-lg" />
    ),
  }
);
```

**Every file that imports from `@codemirror/*` must only be reachable via dynamic import.** Never import CM6 modules at the top level of a server-rendered component.

### Lazy-Loading Strategy

CM6 is ~200KB gzipped. It must NEVER be in the initial page bundle:

```typescript
// Language modes loaded on demand — not upfront
const languageLoaders: Record<RuntimeLanguage, () => Promise<LanguageSupport>> = {
  js: () => import("@codemirror/lang-javascript").then(m => m.javascript()),
  python: () => import("@codemirror/lang-python").then(m => m.python()),
  html: () => import("@codemirror/lang-html").then(m => m.html()),
  c: () => import("@codemirror/lang-cpp").then(m => m.cpp()),  // lang-cpp, NOT lang-c
};

// Load language mode only when file is opened
const langSupport = await languageLoaders[language]();
```

**Loading skeleton component:**
```typescript
function EditorSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-1 p-4 animate-pulse">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="h-4 bg-surface-secondary rounded"
             style={{ width: `${40 + Math.random() * 50}%` }} />
      ))}
    </div>
  );
}
```

### Files to Create

| Path | Purpose |
|------|---------|
| `src/ui/code/FileTreeSidebar.tsx` | File tree panel with expand/collapse |
| `src/ui/code/FileTreeNode.tsx` | Recursive tree node (file or directory) |
| `src/ui/code/FileTreeActions.tsx` | Context menu: new file, new folder, rename, delete |
| `src/ui/code/TabBar.tsx` | Horizontal tab strip with close buttons |
| `src/ui/code/EditorTab.tsx` | Individual tab component (name, dirty dot, close) |
| `src/ui/code/TabbedEditor.tsx` | Manages multiple CM6 EditorStates, shows active |
| `src/ui/code/EditorArea.tsx` | Composed: FileTreeSidebar + TabbedEditor |
| `src/ui/code/useEditorStore.ts` | Zustand store for open tabs, active file, dirty state |
| `src/ui/code/CodeMirrorEditor.tsx` | **NEW** — CM6 EditorView wrapper (does not exist yet) |
| `src/ui/code/codemirrorSetup.ts` | **NEW** — CM6 extensions, keymaps, theme config |
| `src/ui/code/EditorSkeleton.tsx` | **NEW** — loading placeholder while CM6 loads |

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/code/CodeEditor.tsx` | **COMPLETE REPLACEMENT** — currently a `<textarea>`. Replace entirely with CM6-based editor using `useEditorStore` + `useFileSystemStore`. This is not a refactor — the textarea must be removed. |
| `src/ui/panes/CodePane.tsx` | Replace single `CodeEditor` with `EditorArea` + `TerminalPanel` (Phase 3) |
| `src/ui/code/LanguageTabs.tsx` | Deprecate or repurpose as environment selector (Phase 6) |
| `package.json` | Add all `@codemirror/*` packages listed above |

### Key Interfaces

```typescript
// src/ui/code/useEditorStore.ts
import { create } from "zustand";
import type { EditorState } from "@codemirror/state";

type OpenFile = {
  id: string;               // VFS path as unique key
  path: string;
  name: string;
  language: RuntimeLanguage | null;
  editorState: EditorState;  // CM6 state (preserves cursor, undo, etc.)
  isDirty: boolean;
};

type EditorStoreState = {
  openFiles: OpenFile[];
  activeFileId: string | null;

  // Actions
  openFile: (path: string) => void;          // creates EditorState if new
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateEditorState: (path: string, state: EditorState) => void;
  markDirty: (path: string, dirty: boolean) => void;
  saveFile: (path: string) => void;          // writes back to VFS
  saveAll: () => void;
  closeAll: () => void;
};
```

### Keyboard Shortcuts

Define clear ownership of keyboard shortcuts to avoid conflicts between CM6, the browser, and other panes:

| Shortcut | Owner | Behavior |
|----------|-------|----------|
| `Tab` / `Shift+Tab` | CM6 editor (when focused) | Indent / dedent |
| `Ctrl+S` / `Cmd+S` | CM6 editor (when focused) | Save to VFS, `preventDefault()` to block browser save dialog |
| `Ctrl+Z` / `Cmd+Z` | CM6 editor (when focused) | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | CM6 editor (when focused) | Redo |
| `Ctrl+/` / `Cmd+/` | CM6 editor (when focused) | Toggle line comment |
| `Ctrl+D` / `Cmd+D` | CM6 editor (when focused) | Select next occurrence |
| `Escape` | Active pane | Unfocus current pane |

**Focus isolation:** Each pane (editor, terminal) uses `event.stopPropagation()` for keyboard events it handles. The focused pane gets keyboard priority. Use a `data-focused-pane` attribute to track which pane is active.

```typescript
// In CM6 keymap setup
import { keymap } from "@codemirror/view";

const niotebookKeymap = keymap.of([
  {
    key: "Mod-s",
    run: (view) => {
      // Save to VFS
      editorStore.getState().saveFile(activeFileId);
      return true; // handled — prevents browser save dialog
    },
  },
]);
```

### Accessibility (ARIA Roles)

All custom widgets must have proper ARIA roles:

| Component | ARIA Role | Attributes |
|-----------|-----------|------------|
| `FileTreeSidebar` container | `role="tree"` | `aria-label="File explorer"` |
| `FileTreeNode` (file) | `role="treeitem"` | `aria-selected`, `tabindex` |
| `FileTreeNode` (directory) | `role="treeitem"` | `aria-expanded="true/false"` |
| `TabBar` | `role="tablist"` | `aria-label="Open files"` |
| `EditorTab` | `role="tab"` | `aria-selected="true/false"`, `aria-controls` |
| `TabbedEditor` panel | `role="tabpanel"` | `aria-labelledby` (matching tab id) |
| Split divider (Phase 7) | `role="separator"` | `aria-orientation="horizontal"`, `aria-valuenow` |

```typescript
// FileTreeNode.tsx example
<li
  role="treeitem"
  aria-expanded={isDirectory ? isExpanded : undefined}
  aria-selected={isActive}
  tabIndex={isActive ? 0 : -1}
>
  {node.name}
</li>
```

### Component Hierarchy

```
EditorArea
├── FileTreeSidebar (width: 200px, collapsible) [role="tree"]
│   ├── div.header ("Files" + collapse toggle + "+" button)
│   └── div.tree (scrollable)
│       └── FileTreeNode (recursive) [role="treeitem"]
│           ├── 📁 onClick → expand/collapse
│           ├── 📄 onClick → editorStore.openFile(path)
│           └── right-click → FileTreeActions (context menu)
│               ├── New File
│               ├── New Folder
│               ├── Rename
│               └── Delete
└── TabbedEditor (flex-1)
    ├── TabBar [role="tablist"]
    │   └── EditorTab × N [role="tab"]
    │       ├── file icon (by language)
    │       ├── filename (+ dot if dirty)
    │       ├── ✕ close button
    │       └── onClick → editorStore.setActiveFile(path)
    └── CodeMirrorEditor [role="tabpanel"]
        └── Renders activeFile.editorState
```

### Internal Scroll Behavior

Both the editor and terminal must scroll **internally** without causing the parent container to scroll:

- **CodeMirror editor**: CM6 handles scrolling natively via its own scroll DOM (`cm-scroller` element with `overflow: auto`). No additional CSS needed — just ensure the parent container is `min-h-0 flex-1 overflow-hidden` so CM6's internal scroller takes over.
- **Parent containers**: Both the editor pane and terminal pane must be styled as `min-h-0 flex-1 overflow-hidden` flex children. This ensures they fill available space without pushing the outer layout.

### File Tree Conditional on Layout

`FileTreeSidebar` is **conditionally rendered** based on the active `LayoutPreset` from `useLayoutPreset()` context:

| Layout Preset | File Tree | Rationale |
|--------------|-----------|-----------|
| `"single"` (1-pane) | ✅ Shown | Full-width view has room for sidebar |
| `"split"` (2-pane) | ✅ Shown | Code pane is wide enough |
| `"triple"` (3-pane) | ❌ Hidden | Code pane is narrow; just editor + terminal |

`EditorArea` accepts `showFileTree: boolean` prop:

```typescript
type EditorAreaProps = {
  showFileTree: boolean; // derived from useLayoutPreset().activePreset !== "triple"
  // ...other props
};
```

### CM6 Multi-Document Strategy

The key insight: CM6 `EditorView` is expensive to create/destroy, but `EditorState` is cheap. We keep **one `EditorView`** and swap its state when tabs change:

```typescript
// In TabbedEditor.tsx
useEffect(() => {
  if (!viewRef.current || !activeFile) return;
  viewRef.current.setState(activeFile.editorState);
}, [activeFile?.id]);

// On doc change, save state back to store:
EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    editorStore.updateEditorState(activeFileId, update.state);
    editorStore.markDirty(activeFileId, true);
  }
});
```

### Estimated Effort: **20 hours**

### Commit Message
```
feat(editor): add file tree sidebar and tabbed multi-file editing with CM6

- Install all @codemirror/* packages from scratch (replacing textarea)
- CodeMirrorEditor.tsx — new CM6 EditorView wrapper
- FileTreeSidebar with recursive expand/collapse and context menu
- TabBar with dirty indicators and close buttons
- TabbedEditor with CM6 EditorState swapping (single view, many states)
- EditorArea composes sidebar + tabs + editor
- Zustand useEditorStore for tab management
- Dynamic import with { ssr: false } for CM6 (SSR-safe)
- Lazy language mode loading (per-file, not upfront)
- ARIA roles on file tree, tabs, and panels
- Keyboard shortcut ownership defined (Ctrl+S saves to VFS)
- Refactored CodePane to use new EditorArea
```

---

## Phase 3: xterm.js Terminal ✅ COMPLETED

**Goal:** Real terminal UI powered by xterm.js. Receives stdout/stderr from runtime executions. Supports ANSI colors, cursor movement, scrollback. Later (Phase 4) becomes a real shell.

### SSR Safety — MANDATORY

xterm.js accesses DOM APIs at import time. It **MUST** be dynamically imported:

```typescript
// In CodePane.tsx or wherever terminal is rendered
import dynamic from "next/dynamic";

const TerminalPanel = dynamic(
  () => import("./terminal/TerminalPanel"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-black rounded-lg animate-pulse" />
    ),
  }
);
```

**xterm.js CSS** (`@xterm/xterm/css/xterm.css`) must also be imported inside the client-only component, NOT in a server-rendered layout.

### Lazy-Loading Strategy

xterm.js is ~130KB gzipped. It should only load when the terminal pane is first revealed:

```typescript
// Terminal loads on first reveal, not on page load
const TerminalPanel = dynamic(
  () => import("./terminal/TerminalPanel"),
  { ssr: false, loading: () => <TerminalSkeleton /> }
);

function TerminalSkeleton() {
  return (
    <div className="flex-1 bg-black rounded-lg flex items-end p-4">
      <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
        <span className="animate-pulse">$</span>
        <div className="w-2 h-4 bg-slate-500 animate-pulse" />
      </div>
    </div>
  );
}
```

### Files to Create

| Path | Purpose |
|------|---------|
| `src/ui/code/terminal/XTermView.tsx` | React wrapper around xterm.js Terminal |
| `src/ui/code/terminal/TerminalToolbar.tsx` | Clear, kill, font size controls |
| `src/ui/code/terminal/TerminalPanel.tsx` | Composed: toolbar + XTermView |
| `src/ui/code/terminal/useTerminalStore.ts` | Zustand store for terminal state |
| `src/ui/code/terminal/terminalTheme.ts` | Niotebook light/dark themes for xterm |
| `src/ui/code/terminal/commandRouter.ts` | Routes typed commands to executors or shell |
| `src/ui/code/terminal/TerminalSkeleton.tsx` | Loading placeholder |

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/panes/CodePane.tsx` | Replace `OutputPanel` with `TerminalPanel` (dynamically imported) |
| `src/ui/code/OutputPanel.tsx` | Deprecate (keep for fallback/legacy) |
| `src/infra/runtime/runtimeManager.ts` | Add `runWithTerminal()` that streams output to terminal |
| `src/infra/runtime/types.ts` | Add `onStdout`, `onStderr` callbacks to `RuntimeRunInput` |
| `package.json` | Add `@xterm/xterm@^5.5.0`, `@xterm/addon-fit@^0.10.0`, `@xterm/addon-web-links@^0.11.0` |

### Key Interfaces

```typescript
// src/ui/code/terminal/useTerminalStore.ts
type TerminalStoreState = {
  isRunning: boolean;
  shellMode: "command" | "interactive";  // Phase 4 adds "shell"

  // Terminal instance ref (set by XTermView on mount)
  terminalRef: Terminal | null;
  setTerminal: (t: Terminal | null) => void;

  // Output
  write: (data: string) => void;       // write to terminal
  writeLn: (data: string) => void;     // write + newline
  clear: () => void;

  // Input
  onInput: ((data: string) => void) | null;
  setInputHandler: (handler: ((data: string) => void) | null) => void;

  // Process
  runCommand: (cmd: string) => Promise<void>;
  kill: () => void;
};
```

```typescript
// src/ui/code/terminal/commandRouter.ts
// Parses user input in the terminal and routes to the right executor

type ParsedCommand = {
  executable: string;     // "python3", "node", "gcc", "cat", "ls"
  args: string[];
  raw: string;
};

function parseCommand(input: string): ParsedCommand;

async function routeCommand(
  cmd: ParsedCommand,
  vfs: VirtualFS,
  terminal: TerminalStoreState,
): Promise<number>; // exit code
```

### xterm.js Setup

```typescript
// src/ui/code/terminal/XTermView.tsx
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

// Single Terminal instance, fitted to container
// Reads theme from document.documentElement[data-theme]
// onData → routes to commandRouter or sends to running process stdin
// ResizeObserver → fitAddon.fit()
```

### Terminal Internal Scroll

xterm.js manages its own scrollback buffer internally. Configure via the `scrollback` option (default 1000 lines):

```typescript
const terminal = new Terminal({
  scrollback: 1000,  // lines of scrollback history
  // ...other options
});
```

The terminal container must be `min-h-0 flex-1 overflow-hidden` — xterm.js renders its own viewport and scroll region inside the container. The parent must **never** have `overflow-y: auto/scroll`; that would conflict with xterm's built-in scrolling.

### Terminal Themes

```typescript
// src/ui/code/terminal/terminalTheme.ts
import type { ITheme } from "@xterm/xterm";

export const niotebookDarkTerminal: ITheme = {
  background: "#0f172a",
  foreground: "#e2e8f0",
  cursor: "#e2e8f0",
  selectionBackground: "#3b82f633",
  black: "#1e293b",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#22d3ee",
  white: "#e2e8f0",
};

export const niotebookLightTerminal: ITheme = {
  background: "#ffffff",
  foreground: "#0f172a",
  cursor: "#0f172a",
  selectionBackground: "#3b82f622",
  black: "#f8fafc",
  red: "#dc2626",
  green: "#059669",
  yellow: "#d97706",
  blue: "#2563eb",
  magenta: "#7c3aed",
  cyan: "#0891b2",
  white: "#0f172a",
};
```

### Streaming Runtime Output

The current `RuntimeRunResult` returns stdout/stderr as complete strings. For terminal support, we add streaming callbacks:

```typescript
// Updated RuntimeRunInput
type RuntimeRunInput = {
  code: string;
  stdin?: string;
  timeoutMs: number;
  filesystem?: VirtualFS;
  // NEW: streaming output
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
};
```

The executors call `onStdout`/`onStderr` as output is produced, and the terminal store writes it to xterm in real time.

### Dependencies to Install

```bash
bun add @xterm/xterm@^5.5.0 @xterm/addon-fit@^0.10.0 @xterm/addon-web-links@^0.11.0
```

### Estimated Effort: **16 hours**

### Commit Message
```
feat(terminal): add xterm.js terminal with streaming runtime output

- XTermView React component wrapping xterm.js Terminal (dynamic import, SSR-safe)
- TerminalPanel with toolbar (clear, kill) + loading skeleton
- Zustand useTerminalStore for terminal state management
- commandRouter for parsing and dispatching terminal commands
- Streaming stdout/stderr callbacks in RuntimeRunInput
- Niotebook light/dark terminal themes
- Lazy-loaded: terminal only loads when first revealed (~130KB gzipped)
- Replaces OutputPanel in CodePane
```

---

## Phase 4: Wasmer/WASIX Integration ✅ COMPLETED

**Goal:** Run real commands in the browser via Wasmer/WASIX. `python3 main.py`, `ls`, `cat file.txt`, `gcc main.c -o main && ./main`. The terminal becomes a real-ish shell.

### 📋 Implementation Notes (Phase 4 Completed)

**SDK Research Findings (2026-01-30):**
- **Correct package:** `@wasmer/sdk` v0.10.0 on npm
- **API:** `init()` → `Wasmer.fromRegistry("python/python@3.12")` → `pkg.entrypoint.run({ args })` → `instance.wait()`
- **Requires:** SharedArrayBuffer (COOP/COEP headers) — handled via iframe sandbox isolation
- **Architecture:** Wasmer SDK is attempted first inside the sandbox iframe; if unavailable (e.g., browser incompatibility), falls back to Pyodide for Python and VFS builtins for shell commands
- **No `@wasmer/sdk` installed as npm dependency** — it's loaded dynamically at runtime inside the sandbox. Type declarations provided via `wasmer-sdk.d.ts`.

**Files created:**
- `src/infra/runtime/wasmer/wasmerTypes.ts` — postMessage protocol types
- `src/infra/runtime/wasmer/WasmerBridge.ts` — main app ↔ sandbox iframe bridge
- `src/infra/runtime/wasmer/wasmerShell.ts` — command executor running inside sandbox
- `src/infra/runtime/wasmer/vfsMount.ts` — VFS serialization for postMessage
- `src/infra/runtime/wasmer/wasmer-sdk.d.ts` — type declarations for @wasmer/sdk
- `src/app/editor-sandbox/page.tsx` — sandbox iframe page (client component)
- `src/app/editor-sandbox/layout.tsx` — minimal layout, no providers
- `next.config.ts` — COOP/COEP headers on `/editor-sandbox` route ONLY

**Files modified:**
- `src/ui/code/terminal/commandRouter.ts` — sandbox-first routing with fallback
- `src/infra/runtime/runtimeManager.ts` — sandbox-backed execution support
- `src/ui/code/terminal/useTerminalStore.ts` — added "shell" mode

### ⚠️ Pre-Implementation Research Step

Before writing any code for this phase, **research the current state of the Wasmer JS SDK:**

1. Check https://wasmer.io/docs/javascript for the latest API
2. Check npm for the correct package name — candidates:
   - `wasmer` (the main npm package)
   - `@aspect-build/wasmer-js` (may be deprecated)
   - `@aspect-build/wasmer-wasi` (may be deprecated)
   - **Do NOT use `@aspect-build/aspect-cli`** — that is Aspect Build, not Wasmer
3. Check SharedArrayBuffer requirements — can it work without?
4. Verify CPython and Clang WASI packages are available on the Wasmer registry
5. Create a minimal proof-of-concept before integrating

> **The Wasmer JS ecosystem is fragmented and evolving rapidly.** Package names, APIs, and capabilities may have changed since this plan was written. Budget 4–8 hours for research and prototyping before starting implementation.

### SSR Safety — MANDATORY

Wasmer SDK accesses browser APIs. It **MUST** be dynamically imported:

```typescript
// Wasmer is loaded lazily, only when shell mode is activated
const loadWasmerShell = async () => {
  const { init, runWasix } = await import(/* webpackChunkName: "wasmer" */ "wasmer");
  await init();
  return { runWasix };
};
```

### 🚨 COOP/COEP: Iframe Isolation Architecture

**DO NOT add COOP/COEP headers to the main Next.js app.** This will break:
- **Clerk** authentication popups (OAuth new-window flow)
- **Convex** WebSocket connections (loaded from `convex.cloud`)
- **YouTube embeds** in lesson video panes
- **Sentry** error reporting (CDN-loaded)

**Instead, use iframe isolation:** The Wasmer shell runs inside a sandboxed iframe on a dedicated route (`/editor-sandbox`) that has its own COOP/COEP headers. The main app NEVER gets these headers.

```
┌─────────────────────────────────────────────────────────────────┐
│  Main App (NO COOP/COEP)                                        │
│  ✅ Clerk auth works                                             │
│  ✅ Convex WebSocket works                                       │
│  ✅ YouTube embeds work                                          │
│  ✅ Sentry works                                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  <iframe src="/editor-sandbox">                            │  │
│  │  (HAS COOP/COEP headers on this route only)               │  │
│  │                                                            │  │
│  │  ✅ SharedArrayBuffer available                             │  │
│  │  ✅ Wasmer/WASI runtime works                               │  │
│  │  ✅ xterm.js + Wasmer shell                                 │  │
│  │                                                            │  │
│  │  Communication: window.postMessage() ↔ parent              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  postMessage API:                                                │
│  Parent → Iframe: { type: "run", command: "python3 main.py",    │
│                     files: [...] }                               │
│  Iframe → Parent: { type: "stdout", data: "Hello\n" }           │
│  Iframe → Parent: { type: "exit", code: 0 }                     │
│  Iframe → Parent: { type: "fs-write", path: "/main.c",          │
│                     content: "..." }                             │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// next.config.ts — ONLY on the sandbox route
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/editor-sandbox",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

// src/app/editor-sandbox/page.tsx — minimal page with Wasmer + xterm
// This page is ONLY loaded inside an iframe, never navigated to directly
```

```typescript
// src/ui/code/terminal/WasmerBridge.ts — postMessage communication
type SandboxMessage =
  | { type: "run"; command: string; files: Array<{ path: string; content: string }> }
  | { type: "stdin"; data: string }
  | { type: "kill" }
  | { type: "fs-sync"; files: Array<{ path: string; content: string }> };

type SandboxResponse =
  | { type: "stdout"; data: string }
  | { type: "stderr"; data: string }
  | { type: "exit"; code: number }
  | { type: "fs-write"; path: string; content: string }
  | { type: "ready" };
```

### Safari-Specific Notes

- Safari 16.4+ supports `SharedArrayBuffer` but **ONLY with COOP/COEP headers** — the iframe isolation approach handles this automatically.
- Safari has a **2GB memory limit** for WebAssembly (vs 4GB in Chrome). Set conservative memory limits for WASM modules.
- Test Wasmer/WASI in Safari early — Safari's WASM JIT has different performance characteristics.
- Include Safari/WebKit in the CI browser matrix (Playwright supports it).

### Files to Create

| Path | Purpose |
|------|---------|
| `src/app/editor-sandbox/page.tsx` | Isolated iframe page with COOP/COEP headers |
| `src/infra/runtime/wasmer/wasmerShell.ts` | Initialize Wasmer runtime, mount VFS, expose shell |
| `src/infra/runtime/wasmer/wasmerPython.ts` | CPython WASI package config + execution |
| `src/infra/runtime/wasmer/wasmerClang.ts` | Clang WASI package config for C compilation |
| `src/infra/runtime/wasmer/wasmerCoreutils.ts` | `ls`, `cat`, `echo`, `mkdir`, `rm` via WASIX coreutils |
| `src/infra/runtime/wasmer/wasmerTypes.ts` | Types for Wasmer integration |
| `src/infra/runtime/wasmer/vfsMount.ts` | Sync VirtualFS ↔ WASI filesystem |
| `src/ui/code/terminal/WasmerBridge.ts` | postMessage communication with sandbox iframe |

### Files to Modify

| Path | Change |
|------|--------|
| `src/infra/runtime/runtimeManager.ts` | Add Wasmer-backed executors as primary, existing as fallback |
| `src/infra/runtime/pythonExecutor.ts` | Replace stub with real Pyodide OR Wasmer CPython |
| `src/infra/runtime/cExecutor.ts` | Replace stub with Wasmer Clang |
| `src/ui/code/terminal/commandRouter.ts` | Route shell commands to Wasmer coreutils via iframe bridge |
| `src/ui/code/terminal/useTerminalStore.ts` | Add `shellMode: "shell"` for interactive WASIX shell |
| `next.config.ts` | Add COOP/COEP headers **ONLY on `/editor-sandbox` route** |
| `package.json` | Add Wasmer JS SDK (exact package TBD — see research step above) |

### Wasmer Architecture

```
User types: python3 main.py
  ↓
commandRouter.ts → detects "python3"
  ↓
WasmerBridge.ts → postMessage to iframe
  ↓ (inside iframe)
wasmerPython.ts
  ├── Loads CPython WASI package (cached after first load)
  ├── Mounts VFS files into WASI filesystem via vfsMount.ts
  ├── Executes: python3 /project/main.py
  ├── Streams stdout → postMessage → parent → terminalStore.write()
  ├── Streams stderr → postMessage → parent → terminalStore.write() (red)
  └── Returns exit code → postMessage → parent

User types: gcc main.c -o main && ./main
  ↓
commandRouter.ts → detects "gcc", then "./main"
  ↓
WasmerBridge.ts → postMessage to iframe
  ↓ (inside iframe)
wasmerClang.ts
  ├── Loads Clang WASI package
  ├── Mounts VFS
  ├── Compiles: gcc /project/main.c -o /project/main
  ├── Writes binary back to VFS (via postMessage fs-write)
  └── Runs: /project/main → streams output
```

### Key Interfaces

```typescript
// src/infra/runtime/wasmer/wasmerTypes.ts
type WasmerPackage = {
  name: string;              // e.g. "python/python", "syrusakbary/clang"
  version: string;
  entrypoint: string;        // e.g. "python3", "clang"
  preloaded: boolean;
};

type WasmerExecOptions = {
  args: string[];
  env?: Record<string, string>;
  stdin?: string;
  cwd?: string;
  filesystem?: VirtualFS;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  timeoutMs?: number;
};

type WasmerExecResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  runtimeMs: number;
};
```

```typescript
// src/infra/runtime/wasmer/vfsMount.ts
// Syncs our VirtualFS into the WASI pre-opened directory

function mountVFSToWasi(vfs: VirtualFS, wasiFs: WasiFileSystem): void;
function syncWasiToVFS(wasiFs: WasiFileSystem, vfs: VirtualFS): void;
```

### Fallback Strategy

If Wasmer fails to load (browser incompatibility, missing SharedArrayBuffer):
1. Fall back to **Pyodide** for Python (already mature, battle-tested)
2. Fall back to **TCC-WASM** for C
3. Fall back to **native JS `Function()`** for JavaScript (current approach)
4. Show banner: "Limited mode — some commands unavailable"

### Dependencies to Install

```bash
# Exact package TBD — research at implementation time (see pre-implementation step)
# Candidates: `wasmer`, `@aspect-build/wasmer-js`, or similar
bun add wasmer@latest   # placeholder — verify correct package name first
```

### Estimated Effort: **24 hours** (includes 4–8 hours research/prototyping)

### Commit Message
```
feat(wasmer): integrate Wasmer/WASIX for real shell commands via iframe isolation

- Sandboxed iframe (/editor-sandbox) with COOP/COEP headers (main app unaffected)
- postMessage bridge for parent ↔ iframe communication
- Wasmer shell initialization with VFS mounting
- CPython via WASI for real python3 execution
- Clang via WASI for real C compilation
- Coreutils (ls, cat, echo, mkdir, rm) via WASIX
- VFS ↔ WASI filesystem sync layer
- Fallback to Pyodide/TCC-WASM when Wasmer unavailable
- Safari 16.4+ compatible via iframe isolation approach
```

---

## Phase 5: Cross-file Imports ✅ COMPLETED

**Goal:** `import utils` in Python finds `/project/utils.py`. `#include "helpers.h"` in C finds `/project/helpers.h`. `require('./lib')` in JS finds `/project/lib.js`. All resolved within VirtualFS.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/infra/runtime/imports/pythonImports.ts` | Python module resolution: maps VFS paths to Pyodide/WASI FS |
| `src/infra/runtime/imports/cIncludes.ts` | C `#include` resolution: injects headers from VFS |
| `src/infra/runtime/imports/jsModules.ts` | JS `require()`/`import` shimming within VFS |
| `src/infra/runtime/imports/importResolver.ts` | Common resolution logic: relative paths, extensions |

### Files to Modify

| Path | Change |
|------|--------|
| `src/infra/runtime/pythonExecutor.ts` | Before execution, mount all `.py` files to Pyodide FS |
| `src/infra/runtime/cExecutor.ts` | Before compilation, resolve all `#include "..."` from VFS |
| `src/infra/runtime/jsExecutor.ts` | Inject `require()` shim that reads from VFS |
| `src/infra/runtime/wasmer/wasmerPython.ts` | Ensure WASI FS has all project files mounted |
| `src/infra/runtime/wasmer/wasmerClang.ts` | Ensure WASI FS has all project files mounted |

### Key Interfaces

```typescript
// src/infra/runtime/imports/importResolver.ts
type ResolvedImport = {
  sourcePath: string;       // file doing the importing
  importSpecifier: string;  // what they wrote: "utils", "./lib", "helpers.h"
  resolvedPath: string;     // VFS path: "/project/utils.py"
  content: string;          // file content
};

function resolveImport(
  specifier: string,
  fromPath: string,
  language: RuntimeLanguage,
  vfs: VirtualFS,
): ResolvedImport | null;
```

### Python Import Strategy

```typescript
// src/infra/runtime/imports/pythonImports.ts

// For Pyodide:
// 1. Before executing main file, write all .py files to Pyodide's in-memory FS
// 2. Add project root to sys.path
// 3. Imports "just work" — Python's import system finds the files

async function mountPythonFiles(pyodide: PyodideInterface, vfs: VirtualFS): Promise<void> {
  const pythonFiles = vfs.glob("**/*.py");
  for (const file of pythonFiles) {
    pyodide.FS.writeFile(file.path, file.content);
  }
  // Add to sys.path
  pyodide.runPython(`import sys; sys.path.insert(0, "${vfs.projectRoot}")`);
}

// For Wasmer/WASI: files are already mounted via vfsMount.ts — no extra work needed
```

### C Include Strategy

```typescript
// src/infra/runtime/imports/cIncludes.ts

// For TCC-WASM (fallback):
// 1. Scan code for #include "..." (not <...> — those are stdlib)
// 2. Resolve each to a VFS path
// 3. Prepend the header content to the compilation unit
// (TCC-WASM doesn't have a real FS, so we inline everything)

function resolveIncludes(code: string, filePath: string, vfs: VirtualFS): string {
  return code.replace(/#include\s+"([^"]+)"/g, (match, header) => {
    const resolved = vfs.readFile(resolvePath(filePath, header));
    if (resolved) return resolved;
    return match; // leave as-is if not found (may be stdlib)
  });
}

// For Wasmer/Clang: files are mounted — includes resolve naturally
```

### JS Module Strategy

```typescript
// src/infra/runtime/imports/jsModules.ts

// Inject a require() shim before user code:
function makeRequireShim(mainPath: string, vfs: VirtualFS): string {
  return `
    const __vfs_files = ${JSON.stringify(vfsToMap(vfs))};
    function require(specifier) {
      const resolved = __resolveModule(specifier, "${mainPath}");
      if (!__vfs_files[resolved]) throw new Error("Cannot find module: " + specifier);
      const module = { exports: {} };
      const exports = module.exports;
      (new Function("module", "exports", "require", __vfs_files[resolved]))(module, exports, require);
      return module.exports;
    }
  `;
}
```

### Estimated Effort: **12 hours**

### Commit Message
```
feat(imports): enable cross-file imports for Python, C, and JS

- Python: mount all .py files to Pyodide FS + sys.path
- C: resolve #include "..." from VFS, inline for TCC fallback
- JS: require() shim reading from VFS
- Common importResolver with relative path + extension resolution
- Works with both Wasmer (native FS) and fallback executors
```

---

## Phase 6: Lesson-aware Environment Configs ✅ COMPLETED

**Goal:** Each course/lesson can specify its language, starter files, allowed packages, and runtime settings. When a student opens a lesson, the environment auto-configures.

### ⚠️ Convex Schema Migration Note

The `environmentConfig` field on the `lessons` table **MUST** be optional (`v.optional(...)`) to avoid breaking existing data. Existing lessons have no environment config and must continue to work.

```typescript
// convex/schema.ts
lessons: defineTable({
  // ... existing fields ...
  environmentConfig: v.optional(v.object({
    presetId: v.optional(v.string()),
    primaryLanguage: v.string(),
    allowedLanguages: v.array(v.string()),
    // ... other fields
  })),
})
```

**Deployment order:** Deploy schema change BEFORE deploying UI that reads it. Default to `"sandbox"` preset when `environmentConfig` is null/undefined.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/domain/lessonEnvironment.ts` | Pure types + validation for lesson env configs |
| `src/infra/runtime/envPresets.ts` | Built-in presets: "cs50x-c", "cs50p-python", "cs50w-js", etc. |
| `src/ui/code/LessonEnvBadge.tsx` | Shows active environment (e.g. "CS50x · C") |
| `src/ui/code/EnvSelector.tsx` | Override selector (for admin/debug) |
| `convex/schema.ts` (extend) | Add `environmentConfig` field to `lessons` table |
| `convex/lessons.ts` (extend) | Query to fetch lesson environment config |

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/panes/CodePane.tsx` | Read lesson env config, initialize VFS with template files |
| `src/infra/vfs/useFileSystemStore.ts` | `initializeFromTemplate()` populates VFS from config |
| `src/infra/runtime/runtimeManager.ts` | Load executor based on env config language (not user selection) |
| `src/ui/code/LanguageTabs.tsx` | Only show languages allowed by env config |

### Key Interfaces

```typescript
// src/domain/lessonEnvironment.ts

type LessonEnvironment = {
  id: string;
  name: string;                          // "CS50x Week 1 — C"
  primaryLanguage: RuntimeLanguage;
  allowedLanguages: RuntimeLanguage[];
  starterFiles: StarterFile[];
  packages: PackageConfig[];
  runtimeSettings: RuntimeSettings;
};

type StarterFile = {
  path: string;          // e.g. "/project/mario.c"
  content: string;
  readonly: boolean;     // some files shouldn't be editable (e.g. test harness)
};

type PackageConfig = {
  language: RuntimeLanguage;
  name: string;           // e.g. "cs50" (Python), "cs50.h" (C)
  version?: string;
};

type RuntimeSettings = {
  timeoutMs: number;              // default 5000, can be increased for heavy programs
  maxOutputBytes: number;         // prevent infinite output
  stdinEnabled: boolean;          // some lessons need input
  compilerFlags?: string[];       // e.g. ["-lcs50"] for CS50 C library
};

// Presets
type EnvPresetId =
  | "cs50x-c"
  | "cs50x-python"
  | "cs50p-python"
  | "cs50w-js"
  | "cs50w-html"
  | "cs50ai-python"
  | "sandbox";         // free-form, all languages
```

```typescript
// src/infra/runtime/envPresets.ts

const ENV_PRESETS: Record<EnvPresetId, LessonEnvironment> = {
  "cs50x-c": {
    id: "cs50x-c",
    name: "CS50x · C",
    primaryLanguage: "c",
    allowedLanguages: ["c"],
    starterFiles: [
      { path: "/project/hello.c", content: '#include <stdio.h>\n\nint main(void)\n{\n    printf("hello, world\\n");\n}\n', readonly: false },
    ],
    packages: [
      { language: "c", name: "cs50.h" },
    ],
    runtimeSettings: {
      timeoutMs: 10_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: true,
      compilerFlags: ["-lcs50"],
    },
  },
  "cs50p-python": {
    id: "cs50p-python",
    name: "CS50P · Python",
    primaryLanguage: "python",
    allowedLanguages: ["python"],
    starterFiles: [
      { path: "/project/hello.py", content: 'name = input("What is your name? ")\nprint(f"hello, {name}")\n', readonly: false },
    ],
    packages: [
      { language: "python", name: "cs50" },
    ],
    runtimeSettings: {
      timeoutMs: 10_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: true,
    },
  },
  "cs50w-js": {
    id: "cs50w-js",
    name: "CS50W · JavaScript",
    primaryLanguage: "js",
    allowedLanguages: ["js", "html"],
    starterFiles: [
      { path: "/project/index.html", content: '<!DOCTYPE html>\n<html>\n<head><title>CS50W</title></head>\n<body>\n  <h1>Hello, CS50W</h1>\n  <script src="app.js"></script>\n</body>\n</html>', readonly: false },
      { path: "/project/app.js", content: 'console.log("Hello from CS50W");\n', readonly: false },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 5_000,
      maxOutputBytes: 524_288,
      stdinEnabled: false,
    },
  },
  // ... more presets
  "sandbox": {
    id: "sandbox",
    name: "Sandbox",
    primaryLanguage: "js",
    allowedLanguages: ["js", "python", "html", "c"],
    starterFiles: [
      { path: "/project/main.js", content: 'console.log("Hello, Niotebook");\n', readonly: false },
    ],
    packages: [],
    runtimeSettings: {
      timeoutMs: 5_000,
      maxOutputBytes: 1_048_576,
      stdinEnabled: false,
    },
  },
};
```

### Estimated Effort: **10 hours**

### Commit Message
```
feat(env): add lesson-aware environment configs with presets

- LessonEnvironment type with starter files, packages, runtime settings
- Built-in presets: cs50x-c, cs50p-python, cs50w-js, cs50ai-python, sandbox
- LessonEnvBadge component showing active environment
- VFS auto-populates from lesson template on first load
- Language tabs filtered by environment allowedLanguages
- Convex schema extended with optional environmentConfig on lessons table
```

---

## Phase 7: Split-pane Resizable Layout ✅ COMPLETED

**Goal:** Editor on top (or left), terminal on bottom (or right), with a draggable divider. The CodePane area becomes a proper IDE-like split layout.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/ui/code/SplitPane.tsx` | Generic resizable split container (vertical or horizontal) |
| `src/ui/code/SplitDivider.tsx` | Draggable divider with grip handle |
| `src/ui/code/useSplitPane.ts` | Hook: drag state, min/max sizes, localStorage persistence |

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/panes/CodePane.tsx` | Wrap EditorArea + TerminalPanel in `SplitPane` |
| `src/ui/layout/layoutTypes.ts` | Add split-pane size preferences to layout config |

### Key Interfaces

```typescript
// src/ui/code/SplitPane.tsx
type SplitPaneProps = {
  direction: "horizontal" | "vertical";
  initialSplit: number;       // 0–1, e.g. 0.65 = editor gets 65%
  minFirst: number;           // min pixels for first pane
  minSecond: number;          // min pixels for second pane
  storageKey?: string;        // localStorage key for persistence
  first: ReactNode;
  second: ReactNode;
};
```

```typescript
// src/ui/code/useSplitPane.ts
type SplitPaneState = {
  splitRatio: number;
  isDragging: boolean;
  containerRef: RefObject<HTMLDivElement>;

  startDrag: (e: MouseEvent) => void;  // mouse only — desktop-only app
  resetSplit: () => void;              // double-click divider → reset to default
};
```

### Editor-Terminal Divider Style

The CodePane container uses **zero padding and zero gap** between editor and terminal. A single 1px `border-t border-border` divider separates them (VS Code style). Both panes bleed edge-to-edge within the container.

```
┌─────────────────────────────────────────────────────────────────┐
│  Editor (flex-[3])              │  ← no padding, edge-to-edge
│  CM6 fills entire area          │
├─────────────────────────────────┤  ← 1px border-t border-border
│  Terminal (flex-[2])            │  ← no padding, edge-to-edge
│  xterm.js fills entire area     │
└─────────────────────────────────┘
```

**Remove** any `gap-4 p-4` from the CodePane inner container. The editor and terminal are `flex-[3]` and `flex-[2]` respectively with `min-h-0 overflow-hidden`. The divider is purely the CSS border on the terminal container's top edge — no separate divider element needed for the static layout (the `SplitDivider` component is only for the draggable resize handle).

### Implementation Notes

```typescript
// SplitPane.tsx — key implementation details

// 1. Use CSS grid with fr units for the split
//    gridTemplateRows: `${splitRatio}fr 4px ${1 - splitRatio}fr`
//
// 2. Divider is a 4px row with cursor: row-resize (or col-resize)
//    On mousedown → track mousemove, update splitRatio
//    On mouseup → persist to localStorage
//    On double-click → reset to initialSplit
//
// 3. During drag, add pointer-events: none to both panes
//    (prevents iframe/xterm from stealing mouse events)
//
// 4. Emit ResizeObserver event so xterm.js fitAddon re-fits
//    and CodeMirror reflows
//
// 5. Mouse-only — no touch events needed (desktop-only app, see Viewport Policy)
```

### Accessibility

The split divider must be keyboard-accessible:

```typescript
<div
  role="separator"
  aria-orientation="horizontal"
  aria-valuenow={Math.round(splitRatio * 100)}
  aria-valuemin={0}
  aria-valuemax={100}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "ArrowUp") adjustSplit(-0.05);
    if (e.key === "ArrowDown") adjustSplit(+0.05);
  }}
/>
```

### Estimated Effort: **8 hours**

### Commit Message
```
feat(layout): add resizable split-pane layout for editor + terminal

- Generic SplitPane component with drag divider (mouse-only, desktop app)
- Vertical split: editor top, terminal bottom (default 65/35)
- Horizontal split option for wide screens
- Split ratio persisted to localStorage
- Double-click divider to reset
- Proper pointer-events handling during drag
- Auto-refit for xterm.js and CodeMirror on resize
- Accessible separator with keyboard arrow support
```

---

## Phase 8: Enhanced Autocomplete ✅ COMPLETED

**Goal:** Context-aware autocomplete that knows about other files in the project, imported modules, and language-specific completions beyond what CM6 provides by default.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/ui/code/autocomplete/vfsCompletions.ts` | Completions from VFS: filenames for imports, symbols from other files |
| `src/ui/code/autocomplete/pythonCompletions.ts` | Python builtins, stdlib modules, Pyodide-available packages |
| `src/ui/code/autocomplete/cCompletions.ts` | C stdlib functions, CS50 library functions |
| `src/ui/code/autocomplete/jsCompletions.ts` | JS/DOM builtins, Node.js-like APIs available in sandbox |
| `src/ui/code/autocomplete/snippets.ts` | Language-specific snippets (for loop, function def, etc.) |
| `src/ui/code/autocomplete/completionProvider.ts` | Unified provider that merges all sources |

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/code/codemirrorSetup.ts` | Replace default `autocompletion()` with custom provider |
| `src/ui/code/CodeMirrorEditor.tsx` | Wire completion provider with VFS access |
| `package.json` | No new deps — uses CM6 `@codemirror/autocomplete` (installed in Phase 2) |

### Key Interfaces

```typescript
// src/ui/code/autocomplete/completionProvider.ts
import type { CompletionSource, CompletionContext, Completion } from "@codemirror/autocomplete";

// Master completion source that delegates to language-specific + VFS sources
function createNiotebookCompletions(
  language: RuntimeLanguage,
  vfs: VirtualFS,
  currentPath: string,
): CompletionSource;

// Each sub-source returns Completion[]
type CompletionProvider = {
  language: RuntimeLanguage;
  getCompletions: (context: CompletionContext, vfs: VirtualFS) => Completion[];
};
```

### VFS-aware Completions

```typescript
// src/ui/code/autocomplete/vfsCompletions.ts

// 1. Import completions: when typing `import ` or `from `, suggest VFS filenames
//    - Python: `import u` → suggests `utils` (from /project/utils.py)
//    - JS: `require('./` → suggests files in current directory
//    - C: `#include "` → suggests .h files in project

// 2. Cross-file symbol completions:
//    - Parse other open files for top-level symbols (function names, class names)
//    - Use simple regex extraction (not a full parser — good enough for education)
//    - Python: `def (\w+)`, `class (\w+)`, `(\w+)\s*=`
//    - JS: `function (\w+)`, `const (\w+)`, `class (\w+)`
//    - C: `\w+\s+(\w+)\s*\(` (function declarations)
```

### Snippet Examples

```typescript
// src/ui/code/autocomplete/snippets.ts

const pythonSnippets: Completion[] = [
  { label: "def", detail: "function", apply: "def ${name}(${params}):\n    ${body}" },
  { label: "for", detail: "for loop", apply: "for ${item} in ${iterable}:\n    ${body}" },
  { label: "class", detail: "class def", apply: "class ${Name}:\n    def __init__(self):\n        ${pass}" },
  { label: "if", detail: "if block", apply: "if ${condition}:\n    ${body}" },
  { label: "main", detail: "main guard", apply: 'if __name__ == "__main__":\n    main()' },
];

const cSnippets: Completion[] = [
  { label: "main", detail: "main function", apply: "int main(void)\n{\n    ${body}\n    return 0;\n}" },
  { label: "for", detail: "for loop", apply: "for (int ${i} = 0; ${i} < ${n}; ${i}++)\n{\n    ${body}\n}" },
  { label: "printf", detail: "print", apply: 'printf("${format}\\n"${, args});' },
  { label: "include", detail: "#include", apply: '#include <${header}.h>' },
];

const jsSnippets: Completion[] = [
  { label: "fn", detail: "arrow function", apply: "const ${name} = (${params}) => {\n  ${body}\n};" },
  { label: "for", detail: "for loop", apply: "for (let ${i} = 0; ${i} < ${n}; ${i}++) {\n  ${body}\n}" },
  { label: "log", detail: "console.log", apply: "console.log(${value});" },
  { label: "fetch", detail: "fetch request", apply: "const response = await fetch('${url}');\nconst data = await response.json();" },
];
```

### Estimated Effort: **12 hours**

### Commit Message
```
feat(autocomplete): enhanced context-aware completions

- VFS-aware import completions (suggest project files)
- Cross-file symbol extraction (functions, classes from other files)
- Language-specific builtin completions (Python, C, JS)
- Code snippets for common patterns per language
- Unified completion provider merging all sources
- Replaces default CM6 autocompletion
```

---

## Summary

| Phase | Feature | New Files | Effort (hrs) | Dependencies |
|-------|---------|-----------|-------------|-------------|
| 1 | Virtual Filesystem | 5 | 16 | zustand, idb |
| 2 | File Tree + Tabs + CM6 | 11 | 20 | @codemirror/* (10 packages) |
| 3 | xterm.js Terminal | 7 | 16 | @xterm/xterm, @xterm/addon-fit, @xterm/addon-web-links |
| 4 | Wasmer/WASIX | 8 | 24 | wasmer JS SDK (TBD — research required) |
| 5 | Cross-file Imports | 4 | 12 | — |
| 6 | Lesson-aware Envs | 4+ | 10 | — |
| 7 | Split-pane Layout | 3 | 8 | — |
| 8 | Enhanced Autocomplete | 6 | 12 | — |
| **Total** | | **48** | **118** | |

### Recommended Build Order

Phases 1 → 2 → 7 → 3 → 5 → 6 → 4 → 8

**Rationale:**
- **Phase 1 (VFS)** is foundational — everything depends on it
- **Phase 2 (File Tree + Tabs + CM6)** gives immediate visible value AND installs CM6 (prerequisite for everything)
- **Phase 7 (Split-pane)** is low-risk and needed before terminal
- **Phase 3 (Terminal)** requires split-pane to display
- **Phase 5 (Imports)** builds on VFS and is needed for real coding
- **Phase 6 (Envs)** configures the experience per lesson
- **Phase 4 (Wasmer)** is highest risk, saved for when fundamentals are solid; requires research
- **Phase 8 (Autocomplete)** is polish, can ship last

### Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Wasmer JS SDK instability / wrong package | Phase 4 blocked | Pre-implementation research step; Pyodide + TCC-WASM fallback |
| COOP/COEP breaks Clerk/Convex/YouTube | Auth + video broken | Iframe isolation — main app NEVER gets COOP/COEP |
| SSR crash from browser-only libraries | Build fails | ALL CM6/xterm/Wasmer behind `next/dynamic({ ssr: false })` |
| xterm.js bundle size (~130KB) | Slow initial load | Dynamic import, lazy load on first terminal reveal |
| CM6 bundle size (~200KB) | Slow initial load | Dynamic import, per-language lazy loading |
| IndexedDB unavailable | VFS data loss | Graceful fallback to in-memory + warning banner |
| CM6 EditorState memory | Memory bloat with many tabs | Limit to 10 open tabs, evict LRU states |
| Safari WASM memory limit (2GB) | Large programs crash | Conservative memory limits, test early |

### Browser Requirements

- **SharedArrayBuffer** required for Wasmer (Phase 4 only) — handled via iframe isolation
- Chrome 91+, Firefox 79+, Safari 16.4+ (all support SharedArrayBuffer with COOP/COEP in iframe)
- Fallback path works without SharedArrayBuffer (Phases 1–3, 5–8)
- **Desktop only** — viewport ≥ 1024px (see Viewport Policy)
