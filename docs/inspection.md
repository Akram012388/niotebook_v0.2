# React & Next.js Best Practices Inspection Report

**Date:** 2026-02-01
**Scope:** Full codebase review against Vercel React Best Practices (57 rules, 8 categories)
**Codebase:** ~203 source files, ~40 test files

---

## Executive Summary

The codebase demonstrates strong fundamentals — TypeScript strict mode, good separation of concerns (domain/infra/ui), proper use of Suspense boundaries, dynamic imports for heavy components, and well-structured Zustand stores. However, there are several medium-to-critical optimization opportunities, particularly around **sequential data fetching waterfalls**, **re-render inefficiencies in the workspace**, and **missing passive event listeners**.

**Findings by severity:**
- CRITICAL: 4
- HIGH: 5
- MEDIUM: 9
- LOW: 4

---

## Category 1: Eliminating Waterfalls (CRITICAL)

### Finding 1.1 — Sequential fetches in API route (`async-parallel`)
**File:** `src/app/api/nio/route.ts:875-961`
**Severity:** CRITICAL
**Description:** The POST handler fetches transcript window, lesson meta, and subtitle fallback sequentially. `fetchTranscriptWindow` (line 883), `fetchLessonMeta` (line 919), and `fetchSubtitleWindow` (line 945) are awaited one after another when they could run in parallel via `Promise.all()` or `Promise.allSettled()`.
**Impact:** Each request adds ~50-200ms of latency to every AI chat request. With 3 sequential fetches, this could add 150-600ms.

### Finding 1.2 — Sequential Convex mutations in `useChatThread.sendMessage` (`async-parallel`)
**File:** `src/ui/chat/useChatThread.ts:277-317`
**Severity:** HIGH
**Description:** `ensureThread`, `createMessage`, and `logEvent` are called sequentially. `logEvent` is already fire-and-forget (`void logEvent(...)`) which is good, but `createMessage` could potentially be started in parallel with the SSE fetch since they're independent operations.

### Finding 1.3 — Workspace uses Suspense correctly (`async-suspense-boundaries`)
**File:** `src/app/workspace/page.tsx:24-33`
**Severity:** PASS ✓
**Description:** The workspace page wraps `WorkspaceShell` in a `Suspense` boundary with a meaningful fallback. Good pattern.

---

## Category 2: Bundle Size Optimization (CRITICAL)

### Finding 2.1 — No barrel file imports detected (`bundle-barrel-imports`)
**Severity:** PASS ✓
**Description:** All imports use direct file paths (e.g., `from "../chat/ChatComposer"`). No barrel `index.ts` re-exports found. This is the ideal pattern.

### Finding 2.2 — Dynamic imports for heavy components (`bundle-dynamic-imports`)
**File:** `src/ui/panes/CodePane.tsx:32-42`
**Severity:** PASS ✓
**Description:** `EditorArea` and `TerminalPanel` are loaded via `next/dynamic` with `ssr: false` and loading skeletons. CodeMirror and xterm.js are properly code-split.

### Finding 2.3 — YouTube API loaded lazily (`bundle-defer-third-party`)
**File:** `src/infra/youtubeApi.ts` (loaded via `loadYouTubeApi()`)
**Severity:** PASS ✓
**Description:** YouTube iframe API is loaded on-demand rather than via a script tag in layout. Good pattern.

### Finding 2.4 — Phosphor Icons imported individually (`bundle-barrel-imports`)
**Files:** `src/ui/chat/ChatComposer.tsx:3`, `src/ui/chat/ChatScroll.tsx:11`
**Severity:** MEDIUM
**Description:** Icons are imported from `@phosphor-icons/react` which is a barrel export. Should import from `@phosphor-icons/react/PaperPlaneRight` etc. to enable better tree-shaking. Phosphor Icons v2+ supports direct path imports.

### Finding 2.5 — Missing preload for workspace route (`bundle-preload`)
**Severity:** MEDIUM
**Description:** The courses page links to workspace but doesn't preload the workspace chunk on hover/focus. When a user hovers over a course card, the workspace JS could start loading to reduce perceived navigation time.

