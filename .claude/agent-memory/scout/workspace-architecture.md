# Workspace Architecture - Full Scout Report

## Overview

The workspace is the core product experience of Niotebook: a three-pane IDE that combines video lectures, a code editor, and an AI assistant in a single view. It lives at `/workspace?lessonId=...` and is protected by Clerk authentication. The layout supports three column presets (1/2/3 columns) with pane switching for flexible study workflows.

## File Map

```
src/app/workspace/
  page.tsx                          (38 LOC)  Server component entry point

src/ui/shell/
  AppShell.tsx                      (52 LOC)  LayoutPresetProvider + TopNav + main
  TopNav.tsx                        (343 LOC) Header bar: wordmark, layout toggle, drawer trigger
  ControlCenterDrawer.tsx           (785 LOC) Slide-out drawer: lecture/course picker, settings, user, feedback

src/ui/layout/
  layoutTypes.ts                    (16 LOC)  LayoutPreset type + LAYOUT_PRESETS config
  LayoutPresetContext.tsx            (127 LOC) React context + provider for layout preset state
  LayoutPresetToggle.tsx             (101 LOC) 1/2/3-col toggle button group in TopNav
  WorkspaceShell.tsx                 (21 LOC)  Desktop gate: shows WorkspaceGrid or mobile message
  WorkspaceGrid.tsx                  (592 LOC) Core orchestrator: layout modes, pane state, video time
  LayoutGrid.tsx                     (23 LOC)  CSS Grid wrapper for triple layout

src/ui/panes/
  VideoPane.tsx                      (285 LOC) Video player + header + info strip
  CodePane.tsx                       (648 LOC) Editor + terminal + language select + runtime management
  AiPane.tsx                         (177 LOC) Chat interface: messages, composer, context strip

src/ui/code/
  EditorArea.tsx                     (60 LOC)  FileTreeSidebar + TabbedEditor via SplitPane
  SplitPane.tsx                      (101 LOC) Resizable split container (vertical/horizontal)
  TabbedEditor.tsx                   (74 LOC)  Tab bar + CM6 editor view
  FileTreeSidebar.tsx                (133 LOC) VFS file tree navigation
  LanguageSelect.tsx                 (153 LOC) Language dropdown
  useEditorStore.ts                  (213 LOC) Zustand: multi-tab CM6 editor state
  codemirrorSetup.ts                 (174 LOC) CM6 base extensions and language loading
  terminal/
    TerminalPanel.tsx                (48 LOC)  TerminalToolbar + runtime frame + XTermView
    TerminalToolbar.tsx              Toolbar: run/stop/clear buttons
    XTermView.tsx                    xterm.js mount
    useTerminalStore.ts              (184 LOC) Zustand: terminal state
    commandRouter.ts                 Shell command routing
    terminalTheme.ts                 xterm color theme
    terminalPrompt.ts                Prompt string

src/ui/video/
  VideoPlayer.tsx                    (381 LOC) YouTube IFrame API wrapper
  useVideoFrame.ts                   (98 LOC)  Convex frame persistence (resume position)
  useAutoCompletion.ts               (63 LOC)  Auto-completion tracking

src/ui/chat/
  ChatComposer.tsx                   (86 LOC)  Message input form
  ChatMessage.tsx                    (91 LOC)  Single message renderer (markdown, timestamps)
  ChatScroll.tsx                     (91 LOC)  Auto-scroll container
  useChatThread.ts                   (563 LOC) SSE streaming chat hook (Gemini/Groq)

src/ui/transcript/
  useTranscriptWindow.ts             (59 LOC)  Convex query for transcript segments around current time
  convexTranscript.ts                (15 LOC)  Typed function reference

src/ui/auth/
  AuthGate.tsx                       (104 LOC) Auth guard: Clerk + Convex identity check
  AuthShell.tsx                      Loading/error shell

src/ui/
  ForceTheme.tsx                     (23 LOC)  Sets data-theme on mount, restores on unmount

src/infra/
  storageAdapter.ts                  (38 LOC)  localStorage wrapper (SSR-safe)
  vfs/useFileSystemStore.ts          (215 LOC) Zustand: virtual filesystem with IndexedDB
  runtime/runtimeManager.ts          Runtime dispatcher (JS/Python/C/HTML/CSS/SQL/R)
```

## Component Hierarchy

