# Tier 2 Code Editor — Implementation Plan

> **Status:** Draft  
> **Author:** Jarvis (AI)  
> **Date:** 2026-01-30  
> **Branch:** `jarvis/code-editor-tier2`  
> **Total Estimated Effort:** ~120–150 hours

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Virtual Filesystem](#phase-1-virtual-filesystem)
3. [Phase 2: File Tree + Tabbed Editor](#phase-2-file-tree--tabbed-editor)
4. [Phase 3: xterm.js Terminal](#phase-3-xtermjs-terminal)
5. [Phase 4: Wasmer/WASIX Integration](#phase-4-wasmerWASIX-integration)
6. [Phase 5: Cross-file Imports](#phase-5-cross-file-imports)
7. [Phase 6: Lesson-aware Environment Configs](#phase-6-lesson-aware-environment-configs)
8. [Phase 7: Split-pane Resizable Layout](#phase-7-split-pane-resizable-layout)
9. [Phase 8: Enhanced Autocomplete](#phase-8-enhanced-autocomplete)

---

## Cost Analysis

All Tier 2 dependencies are **MIT-licensed open-source** with **zero infrastructure cost**. Everything runs client-side in the browser:

| Dependency | License | Cost | Notes |
|-----------|---------|------|-------|
| Zustand | MIT | $0 | Client-side state management |
| idb | ISC | $0 | IndexedDB wrapper |
| @xterm/xterm + addons | MIT | $0 | Terminal UI, no server |
| CodeMirror 6 | MIT | $0 | Already in use |
| Pyodide | MPL-2.0 | $0 | Python WASM, loaded from CDN |
| Wasmer JS SDK | MIT | $0 | WASM runtime, client-side |

No backend servers, no paid APIs, no SaaS dependencies. The only "infrastructure" is the user's browser and the existing Convex backend (already provisioned).

---

## Architecture Overview

### Current State

The editor is a single-file CodeMirror 6 instance (`CodeMirrorEditor.tsx`) inside `CodePane.tsx`. Execution goes through `runtimeManager.ts` which dispatches to per-language stubs (`jsExecutor.ts`, `pythonExecutor.ts`, `cExecutor.ts`, `htmlExecutor.ts`). Output is rendered in `OutputPanel.tsx` as plain text. There is no filesystem, no terminal, no multi-file support, and Python/C runtimes are stubs.

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
│   │       └── CodeMirrorEditor (existing, enhanced)
│   └── TerminalPanel
│       ├── TerminalToolbar  (clear, kill)
│       └── XTermView        (xterm.js instance)
├── RuntimeStatus           (existing, enhanced)
└── LessonEnvBadge          (shows active environment config)
```

### Data Flow

```
VirtualFS (singleton)
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

## Phase 1: Virtual Filesystem

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
}
```

```typescript
// src/infra/vfs/useFileSystemStore.ts
import { create } from "zustand";

type FileSystemState = {
  vfs: VirtualFS;
  projectRoot: string;          // e.g. "/project"
  files: VFSFile[];             // flat list, derived from tree
  directories: VFSDirectory[];
  isLoaded: boolean;

  // Actions
  createFile: (path: string, content?: string) => VFSFile;
  createDirectory: (path: string) => VFSDirectory;
  updateFile: (path: string, content: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (oldPath: string, newPath: string) => void;
  loadFromIndexedDB: (lessonId: string) => Promise<void>;
  persistToIndexedDB: (lessonId: string) => Promise<void>;
  initializeFromTemplate: (template: LessonTemplate) => void;
};
```

### IndexedDB Schema

```typescript
// src/infra/vfs/indexedDbBackend.ts
// Uses `idb` library for promise-based IndexedDB

const DB_NAME = "niotebook-vfs";
const DB_VERSION = 1;
const STORE_NAME = "projects";

// Key: `${userId}:${lessonId}`
// Value: serialized VFSNode tree (JSON)

async function saveProject(key: string, root: VFSNode): Promise<void>;
async function loadProject(key: string): Promise<VFSNode | null>;
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
- IndexedDB backend for project persistence across reloads
- Zustand store (useFileSystemStore) for React integration
- Updated RuntimeRunInput to accept filesystem reference
- Unit tests for VirtualFS operations
```

---

## Phase 2: File Tree + Tabbed Editor

**Goal:** Sidebar file explorer + tabbed multi-document editing. Each tab has its own CM6 `EditorState`. Switching tabs is instant (no re-parse).

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

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/code/CodeMirrorEditor.tsx` | Accept `EditorState` from parent instead of creating its own; support multi-state switching |
| `src/ui/code/CodeEditor.tsx` | Refactor to use `useEditorStore` + `useFileSystemStore`; remove single-file assumptions |
| `src/ui/panes/CodePane.tsx` | Replace single `CodeEditor` with `EditorArea` + `TerminalPanel` (Phase 3) |
| `src/ui/code/LanguageTabs.tsx` | Deprecate or repurpose as environment selector (Phase 6) |

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

### Component Hierarchy

```
EditorArea
├── FileTreeSidebar (width: 200px, collapsible)
│   ├── div.header ("Files" + collapse toggle + "+" button)
│   └── div.tree (scrollable)
│       └── FileTreeNode (recursive)
│           ├── 📁 onClick → expand/collapse
│           ├── 📄 onClick → editorStore.openFile(path)
│           └── right-click → FileTreeActions (context menu)
│               ├── New File
│               ├── New Folder
│               ├── Rename
│               └── Delete
└── TabbedEditor (flex-1)
    ├── TabBar
    │   └── EditorTab × N
    │       ├── file icon (by language)
    │       ├── filename (+ dot if dirty)
    │       ├── ✕ close button
    │       └── onClick → editorStore.setActiveFile(path)
    └── CodeMirrorEditor
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
feat(editor): add file tree sidebar and tabbed multi-file editing

- FileTreeSidebar with recursive expand/collapse and context menu
- TabBar with dirty indicators and close buttons
- TabbedEditor with CM6 EditorState swapping (single view, many states)
- EditorArea composes sidebar + tabs + editor
- Zustand useEditorStore for tab management
- Refactored CodePane to use new EditorArea
```

---

## Phase 3: xterm.js Terminal

**Goal:** Real terminal UI powered by xterm.js. Receives stdout/stderr from runtime executions. Supports ANSI colors, cursor movement, scrollback. Later (Phase 4) becomes a real shell.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/ui/code/terminal/XTermView.tsx` | React wrapper around xterm.js Terminal |
| `src/ui/code/terminal/TerminalToolbar.tsx` | Clear, kill, font size controls |
| `src/ui/code/terminal/TerminalPanel.tsx` | Composed: toolbar + XTermView |
| `src/ui/code/terminal/useTerminalStore.ts` | Zustand store for terminal state |
| `src/ui/code/terminal/terminalTheme.ts` | Niotebook light/dark themes for xterm |
| `src/ui/code/terminal/commandRouter.ts` | Routes typed commands to executors or shell |

### Files to Modify

| Path | Change |
|------|--------|
| `src/ui/panes/CodePane.tsx` | Replace `OutputPanel` with `TerminalPanel` |
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

- XTermView React component wrapping xterm.js Terminal
- TerminalPanel with toolbar (clear, kill)
- Zustand useTerminalStore for terminal state management
- commandRouter for parsing and dispatching terminal commands
- Streaming stdout/stderr callbacks in RuntimeRunInput
- Niotebook light/dark terminal themes
- Replaces OutputPanel in CodePane
```

---

## Phase 4: Wasmer/WASIX Integration

**Goal:** Run real commands in the browser via Wasmer/WASIX. `python3 main.py`, `ls`, `cat file.txt`, `gcc main.c -o main && ./main`. The terminal becomes a real-ish shell.

### Files to Create

| Path | Purpose |
|------|---------|
| `src/infra/runtime/wasmer/wasmerShell.ts` | Initialize Wasmer runtime, mount VFS, expose shell |
| `src/infra/runtime/wasmer/wasmerPython.ts` | CPython WASI package config + execution |
| `src/infra/runtime/wasmer/wasmerClang.ts` | Clang WASI package config for C compilation |
| `src/infra/runtime/wasmer/wasmerCoreutils.ts` | `ls`, `cat`, `echo`, `mkdir`, `rm` via WASIX coreutils |
| `src/infra/runtime/wasmer/wasmerTypes.ts` | Types for Wasmer integration |
| `src/infra/runtime/wasmer/vfsMount.ts` | Sync VirtualFS ↔ WASI filesystem |

### Files to Modify

| Path | Change |
|------|--------|
| `src/infra/runtime/runtimeManager.ts` | Add Wasmer-backed executors as primary, existing as fallback |
| `src/infra/runtime/pythonExecutor.ts` | Replace stub with real Pyodide OR Wasmer CPython |
| `src/infra/runtime/cExecutor.ts` | Replace stub with Wasmer Clang |
| `src/ui/code/terminal/commandRouter.ts` | Route shell commands to Wasmer coreutils |
| `src/ui/code/terminal/useTerminalStore.ts` | Add `shellMode: "shell"` for interactive WASIX shell |
| `package.json` | Add `@aspect-build/aspect-cli@^0.1.0` or `@aspect-build/aspect-cli` (wasmer JS SDK) |
| `next.config.ts` | Add headers for `SharedArrayBuffer` (COOP/COEP) |

### Wasmer Architecture

```
User types: python3 main.py
  ↓
commandRouter.ts → detects "python3"
  ↓
wasmerPython.ts
  ├── Loads CPython WASI package (cached after first load)
  ├── Mounts VFS files into WASI filesystem via vfsMount.ts
  ├── Executes: python3 /project/main.py
  ├── Streams stdout → terminalStore.write()
  ├── Streams stderr → terminalStore.write() (red)
  └── Returns exit code

User types: gcc main.c -o main && ./main
  ↓
commandRouter.ts → detects "gcc", then "./main"
  ↓
wasmerClang.ts
  ├── Loads Clang WASI package
  ├── Mounts VFS
  ├── Compiles: gcc /project/main.c -o /project/main
  ├── Writes binary back to VFS
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

### Required Headers (next.config.ts)

SharedArrayBuffer requires Cross-Origin Isolation:

```typescript
// next.config.ts — add to headers()
{
  source: "/(.*)",
  headers: [
    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ],
}
```

**⚠️ Warning:** COOP/COEP breaks some third-party embeds (YouTube, Clerk). Mitigation:
- YouTube iframe already has `allow="cross-origin"` — test thoroughly
- Clerk auth popup may need `credentialless` instead of `require-corp` for COEP
- Fallback: serve code editor in a separate iframe with its own origin that has the headers

### Dependencies to Install

```bash
bun add @aspect-build/aspect-cli@^0.1.0   # Wasmer JS SDK (or @aspect-build/aspect-wasi)
# OR if using the wasmer-js SDK directly:
bun add @aspect-build/aspect-cli@latest    # Check latest at wasmer.io/js
```

> **Note:** The Wasmer JS SDK is evolving rapidly. At implementation time, verify the latest package name and API at https://wasmer.io/docs/javascript. The above is a placeholder — the actual package may be `@aspect-build/aspect-cli`, `wasmer`, or similar.

### Fallback Strategy

If Wasmer fails to load (browser incompatibility, missing SharedArrayBuffer):
1. Fall back to **Pyodide** for Python (already mature, battle-tested)
2. Fall back to **TCC-WASM** for C
3. Fall back to **native JS `Function()`** for JavaScript (current approach)
4. Show banner: "Limited mode — some commands unavailable"

### Estimated Effort: **24 hours**

### Commit Message
```
feat(wasmer): integrate Wasmer/WASIX for real shell commands

- Wasmer shell initialization with VFS mounting
- CPython via WASI for real python3 execution
- Clang via WASI for real C compilation
- Coreutils (ls, cat, echo, mkdir, rm) via WASIX
- VFS ↔ WASI filesystem sync layer
- COOP/COEP headers in next.config.ts
- Fallback to Pyodide/TCC-WASM when Wasmer unavailable
```

---

## Phase 5: Cross-file Imports

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

## Phase 6: Lesson-aware Environment Configs

**Goal:** Each course/lesson can specify its language, starter files, allowed packages, and runtime settings. When a student opens a lesson, the environment auto-configures.

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
- Convex schema extended with environmentConfig on lessons table
```

---

## Phase 7: Split-pane Resizable Layout

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

  startDrag: (e: MouseEvent | TouchEvent) => void;
  resetSplit: () => void;     // double-click divider → reset to default
};
```

### Editor-Terminal Divider Style

The CodePane container uses **zero padding and zero gap** between editor and terminal. A single 1px `border-t border-border` divider separates them (VS Code style). Both panes bleed edge-to-edge within the container.

```
┌─────────────────────────────────┐
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
```

### Estimated Effort: **8 hours**

### Commit Message
```
feat(layout): add resizable split-pane layout for editor + terminal

- Generic SplitPane component with drag divider
- Vertical split: editor top, terminal bottom (default 65/35)
- Horizontal split option for wide screens
- Split ratio persisted to localStorage
- Double-click divider to reset
- Proper pointer-events handling during drag
- Auto-refit for xterm.js and CodeMirror on resize
```

---

## Phase 8: Enhanced Autocomplete

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
| `package.json` | No new deps — uses CM6 `@codemirror/autocomplete` (already installed) |

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
| 2 | File Tree + Tabs | 8 | 20 | — |
| 3 | xterm.js Terminal | 6 | 16 | @xterm/xterm, @xterm/addon-fit, @xterm/addon-web-links |
| 4 | Wasmer/WASIX | 6 | 24 | wasmer JS SDK (TBD) |
| 5 | Cross-file Imports | 4 | 12 | — |
| 6 | Lesson-aware Envs | 4+ | 10 | — |
| 7 | Split-pane Layout | 3 | 8 | — |
| 8 | Enhanced Autocomplete | 6 | 12 | — |
| **Total** | | **42** | **118** | |

### Recommended Build Order

Phases 1 → 2 → 7 → 3 → 5 → 6 → 4 → 8

**Rationale:**
- **Phase 1 (VFS)** is foundational — everything depends on it
- **Phase 2 (File Tree + Tabs)** gives immediate visible value
- **Phase 7 (Split-pane)** is low-risk and needed before terminal
- **Phase 3 (Terminal)** requires split-pane to display
- **Phase 5 (Imports)** builds on VFS and is needed for real coding
- **Phase 6 (Envs)** configures the experience per lesson
- **Phase 4 (Wasmer)** is highest risk, saved for when fundamentals are solid
- **Phase 8 (Autocomplete)** is polish, can ship last

### Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Wasmer JS SDK instability | Phase 4 blocked | Pyodide + TCC-WASM fallback already works for Python/C |
| COOP/COEP breaks YouTube embeds | Video pane broken | Isolate code editor in sandboxed iframe with separate headers |
| COOP/COEP breaks Clerk auth | Auth broken | Use `credentialless` COEP policy or iframe isolation |
| xterm.js bundle size (~300KB) | Slow initial load | Dynamic import, lazy load terminal on first use |
| IndexedDB quota limits | VFS data loss | Warn user at 80% quota, offer export, cap file sizes |
| CM6 EditorState memory | Memory bloat with many tabs | Limit to 10 open tabs, evict LRU states |

### Browser Requirements

- **SharedArrayBuffer** required for Wasmer (Phase 4 only)
- Chrome 91+, Firefox 79+, Safari 16.4+ (all support SharedArrayBuffer with proper headers)
- Fallback path works without SharedArrayBuffer (Phases 1–3, 5–8)

---

## Gaps, Gotchas & Risk Mitigations

### 1. SSR / Hydration — Browser-Only Libraries

**Issue:** Both CodeMirror 6 and xterm.js access `document`, `window`, and DOM APIs at import time. Next.js 16 with App Router renders components on the server by default. Importing these at the top level will crash SSR.

**Mitigation:**
- All CM6 and xterm.js components must use `next/dynamic` with `{ ssr: false }` or be wrapped in a client-only boundary.
- The existing `CodeEditor.tsx` already has `"use client"` but does not use CM6 directly (it's a `<textarea>`). When replacing with real CM6, ensure the CM6 import is dynamic:
  ```typescript
  const TabbedEditor = dynamic(() => import("./TabbedEditor"), { ssr: false });
  const TerminalPanel = dynamic(() => import("./terminal/TerminalPanel"), { ssr: false });
  ```
- **xterm.js CSS** (`@xterm/xterm/css/xterm.css`) must also be imported client-side only or in a global CSS file.

### 2. No Existing CodeMirror 6 Component

**Issue:** The plan references `CodeMirrorEditor.tsx` as "existing, enhanced" but the actual codebase has **no CM6 component** — `CodeEditor.tsx` is a plain `<textarea>`. There is no `@codemirror/*` in `package.json`.

**Mitigation:** Phase 2 must include installing all CM6 packages:
```bash
bun add @codemirror/state @codemirror/view @codemirror/language @codemirror/commands @codemirror/autocomplete @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-html @codemirror/lang-cpp
```
This is a **significant bundle addition** (~200KB gzipped). Must be lazy-loaded.

### 3. Code Snapshot Integration Gap

**Issue:** The current `CodeEditor.tsx` persists code via Convex `resume:upsertCodeSnapshot` — a single `{ lessonId, language, code }` tuple. The Tier 2 VFS introduces multi-file state stored in IndexedDB. These two persistence systems will conflict:
- Which is the source of truth — IndexedDB VFS or Convex snapshot?
- When a student returns to a lesson, do we load from IndexedDB or Convex?
- The Convex snapshot stores one code string; VFS stores a file tree.

**Mitigation:**
- **Phase 1** should define a migration strategy: Convex snapshots become the "cloud backup" of the active file only (or a serialized VFS snapshot). IndexedDB is the primary local store.
- Add a `vfsSnapshot: string` (JSON-serialized file tree) field to the Convex snapshot table for full multi-file persistence.
- On lesson load: try IndexedDB first → fall back to Convex snapshot → fall back to lesson template.

### 4. COOP/COEP Will Break Clerk and Convex

**Issue:** Setting `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` globally will break:
- **Clerk** authentication popups (OAuth redirects open in a new window that can't communicate back)
- **Convex** WebSocket connection (Convex client JS is loaded from `convex.cloud` CDN)
- **YouTube embeds** (loaded from `youtube.com`)
- **Sentry** error reporting (loaded from Sentry CDN)

**Mitigation:**
- **Do NOT set COOP/COEP globally.** Only Phase 4 (Wasmer) needs SharedArrayBuffer.
- Option A: Use `credentialless` COEP (weaker but compatible with most third-party resources). Check browser support.
- Option B: Run the Wasmer-powered terminal in a separate **cross-origin iframe** that has its own headers. Communication via `postMessage`.
- Option C: Skip SharedArrayBuffer entirely and use Pyodide (which works without it) + single-threaded WASI. Performance is acceptable for educational use.
- **Recommendation:** Option C for MVP. Option B if true shell performance is needed later.

### 5. Wasmer JS SDK — Package Name Wrong

**Issue:** The plan references `@aspect-build/aspect-cli` as the Wasmer JS SDK. This is incorrect. The actual packages are:
- `@aspect-build/aspect-*` — this is Aspect Build, not Wasmer
- The Wasmer JS SDK is `@aspect-build/wasmer` or `wasmer` — but the ecosystem is fragmented

**Mitigation:** At implementation time, use the **Wasmer SDK from wasmer.io/javascript**. The current stable approach is:
- `@aspect-build/wasmer-js` or the `wasmer` npm package
- Verify at https://github.com/aspect-build/aspect-wasmer-js (or check wasmer.io)
- Consider using Wasmer's **WASI runner** directly rather than a high-level SDK

### 6. Bundle Size Impact

**Issue:** New dependencies add significant JS to the client bundle:

| Package | Gzipped Size | Notes |
|---------|-------------|-------|
| @codemirror/* (full) | ~200KB | Language modes, autocomplete, etc. |
| @xterm/xterm | ~130KB | Terminal core |
| @xterm/addon-fit | ~3KB | |
| zustand | ~2KB | Minimal |
| idb | ~2KB | Minimal |
| Pyodide | ~6MB | Loaded on demand, not bundled |

**Mitigation:**
- All heavy packages must be `next/dynamic` with `{ ssr: false }` — they are never in the initial page load.
- CM6 extensions should be loaded per-language (don't load Python language support until a Python file is opened).
- xterm.js should only load when the terminal pane is first revealed.
- Add `splitChunks` hints in next.config.ts to isolate editor/terminal chunks.

### 7. Mobile / Touch Support

**Issue:** The plan doesn't address mobile at all. Key problems:
- **File tree sidebar** at 200px is too wide on mobile screens
- **Split-pane drag** divider doesn't work well with touch (need `touchstart`/`touchmove`)
- **xterm.js on mobile** — virtual keyboard conflicts, viewport resizing issues
- **CM6 on mobile** — works but is heavy; mobile keyboards can conflict with editor key bindings

**Mitigation:**
- On screens < 768px, collapse file tree by default and use a drawer/modal
- `SplitPane` must handle `TouchEvent` in addition to `MouseEvent` (the plan mentions this in `startDrag` signature but doesn't detail it)
- Consider hiding the terminal on mobile and showing output inline (like current `OutputPanel`)
- Add `@media (max-width: 768px)` breakpoint handling to `EditorArea`

### 8. Safari WebAssembly Quirks

**Issue:** Safari has historically had WASM limitations:
- Stricter memory limits for WebAssembly (2GB cap vs 4GB in Chrome)
- `SharedArrayBuffer` only available with COOP/COEP headers (same as others, but Safari was later to support `credentialless`)
- Pyodide works in Safari 16.4+ but has known performance differences

**Mitigation:**
- Test Pyodide and any WASI runtimes in Safari early (Phase 4)
- Set conservative memory limits for WASM modules
- Include Safari in the CI browser matrix (Playwright supports WebKit)

### 9. Race Conditions — VFS ↔ Editor ↔ Terminal

**Issue:** Multiple stores (VFS, Editor, Terminal) reading/writing the same files:
- User edits file in editor → editor store marks dirty → user runs code → runtime reads from VFS (stale!)
- Terminal `cat file.txt` reads from VFS while editor has unsaved changes
- Two tabs open same file → changes in one don't reflect in the other (impossible by design since one view, but edge case if file tree re-opens it)

**Mitigation:**
- **Auto-save to VFS** on every keystroke (debounced 300ms) — editor state flows to VFS immediately
- Before runtime execution, flush all dirty editor states to VFS (`saveAll()`)
- The `VFS.subscribe()` event system should notify the terminal if files change mid-execution (or just read at exec start)
- Document that VFS is the single source of truth; editor states are derived views

### 10. IndexedDB Reliability

**Issue:** IndexedDB can be:
- Cleared by the browser (low disk space, private browsing, user clears data)
- Blocked in some corporate environments
- Slow on first read with large projects
- Not available in SSR (obviously)

**Mitigation:**
- Always fall back gracefully: `loadFromIndexedDB()` failure → load from Convex snapshot → load from lesson template
- Cap VFS total size (e.g. 5MB per project) to keep IndexedDB fast
- Show a subtle indicator when VFS is persisted vs. ephemeral
- Never depend on IndexedDB for critical state — Convex is the durable store

### 11. Keyboard Shortcuts Conflict

**Issue:** CM6, xterm.js, and the browser all compete for keyboard shortcuts:
- `Ctrl+S` — CM6 wants it, browser wants it, we want "save to VFS"
- `Ctrl+C` — xterm.js wants it (kill process), browser wants it (copy)
- `Tab` — CM6 wants it (indent), browser wants it (focus next element)
- `Escape` — used to unfocus both CM6 and xterm

**Mitigation:**
- CM6: Use `keymap` extension to handle `Ctrl+S` → save to VFS, prevent default
- xterm.js: Differentiate `Ctrl+C` with selection (copy) vs. without selection (SIGINT)
- Use `event.preventDefault()` judiciously — don't trap users
- Add a "focus mode" indicator so users know which pane has keyboard focus

### 12. Accessibility Gaps

**Issue:** The plan doesn't mention accessibility:
- File tree needs `role="tree"`, `role="treeitem"`, `aria-expanded`
- Tab bar needs `role="tablist"`, `role="tab"`, `aria-selected`
- xterm.js has limited screen reader support (it's a canvas-based terminal)
- Split-pane divider needs `role="separator"`, `aria-valuenow`, keyboard arrows

**Mitigation:**
- Use semantic ARIA roles on all custom widgets
- CM6 has good built-in accessibility — don't override it
- For xterm.js, enable the `screenReaderMode` option (creates a hidden textarea mirror)
- Divider should respond to Arrow keys for keyboard-only resize

### 13. Missing `@codemirror/lang-cpp` — It's `@codemirror/lang-c` That Doesn't Exist

**Issue:** There is no official `@codemirror/lang-c` package. C/C++ support comes from:
- `@codemirror/lang-cpp` (covers both C and C++)
- Or use `@lezer/cpp` parser directly

**Mitigation:** Use `@codemirror/lang-cpp` for C files. The language mode handles C syntax fine (C is a subset of C++ for parsing purposes).

### 14. Zustand v5 — API Changes

**Issue:** The plan specifies `zustand@^5.0.0`. Zustand v5 has breaking changes from v4:
- `create` no longer needs the middleware pattern for devtools
- `useStore` selector API changed
- TypeScript generics are different

**Mitigation:** Since this is a greenfield addition (no existing Zustand), v5 is fine. Just ensure all store code follows v5 patterns. Check https://zustand.docs.pmnd.rs/migrations/migrating-to-v5 at implementation time.

### 15. Convex Schema Migration

**Issue:** Phase 6 extends `convex/schema.ts` with `environmentConfig` on the lessons table. This requires a Convex schema migration on the production database.

**Mitigation:**
- Make `environmentConfig` optional (`v.optional(v.object({...}))`) so existing lessons don't break
- Deploy schema change before deploying the UI that reads it
- Default to `"sandbox"` preset when `environmentConfig` is null