---

## Category 3: Server-Side Performance (HIGH)

### Finding 3.1 — API route authenticates properly (`server-auth-actions`)
**File:** `src/app/api/nio/route.ts:820-830`
**Severity:** PASS ✓
**Description:** The API route checks `isConvexAuthRequired()` and validates the auth header before proceeding. Production requires authentication.

### Finding 3.2 — New ConvexHttpClient created per operation (`server-cache-lru`)
**File:** `src/app/api/nio/route.ts:116-133`
**Severity:** HIGH
**Description:** `createConvexClient()` is called multiple times per request (rate limit, transcript fetch, lesson meta, persistence). Each instantiation creates a new HTTP client. Consider caching or reusing a single client instance per request.

### Finding 3.3 — `persistAssistantMessage` blocks stream completion (`server-after-nonblocking`)
**File:** `src/app/api/nio/route.ts:699-717`
**Severity:** HIGH
**Description:** After streaming completes, `persistAssistantMessage` is awaited before the stream closes. This delays the final "done" event. Since persistence is not user-facing, it should use `after()` (Next.js) or be fire-and-forget to avoid blocking the response.

---

## Category 4: Client-Side Data Fetching (MEDIUM-HIGH)

### Finding 4.1 — Chat local cache uses localStorage without schema versioning (`client-localstorage-schema`)
**File:** `src/infra/chatLocalCache.ts`
**Severity:** MEDIUM
**Description:** Cache reads/writes use a simple key prefix `niotebook.chatCache.{lessonId}` with no version field. If the `ChatCacheMessage` shape changes, stale cached data will silently fail validation and return empty arrays. Add a `version` field to the cache key or envelope.

### Finding 4.2 — Multiple `useSyncExternalStore` calls share one subscribe function (`client-event-listeners`)
**File:** `src/ui/layout/WorkspaceGrid.tsx:83-145`
**Severity:** MEDIUM
**Description:** Three `useSyncExternalStore` hooks (`singlePane`, `leftPane`, `rightPane`) share a single `subscribe` callback that attaches a `storage` event listener. Each call creates its own subscription but the listener is efficient (single registration per mount). This is acceptable but could be simplified into a single store.

### Finding 4.3 — No passive event listeners used anywhere (`client-passive-event-listeners`)
**Severity:** MEDIUM
**Description:** Grep found zero uses of `{ passive: true }` across the codebase. While scroll/wheel listeners are handled via React's `onScroll` (which React 17+ marks passive by default on scroll), any future `addEventListener` for scroll/touch should explicitly use `{ passive: true }`.

---

## Category 5: Re-render Optimization (MEDIUM)

### Finding 5.1 — `WorkspaceGrid` holds too much state, causing cascading re-renders (`rerender-derived-state`)
**File:** `src/ui/layout/WorkspaceGrid.tsx:168-177`
**Severity:** CRITICAL
**Description:** `WorkspaceGrid` owns 6 `useState` hooks: `seekRequest`, `videoDisplayTimeSec`, `threadId`, `codeHash`, `codeSnapshot`, and `isMounted`. Every video time update (every 1 second during playback) calls `setVideoDisplayTimeSec`, which re-renders the entire `WorkspaceGrid` component including all three panes (Video, Code, AI). The AI pane receives `videoTimeSec` as a prop, but the Code pane doesn't need it — yet it still re-renders. Consider:
  - Moving `videoDisplayTimeSec` into a ref and only updating it when AI pane actually needs it
  - Using `useSyncExternalStore` with a shared external store instead of prop drilling through the grid

### Finding 5.2 — `useChatThread.sendMessage` has unstable reference (`rerender-functional-setstate`)
**File:** `src/ui/chat/useChatThread.ts:263-531`
**Severity:** HIGH
**Description:** `sendMessage` depends on `mergedMessages` and `streamState` in its dependency array. Every time a new message arrives or stream state changes, `sendMessage` gets a new reference, potentially causing downstream re-renders in components that receive it as a prop. The `streamState` dependency could be eliminated by reading it from a ref inside the callback. `mergedMessages` for `buildRecentMessages` could also read from a ref.