```
WorkspacePage (server component)
  |-- AuthGate (client) ..................... auth guard
  |     |-- RedirectToSignIn ............... if signed out
  |     |-- AuthShell ...................... if loading
  |     |-- children ....................... if authenticated
  |-- ForceTheme("light") ................. forces data-theme="light"
  |-- AppShell (client) ................... layout provider + nav
        |-- LayoutPresetProvider .......... React context
        |-- AppShellFrame
              |-- TopNav
              |     |-- Wordmark
              |     |-- LayoutPresetToggle ... 1/2/3 col buttons
              |     |-- Drawer trigger button
              |     |-- ControlCenterDrawer
              |           |-- Lectures tab (searchable list)
              |           |-- Courses tab (searchable list)
              |           |-- Settings panel (theme, share, feedback)
              |           |-- User panel (email, role, sign out)
              |-- <main>
                    |-- WorkspaceShell
                          |-- (mobile) "Best on desktop" message
                          |-- (desktop) WorkspaceGrid
                                |
                                |-- [single mode]
                                |     PaneSwitcher(V/C)
                                |     VideoPane OR CodePane
                                |
                                |-- [split mode]
                                |     Left:  PaneSwitcher(V/C) + VideoPane|CodePane
                                |     Right: PaneSwitcher(A/C) + AiPane|CodePane
                                |
                                |-- [triple mode]
                                      LayoutGrid (CSS Grid 3-col)
                                        VideoPane
                                        CodePane
                                        AiPane
```

### VideoPane subtree

```
VideoPane
  |-- header (course title, lecture label, headerExtras, "1080p" badge)
  |-- VideoPlayer (YouTube IFrame API)
  |-- info strip (lecture, source URL, license)
```

### CodePane subtree

```
CodePane
  |-- header ("Code", LanguageSelect, headerExtras)
  |-- SplitPane (vertical, 65/35 default)
        |-- first: EditorArea (dynamic import, ssr:false)
        |     |-- SplitPane (horizontal) if showFileTree
        |     |     |-- FileTreeSidebar
        |     |     |-- TabbedEditor (tab bar + CM6 view)
        |     |-- TabbedEditor (no file tree in triple layout)
        |-- second: TerminalPanel (dynamic import, ssr:false)
              |-- TerminalToolbar (run/stop/clear)
              |-- runtime frame div (#niotebook-runtime-frame)
              |-- XTermView (xterm.js)
```

### AiPane subtree

```
AiPane
  |-- header ("Assistant", headerExtras, "Live" badge)
  |-- context strip (lecture number, video time, code file info)
  |-- ChatScroll
  |     |-- ChatMessage[] (markdown rendered)
  |-- stream error display
  |-- ChatComposer (textarea + send button)
```

## Data Flow

### Lesson Selection

```
URL ?lessonId=... --> WorkspacePage (server, validates param)
  --> WorkspaceGrid reads searchParams.get("lessonId")
  --> Falls back to localStorage("niotebook.lesson") or env DEFAULT_LESSON_ID
  --> Passed as prop to VideoPane, CodePane, AiPane
```

### Video Time Flow

```
VideoPlayer.onTimeSample(sec) --> WorkspaceGrid.handleVideoTime()
  --> setVideoTime(sec) [module-level external store]
  --> useVideoDisplayTime() in AiPane --> re-renders context strip
  --> useTranscriptWindow(lessonId, videoTimeSec) --> Convex query for transcript
  --> updateFrame(sec) --> Convex mutation to persist resume position
```

### Code Execution Flow

```
CodePane.handleRun()
  --> useEditorStore.saveAll() (flush dirty editors to VFS)
  --> useFileSystemStore.getMainFileContent()
  --> runRuntime(language, { code, vfs, onStdout, onStderr })
  --> useTerminalStore.write() (stream output to xterm)
  --> useTerminalStore.setLastRunError() (error context for AI)
```

### AI Chat Flow

```
User types in ChatComposer --> AiPane.handleSend(content)
  --> sendMessage(content, context) where context includes:
      - videoTimeSec (from useVideoDisplayTime)
      - transcript (from useTranscriptWindow)
      - code snapshot (from CodePane.onSnapshot)
      - lesson metadata
      - lastRunError (from useTerminalStore)
  --> useChatThread SSE stream to /api/nio/chat
  --> ChatMessage renders streamed responses
```

### Code Snapshot Flow

```
CodePane watches VFS main file changes (reactive via files array)
  --> onSnapshot({ language, code, codeHash, fileName })
  --> WorkspaceGrid stores codeSnapshot + codeHash in state
  --> Passed to AiPane as prop for context
  --> Passed to VideoPane for frame persistence context
```

## State Management

### React Context

| Context             | Provider             | Location | Consumers                                   |
| ------------------- | -------------------- | -------- | ------------------------------------------- |
| LayoutPresetContext | LayoutPresetProvider | AppShell | WorkspaceGrid, CodePane, LayoutPresetToggle |

### Zustand Stores

| Store              | Location                             | Purpose                          | Consumers                          |
| ------------------ | ------------------------------------ | -------------------------------- | ---------------------------------- |
| useFileSystemStore | infra/vfs/useFileSystemStore.ts      | VFS tree + IndexedDB persistence | CodePane, useEditorStore           |
| useEditorStore     | ui/code/useEditorStore.ts            | Multi-tab CM6 editor state       | CodePane, EditorArea, TabbedEditor |
| useTerminalStore   | ui/code/terminal/useTerminalStore.ts | xterm.js terminal + run state    | CodePane, AiPane, TerminalPanel    |

### Module-Level External Stores (useSyncExternalStore)

