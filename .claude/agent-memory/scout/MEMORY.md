# Scout Agent Memory

## Product Identity (mapped 2026-02-08)
- **Niotebook** = interactive CS education platform: "Watch. Code. Learn."
- Built by Akram as passion project. Invite-only alpha/beta. URL: niotebook.com
- Tagline: "Your CS lecture just became an IDE. Video + editor + AI -- one canvas, zero tab-switching."
- Course catalog: Harvard CS50 series (6 courses active), MIT/Stanford/Google/CMU coming soon
- AI assistant = "Nio", context-aware tutor (transcript + code + video time + last error)
- 7 in-browser runtimes: JS, Python, C, SQL, R, HTML, CSS
- AI providers: Gemini primary, Groq fallback, SSE streaming via `/api/nio/route.ts`
- See `product-analysis.md` for full product scout report.

## Workspace Architecture (mapped 2026-02-07)
See `workspace-architecture.md` for the full scout report.

### Quick Reference
- **Entry point**: `src/app/workspace/page.tsx` (38 LOC, server component)
- **Component tree**: AuthGate > ForceTheme("light") > AppShell > WorkspaceShell > WorkspaceGrid > [VideoPane, CodePane, AiPane]
- **Shell**: AppShell wraps LayoutPresetProvider + TopNav + main content
- **Layout modes**: single | split | triple (3 presets), default "split"
- **Pane switching**: single: V/C toggle; split: left V/C + right A/C; triple: all 3 fixed
- **Complexity hotspots**: WorkspaceGrid (592 LOC), ControlCenterDrawer (760 LOC), CodePane (511 LOC), useChatThread (581 LOC), VideoPlayer (381 LOC)

### State Management Summary
- **LayoutPresetContext** (React Context): layout preset (single/split/triple)
- **useFileSystemStore** (Zustand): VFS with IndexedDB persistence
- **useEditorStore** (Zustand): multi-tab CM6 editor state
- **useTerminalStore** (Zustand): xterm.js terminal, run/stop/clear
- **Video time**: module-level external store in WorkspaceGrid via useSyncExternalStore
- **Pane state**: module-level external store in WorkspaceGrid via useSyncExternalStore
- **localStorage keys**: niotebook.theme, niotebook.layout, niotebook.lesson, niotebook.language, niotebook.pane.{single,left,right}, niotebook:split-*

### Key Conventions
- ForceTheme("light") forces workspace to light mode
- WorkspaceShell hides workspace on mobile (`lg:hidden` breakpoint)
- Dynamic imports (next/dynamic ssr:false) for EditorArea and TerminalPanel
- Convex queries for lesson/course data via typed function references in `src/ui/content/convexContent.ts`
- Video time communicated via module-level pub/sub (not Zustand) to avoid re-renders