### Finding 5.3 — `displayMessages` memo is a no-op identity wrapper (`rerender-simple-expression-in-memo`)
**File:** `src/ui/panes/AiPane.tsx:61-64`
**Severity:** LOW
**Description:** `const displayMessages = useMemo(() => messages, [messages])` — this memo does nothing; it returns the same reference. Remove it.

### Finding 5.4 — `handleSeek` in `AiPane` is a trivial wrapper (`rerender-simple-expression-in-memo`)
**File:** `src/ui/panes/AiPane.tsx:118-123`
**Severity:** LOW
**Description:** `handleSeek` wraps `onSeek?.(timestampSec)` in a `useCallback`. Since `onSeek` is already a stable callback from the parent, this wrapper could be replaced by passing `onSeek` directly.

### Finding 5.5 — `ChatComposer` auto-resize runs a DOM effect on every keystroke (`rerender-move-effect-to-event`)
**File:** `src/ui/chat/ChatComposer.tsx:26-36`
**Severity:** LOW
**Description:** The `useEffect` that adjusts textarea height fires on every `value` change. This could be moved into the `onChange` handler directly to avoid scheduling an extra effect cycle.

### Finding 5.6 — `defaultLessonId` memo depends on no reactive values (`rerender-lazy-state-init`)
**File:** `src/ui/layout/WorkspaceGrid.tsx:298-300`
**Severity:** LOW
**Description:** `useMemo(() => process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID ?? null, [])` is effectively a constant. It could be a module-level constant instead.

---

## Category 6: Rendering Performance (MEDIUM)

### Finding 6.1 — Conditional rendering uses `null` correctly (`rendering-conditional-render`)
**Severity:** PASS ✓
**Description:** Throughout the codebase, conditional rendering uses `condition ? <Component /> : null` pattern consistently rather than `condition && <Component />` which can accidentally render `0` or `""`. Good practice.

### Finding 6.2 — No `content-visibility` used for chat message lists (`rendering-content-visibility`)
**File:** `src/ui/chat/ChatScroll.tsx`
**Severity:** MEDIUM
**Description:** Chat messages are rendered in a scrollable container. For threads with many messages (50+ per the cache limit), adding `content-visibility: auto` and `contain-intrinsic-size` to message containers would skip layout/paint for off-screen messages.

### Finding 6.3 — `VideoPane` creates inline arrow functions in render (`rendering-hoist-jsx`)
**File:** `src/ui/layout/WorkspaceGrid.tsx:343-391`
**Severity:** MEDIUM
**Description:** The `headerExtras` prop passed to panes contains inline JSX with arrow function `onClick` handlers (e.g., `onClick={() => setSinglePane("video")}`). These are recreated on every render. While React handles this efficiently, the repeated JSX blocks could be extracted into memoized components for clarity and slight perf gain.

---

## Category 7: JavaScript Performance (LOW-MEDIUM)

### Finding 7.1 — Chat message merging does multiple iterations (`js-combine-iterations`)
**File:** `src/ui/chat/useChatThread.ts:195-228`
**Severity:** MEDIUM
**Description:** `mergedMessages` runs: (1) `.map()` on remote messages, (2) creates two `Set`s, (3) `.filter()` on cached messages, (4) creates another `Set`, (5) `.filter()` on local messages, (6) spreads + sorts. This could be combined into a single pass using a Map keyed by ID.

### Finding 7.2 — `storageAdapter.getItem` called on every render cycle in `WorkspaceGrid` (`js-cache-storage`)
**File:** `src/ui/layout/WorkspaceGrid.tsx:301-303`
**Severity:** MEDIUM
**Description:** `storageAdapter.getItem("niotebook.lesson")` is called during render when `isMounted` is true. This hits localStorage synchronously on every render of WorkspaceGrid (which re-renders on video time changes). Cache this value in a ref or module-level variable.

---

## Category 8: Advanced Patterns (LOW)