| Store       | Location                              | Purpose                                   |
| ----------- | ------------------------------------- | ----------------------------------------- |
| videoTime   | WorkspaceGrid.tsx (lines 28-62)       | Video playback time, subscribed by AiPane |
| paneState   | WorkspaceGrid.tsx (lines 123-179)     | single/left/right pane selection          |
| presetState | LayoutPresetContext.tsx (lines 24-48) | Layout preset with localStorage           |

### localStorage Keys

| Key                           | Used By                          | Purpose                             |
| ----------------------------- | -------------------------------- | ----------------------------------- |
| niotebook.theme               | TopNav, root layout, ThemeToggle | Theme preference                    |
| niotebook.layout              | LayoutPresetContext              | Layout preset (single/split/triple) |
| niotebook.lesson              | TopNav, WorkspaceGrid            | Last selected lesson ID             |
| niotebook.language            | CodePane                         | Last selected language              |
| niotebook.pane.single         | WorkspaceGrid                    | Single-mode pane (video/code)       |
| niotebook.pane.left           | WorkspaceGrid                    | Split-mode left pane                |
| niotebook.pane.right          | WorkspaceGrid                    | Split-mode right pane               |
| niotebook:split-editor-output | SplitPane                        | Editor/terminal split position      |
| niotebook:split-file-tree:\*  | SplitPane                        | File tree split position per layout |

## Theme Handling

1. **Root layout** (`src/app/layout.tsx` line 76-78): Inline script reads `niotebook.theme` from localStorage, falls back to `prefers-color-scheme`, sets `data-theme` attribute on `<html>`.
2. **ForceTheme** (`src/ui/ForceTheme.tsx`): Workspace page forces `data-theme="light"`. On unmount, restores previous theme.
3. **TopNav** (`src/ui/shell/TopNav.tsx`): Maintains theme state, toggles via ControlCenterDrawer settings panel. Writes to both `data-theme` attribute and localStorage.
4. **Conflict note**: ForceTheme forces light, but TopNav also sets theme. The ControlCenterDrawer theme toggle in workspace actually sets the attribute directly, which ForceTheme's cleanup will override on unmount.

## Convex Queries Used in Workspace

| Query                          | Used By                       | Purpose                        |
| ------------------------------ | ----------------------------- | ------------------------------ |
| content:getCourses             | TopNav, VideoPane             | List available courses         |
| content:getLesson              | TopNav, VideoPane, AiPane     | Single lesson details          |
| content:getLessonsByCourse     | TopNav                        | Lessons for course picker      |
| resume:getLatestFrame          | useVideoFrame (VideoPane)     | Resume video position          |
| transcript:getTranscriptWindow | useTranscriptWindow (AiPane)  | Transcript around current time |
| events:logEvent                | CodePane, ControlCenterDrawer | Analytics events               |
| feedback:submit                | ControlCenterDrawer           | User feedback                  |
| me:get                         | TopNav (via meRef)            | User role/invite info          |

## Keyboard Shortcuts (WorkspaceGrid)

| Key | Action                              |
| --- | ----------------------------------- |
| 1   | Switch to single layout             |
| 2   | Switch to split layout              |
| 3   | Switch to triple layout             |
| V   | Show video pane (single/split left) |
| C   | Show code pane (context-dependent)  |
| A   | Show assistant pane (split right)   |

## Risk Assessment

### Complexity Hotspots

- **ControlCenterDrawer** (785 LOC): Monolithic component with 6+ internal state variables, handles lectures, courses, settings, feedback, user panel, share. Strong candidate for decomposition.
- **CodePane** (648 LOC): Runtime lifecycle, VFS initialization, snapshot reporting, language switching.
- **WorkspaceGrid** (592 LOC): Orchestrates all layout modes, pane state, video time, keyboard shortcuts, lesson routing. Does too many things.
- **useChatThread** (563 LOC): SSE streaming, message management, error handling, Convex integration all in one hook.

### Tight Coupling

- **WorkspaceGrid <-> AiPane**: Video time communicated via module-level store exported from WorkspaceGrid, imported by AiPane. Circular module concern.
- **CodePane <-> useFileSystemStore <-> useEditorStore**: Three-way dependency for code editing. Editor reads from VFS on open, writes back on save. CodePane coordinates both.
- **TopNav <-> ControlCenterDrawer**: TopNav manages all drawer state and passes 15+ props.

### Architecture Observations

- No workspace-level layout.tsx -- workspace is a single page.tsx under `src/app/workspace/`, not a route group with shared layout.
- ForceTheme("light") means workspace is always light-mode regardless of user preference. Theme toggle in ControlCenterDrawer is misleading in workspace context.
- Mobile users see a dead-end "best on desktop" message with no fallback.
- PaneSwitcher is defined inline in WorkspaceGrid, not extracted to its own file.
- Three different state patterns in one tree: React Context (layout preset), Zustand stores (VFS, editor, terminal), and module-level pub/sub (video time, pane state).