### Finding 8.1 — Callback refs used correctly for stable references (`advanced-event-handler-refs`)
**Files:** `src/ui/video/VideoPlayer.tsx:89-104`, `src/ui/code/CodeMirrorEditor.tsx:28-29`
**Severity:** PASS ✓
**Description:** Both VideoPlayer and CodeMirrorEditor use refs to hold the latest callback (e.g., `updateCurrentTimeRef`, `onStateChangeRef`), preventing stale closures in effects. This is the recommended pattern.

### Finding 8.2 — Runtime executor initialization uses singleton pattern (`advanced-init-once`)
**File:** `src/infra/runtime/runtimeManager.ts:16-18`
**Severity:** PASS ✓
**Description:** `executorMap` and `pendingInit` are module-level singletons with deduplication. `loadExecutor` correctly prevents concurrent initialization of the same language.

---

## Summary Table

| # | Rule | Severity | Status |
|---|------|----------|--------|
| 1.1 | `async-parallel` (API route) | CRITICAL | Sequential fetches in POST handler |
| 1.2 | `async-parallel` (chat) | HIGH | Sequential mutations in sendMessage |
| 2.4 | `bundle-barrel-imports` (icons) | MEDIUM | Phosphor imported from barrel |
| 2.5 | `bundle-preload` | MEDIUM | No preload on course → workspace nav |
| 3.2 | `server-cache-lru` | HIGH | ConvexHttpClient recreated per operation |
| 3.3 | `server-after-nonblocking` | HIGH | persistAssistantMessage blocks stream close |
| 4.1 | `client-localstorage-schema` | MEDIUM | No cache version in localStorage |
| 4.2 | `client-event-listeners` | MEDIUM | Multiple useSyncExternalStore subs |
| 4.3 | `client-passive-event-listeners` | MEDIUM | No passive listeners used |
| 5.1 | `rerender-derived-state` | CRITICAL | WorkspaceGrid video time re-renders all panes |
| 5.2 | `rerender-functional-setstate` | HIGH | sendMessage unstable reference |
| 5.3 | `rerender-simple-expression` | LOW | displayMessages no-op memo |
| 5.4 | `rerender-simple-expression` | LOW | handleSeek trivial wrapper |
| 5.5 | `rerender-move-effect-to-event` | LOW | textarea resize in effect |
| 5.6 | `rerender-lazy-state-init` | LOW | defaultLessonId could be module const |
| 6.2 | `rendering-content-visibility` | MEDIUM | No content-visibility for chat list |
| 6.3 | `rendering-hoist-jsx` | MEDIUM | Inline headerExtras JSX |
| 7.1 | `js-combine-iterations` | MEDIUM | Chat message merging multi-pass |
| 7.2 | `js-cache-storage` | MEDIUM | localStorage read on every render |

**Passing patterns (notable):**
- ✓ No barrel imports in source code
- ✓ Dynamic imports for CodeMirror, xterm, YouTube API
- ✓ Suspense boundary on workspace
- ✓ API route auth checks
- ✓ Callback refs for stable closures
- ✓ Singleton runtime initialization
- ✓ Proper conditional rendering (`? : null`)
- ✓ Zustand for client state (avoids Context re-render problems)

---

## Top 5 Recommendations (Ordered by Impact)

1. **Parallelize API route fetches** — `Promise.allSettled([fetchTranscriptWindow, fetchLessonMeta])` in the POST handler. Estimated latency reduction: 100-400ms per chat request.

2. **Fix WorkspaceGrid video time re-render cascade** — Move `videoDisplayTimeSec` to a ref or external store. Only the AiPane needs it reactively; other panes don't. This eliminates ~1 unnecessary full-tree re-render per second during playback.

3. **Make persistAssistantMessage non-blocking** — Use Next.js `after()` or fire-and-forget pattern to avoid delaying the SSE stream close.

4. **Stabilize `sendMessage` reference** — Read `mergedMessages` and `streamState` from refs inside the callback to reduce downstream re-renders.

5. **Reuse ConvexHttpClient per request** — Create one client at the start of the POST handler and pass it to all operations.
