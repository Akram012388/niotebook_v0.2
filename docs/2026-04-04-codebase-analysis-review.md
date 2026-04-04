# Niotebook v0.2 — External Codebase Analysis & Review

**Date**: 2026-04-04
**Reviewer posture**: Senior external engineer, adversarial production-readiness assessment
**Scope**: Full repository — source (`src/`), backend (`convex/`), tests (`tests/`), CI/CD, configuration, documentation

---

## Table of Contents

1. [Project Summary & Metrics](#1-project-summary--metrics)
2. [Architecture Overview](#2-architecture-overview)
3. [Critical Findings](#3-critical-findings)
4. [High-Severity Findings](#4-high-severity-findings)
5. [Medium-Severity Findings](#5-medium-severity-findings)
6. [Low-Severity Findings](#6-low-severity-findings)
7. [Positive Observations](#7-positive-observations)
8. [Scorecard](#8-scorecard)
9. [Prioritized Recommendations](#9-prioritized-recommendations)

---

## 1. Project Summary & Metrics

**Niotebook** is an AI-native programming learning interface that synchronizes Video + Code + AI in a single canvas. Users watch CS lecture videos (Harvard CS50 family), write code alongside them, and ask an AI teaching assistant ("Nio") context-aware questions grounded in the lecture transcript and code state.

### Quantitative Profile

| Metric                                      | Value                |
| ------------------------------------------- | -------------------- |
| Source files (`src/`)                       | 225 files            |
| Source lines (`src/`)                       | ~27,500 LOC          |
| Convex backend files (excl. generated)      | 21 files, ~3,860 LOC |
| Test files                                  | 60 files, ~8,080 LOC |
| Total TypeScript LOC (src + convex + tests) | ~39,400 LOC          |
| Total commits                               | 976                  |
| Local git branches                          | 108                  |
| Production dependencies                     | 36                   |
| Dev dependencies                            | 19                   |
| `node_modules` size                         | 1.2 GB               |
| `"use client"` directives                   | 97 files             |
| `useEffect` calls (UI layer)                | 111                  |
| `useState` calls (UI layer)                 | 117                  |
| `useCallback` calls (UI layer)              | 151                  |
| `useRef` calls (UI layer)                   | 112                  |
| `useMemo` calls (UI layer)                  | 70                   |
| `console.log/warn/error` in src/            | 74                   |
| `console.log/warn/error` in convex/         | 13                   |
| `.collect()` calls in convex/               | 37                   |
| `as unknown as` casts in convex/            | 30                   |
| `as unknown as` casts in src/               | 5                    |
| Empty `catch {}` blocks in src/             | 34                   |
| `TODO`/`FIXME` comments                     | 6                    |

### Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19.2.4, Turbopack)
- **Language**: TypeScript 5, strict mode
- **Styling**: Tailwind CSS 4, 716-line globals.css design token system
- **Backend**: Convex 1.31.4 (serverless)
- **Auth**: Clerk 7.0.4
- **State**: Zustand 5 (client), Convex React hooks (remote)
- **Editor**: CodeMirror 6 (7 language modes)
- **Terminal**: xterm.js v6
- **Runtimes**: Pyodide 0.27 (Python WASM), JSCPP 2.0.9 (C), sql.js 1.13 (SQL WASM), WebR 0.5.8 (R WASM)
- **AI**: SSE streaming to Gemini, OpenAI, Anthropic (BYOK model)
- **Monitoring**: Sentry (client + server + edge configs)
- **Package manager**: Bun 1.1.19

### Largest Source Files

| File                      | LOC | Role                            |
| ------------------------- | --- | ------------------------------- |
| `ControlCenterDrawer.tsx` | 795 | Settings/share/feedback drawer  |
| `(landing)/info/page.tsx` | 672 | Info page                       |
| `useChatThread.ts`        | 593 | SSE streaming + message merging |
| `WorkspaceGrid.tsx`       | 587 | Layout orchestration            |
| `api/nio/route.ts`        | 579 | AI chat API endpoint            |
| `VirtualFS.ts`            | 422 | Virtual filesystem              |
| `wasmerShell.ts`          | 417 | Wasmer WASM shell               |
| `AiPane.tsx`              | 415 | AI chat pane                    |
| `CodePane.tsx`            | 413 | Code editor pane                |
| `NiotepadPanel.tsx`       | 408 | Floating notepad                |
| `events.ts` (domain)      | 387 | Event system + validators       |
| `VideoPlayer.tsx`         | 381 | YouTube player                  |
| `byokStream.ts`           | 379 | BYOK AI streaming               |
| `VideoPane.tsx`           | 371 | Video pane                      |
| `TopNav.tsx`              | 358 | Top navigation                  |

---

## 2. Architecture Overview

### 2.1 Layer Structure

The codebase follows a 3-layer architecture with a separate backend:

```
src/domain/     — Pure business logic, types, validation (19 files, ~2,400 LOC)
src/infra/      — Infrastructure: VFS, runtime, AI, cache, auth (~45 files)
src/ui/         — React components, all client-side (16 feature dirs, ~16,500 LOC)
src/app/        — Next.js routes and API endpoints
convex/         — Convex backend functions + schema
```

**Domain layer** is genuinely pure: no React, no browser APIs, no side effects. ESLint enforces that `src/domain/` cannot import from `src/infra/`. Branded phantom types (`DomainId<T>`) provide type-safe IDs. Error hierarchy (`NioError` → `AuthError`, `RateLimitError`, `ValidationError`) carries structured error codes.

**Infrastructure layer** handles:

- Virtual filesystem (in-memory tree + IndexedDB persistence)
- Multi-language code execution (JS, Python, C, SQL, R, HTML, CSS)
- AI provider streaming (Gemini, OpenAI, Anthropic)
- Niotepad (floating note-taking panel with IndexedDB persistence)
- Local storage caching (chat, transcript windows)
- Auth token management

**UI layer** is organized by feature with Zustand stores for client state and Convex React hooks for remote state.

### 2.2 Data Flow: AI Chat

1. User types message in `ChatComposer`
2. `useChatThread` hook builds payload with video time, transcript window, code snapshot, recent messages
3. `POST /api/nio` validates, authenticates, rate-limits
4. Server neutralizes prompt injection patterns
5. Server resolves transcript via 3-layer fallback: client → Convex DB → SRT subtitle → YouTube API
6. Context builder assembles messages within 12KB char budget (progressive degradation)
7. Server decrypts user's BYOK API key from Convex
8. Streams tokens via provider-specific SSE
9. Client renders tokens via `StreamingText` component (bypasses React state for perf)
10. On completion, server persists assistant message (fire-and-forget with 1 retry)

### 2.3 Data Flow: Code Execution

1. User writes code in CodeMirror editor
2. Code saved to VFS (in-memory) with debounced IndexedDB persistence
3. On run, `runtimeManager` routes to per-language executor:
   - **JS**: Same-origin sandboxed iframe via blob URL + `new Function()`
   - **Python**: Pyodide WASM in main thread (SharedArrayBuffer interrupt)
   - **C**: JSCPP in dedicated Web Worker (5s timeout, `worker.terminate()`)
   - **SQL**: sql.js WASM with auto-seeding from VFS seed files
   - **R**: WebR WASM with CDN fallback
   - **HTML/CSS**: Sandboxed iframe rendering
4. Output streamed to xterm.js terminal via callbacks

### 2.4 Convex Schema

14 tables: `courses`, `lessons`, `chapters`, `transcriptSegments`, `users`, `userApiKeys`, `frames`, `lessonCompletions`, `codeSnapshots`, `chatThreads`, `chatMessages`, `events`, `feedback`, `rateLimits`.

User API keys are AES-256-GCM encrypted (per-key IV, SHA-256 derived key from shared secret). Decryption happens in Convex actions only at request time.

### 2.5 CI/CD Pipeline

- **ci.yml**: lint → format check → `check:any` → `check:unknown` → typecheck → test → build + bundle report
- **e2e.yml**: Playwright E2E (desktop 1280×800 + mobile 375×667)
- **semgrep.yml**: Security scanning
- **claude-code-review.yml**: AI-assisted PR review
- **\_refresh-convex.yml**: Reusable data refresh workflow
- **Lefthook pre-commit**: lint + typecheck + format check (parallel)

---

## 3. Critical Findings

### 3.1 Type Safety Undermined by 30+ `as unknown as` Casts in Convex Backend

**Severity**: CRITICAL
**Location**: `convex/analytics.ts` (14 casts), `convex/resume.ts` (10 casts), `convex/lessonCompletions.ts` (4 casts), `convex/rateLimits.ts` (1 cast), `convex/idUtils.ts` (2 casts)

The project runs `check:any` in CI to forbid `any` in `convex/` and `tests/`. However, the backend contains **30 `as unknown as` double-casts** — the most dangerous TypeScript pattern, which is functionally equivalent to `any` while evading the linter.

**Pattern in `analytics.ts`**:

```typescript
const events = (await ctx.db
  .query("events")
  .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
  .collect()) as unknown as EventRow[];
```

Every analytics query casts Convex documents to hand-written local types (`EventRow`, `UserRow`, `LessonRow`, `CourseRow`) that shadow the generated Convex types. If the schema evolves and a field is renamed or its type changes, these local types silently diverge — the compiler cannot catch the mismatch.

**Pattern in `resume.ts`**:

```typescript
const key = frame.lessonId as unknown as string;
```

This defeats the branded ID system (`DomainId<T>`) the domain layer carefully built. Branded IDs exist precisely to prevent `LessonId` from being used where `CourseId` is expected — but `as unknown as string` erases the brand entirely.

**Pattern in `rateLimits.ts`, `resume.ts`, `lessonCompletions.ts`**:

```typescript
const typedQuery = query as unknown as IndexRangeBuilder<...>;
```

Multiple Convex index query builders are double-cast because the SDK's types don't align with the actual usage. Rather than fixing the SDK integration or filing an upstream issue, the casts silently bypass the type system.

**Impact**: The `check:any` CI check creates a false sense of type safety. The real type unsafety is hidden behind `as unknown`, which is arguably worse because it's harder to grep for and audit.

---

### 3.2 Test Coverage Is Dangerously Uneven — 23 Critical Files Have Zero Tests

**Severity**: CRITICAL
**Location**: See table below

The `vitest.config.ts` sets a 70% line coverage threshold, which the project passes. However, this metric hides the fact that the **highest-complexity, highest-risk files are completely untested**.

#### Files With Zero Test Coverage

| File                           | LOC  | Risk Level   | What It Does                                                                   |
| ------------------------------ | ---- | ------------ | ------------------------------------------------------------------------------ |
| `useChatThread.ts`             | 593  | 🔴 Very High | SSE streaming, message merging, stuck-stream recovery, localStorage cache sync |
| `jsSandbox.ts`                 | 156  | 🔴 Very High | User code execution via `new Function()` in iframe                             |
| `htmlExecutor.ts`              | 105  | 🔴 High      | Renders user HTML in iframe, resolves VFS assets                               |
| `sqlExecutor.ts`               | 243  | 🔴 High      | WASM SQLite, auto-seeding, per-lesson state, SQL splitting                     |
| `rExecutor.ts`                 | ~300 | 🟡 High      | WebR WASM with CDN fallback and timeout management                             |
| `anthropicStream.ts`           | 104  | 🔴 High      | Production AI provider (Anthropic/Claude)                                      |
| `openaiStream.ts`              | 101  | 🔴 High      | Production AI provider (OpenAI/GPT)                                            |
| `transcriptResolver.ts`        | —    | 🟡 High      | Server-side Convex data resolution for AI context                              |
| `youtubeTranscriptFallback.ts` | —    | 🟡 Medium    | YouTube transcript API fallback                                                |
| `indexedDbBackend.ts`          | —    | 🟡 Medium    | VFS persistence layer                                                          |
| `indexedDbNiotepad.ts`         | —    | 🟡 Medium    | Niotepad persistence layer                                                     |
| `downloadFile.ts`              | —    | 🟢 Low       | File download helper                                                           |
| `chatLocalCache.ts`            | —    | 🟡 Medium    | Chat localStorage persistence                                                  |
| `WorkspaceGrid.tsx`            | 587  | 🟡 High      | Layout orchestration, keyboard shortcuts, state sync                           |
| `ControlCenterDrawer.tsx`      | 795  | 🟡 Medium    | Largest component — settings, sharing, feedback                                |
| `AiPane.tsx`                   | 415  | 🟡 High      | Core user-facing AI chat pane                                                  |
| `CodePane.tsx`                 | 413  | 🟡 High      | Core user-facing code editor pane                                              |
| `VideoPane.tsx`                | 371  | 🟡 Medium    | Video player integration                                                       |
| `VideoPlayer.tsx`              | 381  | 🟡 Medium    | YouTube IFrame API wrapper                                                     |
| `CodeMirrorEditor.tsx`         | —    | 🟡 Medium    | Editor core                                                                    |
| `TabbedEditor.tsx`             | —    | 🟡 Medium    | Multi-file tab management                                                      |
| `NiotepadPanel.tsx`            | 408  | 🟡 Medium    | Floating notepad UI                                                            |

**Contrast with tested files**: `geminiStream.ts` has a 262-line test, but the structurally identical `openaiStream.ts` and `anthropicStream.ts` have zero. The C executor has a 291-line test, but the SQL executor (which has more complex state: seeding, per-lesson reset, statement splitting) has zero.

The coverage threshold passes because well-tested domain logic (events, chat, content selectors, niotepad types, context builder) and a few well-tested infra modules (VFS, C executor, Gemini stream) inflate the aggregate. The critical user-facing paths remain unexercised.

---

## 4. High-Severity Findings

### 4.1 JavaScript Sandbox Provides Weak Isolation

**Severity**: HIGH
**Location**: `src/infra/runtime/jsSandbox.ts`, `src/infra/runtime/imports/jsModules.ts`

The JS executor runs user-supplied code in a same-origin sandboxed iframe:

```typescript
// jsSandbox.ts — iframe creation
iframe.setAttribute("sandbox", "allow-scripts");
```

```typescript
// SANDBOX_HTML — inside the iframe
var fn = new Function(code);
var result = fn();
```

```typescript
// jsModules.ts — VFS file execution
new Function("module", "exports", "require", __vfs_files[found])(
  module,
  exports,
  require,
);
```

**Security concerns**:

1. **Same-origin execution**: The sandbox iframe runs on the same origin as the main application. While the `sandbox` attribute restricts capabilities, `allow-scripts` grants full JavaScript execution within the iframe context.

2. **Wildcard `postMessage`**: All messages between parent and iframe use `"*"` as the target origin:

   ```typescript
   parent.postMessage({ type: "stdout", data: line }, "*");
   // and
   iframe.contentWindow?.postMessage(
     { type: "exec", code, externalModules },
     "*",
   );
   ```

   Any window on the page can receive these messages. The parent-side handler checks `event.source !== iframe.contentWindow` but the iframe-side handler does no origin checking.

3. **`new Function()` with no CSP restriction**: The `new Function(code)` call inside the iframe executes arbitrary user-provided code. Since the CSP requires `unsafe-eval` for Pyodide, this cannot be tightened.

4. **VFS file execution**: `jsModules.ts` executes arbitrary VFS file content via `new Function("module", "exports", "require", __vfs_files[found])` — no sanitization, no content validation.

5. **The file itself acknowledges the weakness** (line 10-12):
   ```
   TODO: For stronger isolation, migrate to a Web Worker or a dedicated
   sandboxed iframe served from a different origin.
   ```

**Comparison**: The C executor correctly runs in a Web Worker (`cExecutorWorker.ts`), providing real thread isolation. The Python executor runs in Pyodide WASM with `SharedArrayBuffer` interrupt capability. The JS executor has the weakest isolation of all runtimes despite being the most commonly used language in CS50W courses.

---

### 4.2 Extensive Module-Level Mutable State Creates Hidden Coupling

**Severity**: HIGH
**Location**: Multiple files across `src/infra/runtime/`, `src/infra/vfs/`, `src/ui/layout/`

The codebase relies heavily on module-level `let` variables for singleton state:

| File                    | Module-Level Mutables                                                                                                                 | Purpose                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `pythonExecutor.ts`     | `pyodidePromise`, `installedPackages` (Set), `interruptBuffer`                                                                        | Pyodide singleton + package cache   |
| `sqlExecutor.ts`        | `sqlJsPromise`, `db`, `seeded`, `currentLessonId`                                                                                     | SQLite DB singleton + seeding state |
| `rExecutor.ts`          | `webrPromise`                                                                                                                         | WebR singleton                      |
| `runtimeManager.ts`     | `executorMap` (Partial<Record>), `pendingInit` (Partial<Record>), `sandboxEnabled`                                                    | Executor registry + init dedup      |
| `useFileSystemStore.ts` | `autoPersistTimer`, `currentLessonId`                                                                                                 | Auto-persist debounce state         |
| `WasmerBridge.ts`       | `bridgeInstance`                                                                                                                      | Wasmer singleton                    |
| `wasmerShell.ts`        | `backend`, `wasmerReady`, `pyodideInstance`                                                                                           | Wasmer runtime state                |
| `WorkspaceGrid.tsx`     | `videoTimeListeners` (Set), `videoTimeSnapshot`, `paneListeners` (Set), `singlePaneSnapshot`, `leftPaneSnapshot`, `rightPaneSnapshot` | Video time pub-sub + pane state     |

**Consequences**:

1. **HMR state loss**: During development with Turbopack, hot module replacement re-executes modules, resetting all `let` state. This can cause subtle bugs: a running Python executor loses its interrupt buffer, a SQL session loses its seeded state, pane preferences reset.

2. **Test isolation**: Module-level singletons persist across test runs in the same Vitest process. The existing tests work around this by mocking at the import level, but the pattern is fragile — stale state from one test can silently affect another.

3. **Race conditions in `sqlExecutor.ts`**: The module stores `db`, `seeded`, and `currentLessonId` at module scope. During a lesson switch, if a run is in-flight from the old lesson when `currentLessonId` changes, the `seeded` flag and `db` reference can be in an inconsistent state. The lesson-change reset (`db.close()` + `db = null` + `seeded = false`) happens synchronously inside `run()`, but if two `run()` calls overlap (possible via rapid re-execution), the second call may see a null `db` in an unexpected state.

4. **The `WorkspaceGrid.tsx` video time pub-sub** reimplements what Zustand already provides — a module-level `Set<() => void>` + `let number` + manual `notifyVideoTime()` — but outside the Zustand store graph. This makes it invisible to React DevTools and Zustand devtools, complicating debugging.

---

### 4.3 Convex `.collect()` Calls Will Not Scale

**Severity**: HIGH
**Location**: Primarily `convex/analytics.ts` (14 calls), `convex/content.ts`, `convex/resume.ts`, `convex/users.ts`, `convex/feedback.ts`, `convex/ingest.ts`

The Convex backend has **37 `.collect()` calls**, many loading entire tables into memory:

**Worst offenders in `analytics.ts`**:

```typescript
// getContentOverview — loads FOUR full tables in one handler
const courses = await ctx.db.query("courses").collect();
const lessons = await ctx.db.query("lessons").collect();
const completions = await ctx.db.query("lessonCompletions").collect();
const events = await ctx.db
  .query("events")
  .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
  .collect();
```

```typescript
// getTotalLessons — full table scan just to count
const lessons = await ctx.db.query("lessons").collect();
return lessons.length;
```

```typescript
// getUserGrowth — loads all users to filter by creation time
const users = await ctx.db.query("users").collect();
```

```typescript
// getTopLessons — loads all events in 90-day window, then aggregates in-memory
const events = await ctx.db
  .query("events")
  .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
  .collect();
```

**Other unbounded collects**:

- `users.ts: listAll` — collects all users
- `feedback.ts` — `ctx.db.query("feedback").order("desc").collect()` (no pagination)
- `content.ts: listLessons` — conditionally collects all lessons

**Impact at scale**:

Convex functions have memory and execution time limits. With the CS50 course catalog (~200 lessons), current data volumes are manageable. But with:

- 10K+ users: `getUserGrowth` scans all user records
- 100K+ events: `getDailyActiveUsersSeries` loads 90 days of events into memory
- 1M+ transcript segments: `ingest.ts` operations become prohibitively expensive

The 90-day time window on analytics queries is a partial mitigation, but it still produces unbounded result sets for active platforms.

---

### 4.4 Inconsistent Error Handling Between Domain and Backend

**Severity**: HIGH
**Location**: `convex/*.ts` (20+ raw `throw new Error()` calls), `src/domain/errors.ts`

The domain layer defines a structured error hierarchy:

```typescript
// src/domain/errors.ts
class NioError extends Error { readonly code: NioErrorCode; }
class AuthError extends NioError { ... }     // code: "AUTH_REQUIRED"
class RateLimitError extends NioError { ... } // code: "RATE_LIMITED"
class ValidationError extends NioError { ... } // code: "VALIDATION_ERROR"
```

The API route (`api/nio/route.ts`) correctly uses these errors and returns structured JSON responses with error codes.

**But the Convex backend ignores the domain error system entirely**, using raw `throw new Error()` with unstructured message strings:

```typescript
// convex/chat.ts
throw new Error("Chat thread not accessible.");

// convex/userApiKeys.ts
throw new Error("Not authenticated.");
throw new Error("API key cannot be empty.");
throw new Error("NIOTEBOOK_KEY_ENCRYPTION_SECRET is not configured");
throw new Error("User record not found.");
throw new Error(`No saved key for provider: ${args.provider}`);

// convex/users.ts
throw new Error("Not authenticated.");
```

Only `convex/events.ts` uses `ConvexError` (1 occurrence out of 20+ error throws).

**Consequences**:

- Client-side code must string-match error messages to determine what went wrong
- Error messages are not translatable
- No structured error codes for programmatic handling
- Inconsistent with the project's own domain architecture

---

## 5. Medium-Severity Findings

### 5.1 The 795-LOC ControlCenterDrawer Is a God Component

**Severity**: MEDIUM
**Location**: `src/ui/shell/ControlCenterDrawer.tsx` (795 LOC)

This single component handles:

- Settings drawer open/close animation
- Course/lesson navigation (dropdown selectors, lesson list)
- API key management (delegates to `ApiKeySettings` but orchestrates state)
- Share functionality (copy link, social sharing to Twitter/LinkedIn/Facebook)
- Feedback form (star rating, text input, submission to Convex)
- User profile display (email, role, sign-out)
- Multiple internal "routes" (`SettingsRoute` type: "share" | "feedback" | "api-keys" | "user")

It imports from 6+ domain and infra modules. It has **zero tests**. Any change to sharing, feedback, navigation, or settings risks breaking the other features.

This should be decomposed into:

- `ControlCenterDrawer` (shell + route switching)
- `SharePanel`
- `FeedbackPanel`
- `NavigationPanel`
- `UserPanel`

---

### 5.2 Almost No Server-Side Rendering — 97 `"use client"` Files

**Severity**: MEDIUM
**Location**: Project-wide

97 of 225 source files (43%) are marked `"use client"`. The Next.js App Router pages are thin server-component wrappers that immediately delegate to client components:

```typescript
// src/app/courses/page.tsx — server component
export default function CoursesRoute() {
  return <AuthGate><CoursesPage /></AuthGate>;
}
// CoursesPage is "use client" — all rendering is client-side
```

```typescript
// src/app/workspace/page.tsx — server component
export default async function WorkspacePage({ searchParams }) {
  return <AuthGate><AppShell><Suspense><WorkspaceShell /></Suspense></AppShell></AuthGate>;
}
// WorkspaceShell is "use client"
```

All admin pages (`admin/page.tsx`, `admin/analytics/page.tsx`, etc.) are `"use client"`.

**Impact**:

- No meaningful server-side rendering of application content
- Full CodeMirror (6 packages), xterm.js (3 packages), Framer Motion, react-markdown, recharts — all shipped to the client
- `optimizePackageImports` in `next.config.ts` only covers `@phosphor-icons/react`, `framer-motion`, `recharts` — CodeMirror and xterm are not tree-shaken at the import level
- Initial page load is heavier than necessary; SEO for course content is limited

---

### 5.3 AI Provider Implementations Are Copy-Paste with Uneven Test Coverage

**Severity**: MEDIUM
**Location**: `src/infra/ai/geminiStream.ts`, `src/infra/ai/openaiStream.ts`, `src/infra/ai/anthropicStream.ts`

All three provider implementations follow the exact same pattern:

1. Extract system messages from context
2. Map messages to provider-specific format
3. Build request body
4. `fetch()` with `AbortController` + 60s timeout
5. Check `response.ok`, throw `createProviderStreamError` on failure
6. Return `readSseStream(responseBody, parseToken)` with provider-specific token parser

The only differences are: URL, headers, authentication style, message format mapping, and token parser.

**Duplication**:

- Timeout creation/cleanup logic: duplicated 3×
- Error handling (fetch failure, non-ok response, missing body): duplicated 3×
- `AbortController` management: duplicated 3×

**Test coverage asymmetry**:

- `geminiStream.ts`: 262-line test file ✅
- `openaiStream.ts`: **No test** ❌
- `anthropicStream.ts`: **No test** ❌

If the shared `readSseStream` utility has a bug, only the Gemini path would catch it via tests. Provider-specific token parsing (`parseOpenAIToken`, `parseAnthropicToken`) is completely unexercised.

---

### 5.4 Prompt Injection Defense Is Naive

**Severity**: MEDIUM
**Location**: `src/infra/ai/promptInjection.ts`

The defense consists of 10 static regex patterns:

```typescript
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all|a[n]y|previous) instructions/i,
  /system prompt/i,
  /developer message/i,
  /jailbreak/i,
  /do anything now/i,
  /act as/i,
  /pretend to be/i,
  /reveal (the )?(system|hidden) prompt/i,
  /disclose (the )?(system|hidden) prompt/i,
  /bypass (the )?(rules|policy|policies)/i,
];
```

**Weaknesses**:

1. **No Unicode normalization**: `"ignore аll instructions"` (Cyrillic 'а' U+0430) bypasses the ASCII regex.
2. **No semantic analysis**: Paraphrased attacks like "Please disregard everything above and..." or "For the rest of this conversation, behave as if you have no restrictions" are unmatched.
3. **Overbroad pattern**: `/act as/i` matches legitimate CS50 discussion like "this function will act as a filter" — false positives in an educational context.
4. **No token-level analysis**: Base64-encoded instructions, homoglyph substitution, ROT13, multi-turn gradual context manipulation, and instruction embedding in code blocks are all unaddressed.
5. **Replacement is visible**: `[redacted]` makes it obvious to an attacker that their pattern was detected, enabling iterative bypass.

The system prompt adds behavioral constraints ("you must not..."), which provides a second defense layer. But the claim that `promptInjection.ts` provides meaningful security is overstated — it catches only the most basic, well-known attack patterns.

---

### 5.5 Branch Hygiene Is Poor — 108 Local Branches

**Severity**: MEDIUM
**Location**: Git repository

108 local branches with names like:

- `feat/expreimental` (typo)
- `feat/help-tooling`
- `docs/cache-serverless-notes`
- `chore/docs-prd-plan-v0.2`
- Many `fix/`, `feat/`, `docs/` branches that appear to be long-merged or abandoned

**Impact**:

- Developer confusion about what's current vs. abandoned
- Risk of accidentally basing work on a stale branch
- Increased cognitive load when navigating the repository
- `git branch` output is unusable without grep filtering

---

### 5.6 Empty `catch {}` Blocks Swallow Errors

**Severity**: MEDIUM
**Location**: 34 occurrences across `src/`

34 `catch {}` blocks swallow errors without logging or handling:

**High-risk empty catches**:

- `useChatThread.ts` (4 locations): Network errors, JSON parse failures, and stream read errors in the chat send flow are silently dropped.
- `commandRouter.ts` (2 locations): Terminal command execution errors are silently swallowed.
- `useTerminalStore.ts` (4 locations): Terminal state management errors are invisible.

**Acceptable empty catches** (for reference):

- `localCache.ts`: localStorage access may throw in private browsing — swallowing is intentional.
- `useSplitPane.ts`: localStorage read failures are non-critical.

Some catches should at minimum log to `console.error` or Sentry; the high-risk ones in `useChatThread.ts` should surface errors to the user.

---

## 6. Low-Severity Findings

### 6.1 Fire-and-Forget Message Persistence

**Severity**: LOW
**Location**: `src/infra/ai/byokStream.ts` (lines 356-370)

Assistant messages are persisted via a fire-and-forget pattern:

```typescript
void (async () => {
  try {
    await persistAssistantMessage(persistArgs);
  } catch (err) {
    console.error("[nio/chat] persistAssistantMessage failed, retrying in 2s", { ... });
    await sleep(2000);
    try {
      await persistAssistantMessage(persistArgs);
    } catch (retryErr) {
      console.error("[nio/chat] persistAssistantMessage retry failed", { ... });
    }
  }
})();
```

If Convex is unavailable for more than 2 seconds, the message is lost server-side. The client has the message in localStorage cache, but the cache is bounded and eventually rotates. Thread history becomes inconsistent — the user sees the message, but reloading the page loses it.

---

### 6.2 `postMessage("*")` Wildcard Origin in Sandbox

**Severity**: LOW
**Location**: `src/infra/runtime/jsSandbox.ts` (9 occurrences)

All `postMessage` calls between the parent page and the JS sandbox iframe use `"*"` as the target origin:

```typescript
parent.postMessage({ type: "stdout", data: line }, "*");
```

On a page with multiple iframes (HTML executor + JS sandbox + editor sandbox), any iframe could receive messages intended for another. The parent-side handler checks `event.source !== iframe.contentWindow`, which mitigates cross-iframe message confusion, but the iframe-side code in `SANDBOX_HTML` performs no origin checking on incoming messages — it only checks `e.data.type !== "exec"`.

---

### 6.3 1.2GB node_modules for 36 Dependencies

**Severity**: LOW
**Location**: `package.json`, `node_modules/`

36 production dependencies produce 1.2GB of `node_modules`. Heavy contributors:

- JSCPP (C interpreter — bundled, used only for C courses)
- WebR (R WASM — very niche use case for CS50R)
- sql.js (WASM SQLite)
- Sentry (full SDK with source map upload tooling)
- CodeMirror (6 language packages)

Most WASM runtimes are loaded lazily at runtime from CDN, but their type stubs and build artifacts contribute to install time and CI cache size.

---

### 6.4 Remaining TODOs in Production Code

**Severity**: LOW
**Location**: 6 TODO/FIXME comments

| Location                  | Comment                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| `useTerminalStore.ts:174` | "TODO: JS execution runs on the main thread and cannot be truly..."            |
| `ErrorBoundary.tsx:25`    | "TODO: Report to Sentry when client-side error tracking is configured"         |
| `jsSandbox.ts:10`         | "TODO: For stronger isolation, migrate to a Web Worker..."                     |
| `wasmerShell.ts:352`      | "TODO: implement cancellation for running processes"                           |
| `wasmerShell.ts:357`      | "TODO: implement stdin forwarding"                                             |
| `api/nio/route.ts:101`    | "TODO: Client-side auth token interpolation can produce 'Bearer undefined'..." |

The `jsSandbox.ts` and `ErrorBoundary.tsx` TODOs represent known security and reliability gaps.

---

### 6.5 Inconsistent localStorage Access Patterns

**Severity**: LOW
**Location**: `src/infra/storageAdapter.ts`, `src/ui/code/useSplitPane.ts`, `src/ui/code/EditorArea.tsx`

The project defines a `storageAdapter` abstraction for safe localStorage access:

```typescript
// src/infra/storageAdapter.ts
const storageAdapter = createLocalStorageAdapter();
```

But several UI files bypass the adapter and access `localStorage`/`sessionStorage` directly:

```typescript
// src/ui/code/useSplitPane.ts
const stored = localStorage.getItem(storageKey);
localStorage.setItem(storageKey, String(ratio));
sessionStorage.getItem(key);
sessionStorage.setItem(key, "1");

// src/ui/code/EditorArea.tsx
localStorage.removeItem(key);
sessionStorage.removeItem(`${key}:reset-on-load`);
```

This creates inconsistency — the adapter handles SSR safety checks (`typeof window !== "undefined"`), but the direct calls don't. In SSR contexts (though unlikely for these components), they would throw.

---

## 7. Positive Observations

Despite the critical findings, several aspects of the codebase demonstrate strong engineering:

### 7.1 Domain Layer Purity

The `src/domain/` layer is genuinely pure — no React, no browser APIs, no side effects, no infra imports. ESLint enforces the boundary. The branded ID types, error hierarchy, and event validation system are well-designed.

### 7.2 Context Budget Management

The `nioContextBuilder.ts` implements intelligent progressive degradation: drops oldest messages → truncates transcript → truncates code → fails. This is a well-thought-out approach to working within provider token limits.

### 7.3 C Executor Web Worker Architecture

The C executor correctly isolates JSCPP in a Web Worker with proper timeout handling (`worker.terminate()`), pending-run snapshot before termination (avoiding double-resolve race conditions), and lazy worker re-spawn.

### 7.4 Transcript Fallback Chain

The 3-layer transcript resolution (client cache → Convex DB → SRT subtitle → YouTube API) with `Promise.allSettled` for parallel resolution is robust and graceful.

### 7.5 Security Headers and Build Guards

CSP headers are comprehensive. COOP/COEP is correctly scoped to `/editor-sandbox` only. Production build guards throw on debug env vars. Dev auth bypass is multi-layered with explicit opt-in.

### 7.6 Documentation Quality

40+ documentation files including 7 ADRs, API reference, UI/UX contract, design system, env requirements, and a troubleshooting guide. The `.env.example` is 100+ lines with detailed per-variable comments.

### 7.7 Event System Design

The 26-event type system with per-event metadata validators and a discriminated `EventMetadataMap` type is well-structured. Validators are exhaustive and compile-time checked.

### 7.8 Encrypted BYOK API Keys

AES-256-GCM encryption with per-key IV, SHA-256 key derivation, and server-side-only decryption in Convex actions is a sound approach for a BYOK model.

---

## 8. Scorecard

| Category                 | Score (1-10) | Rationale                                                                                                                                       |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**         | 7            | Clean 3-layer design with enforced boundaries. Undercut by Convex type casts and module-level state singletons.                                 |
| **Type Safety**          | 5            | Strict mode + branded IDs are good, but 30+ `as unknown` casts in the backend negate the benefit. CI check creates false confidence.            |
| **Test Coverage**        | 4            | 70% aggregate threshold hides 23 untested critical files. Production AI providers, JS sandbox, SQL executor, and core UI hooks have zero tests. |
| **Security**             | 5            | Good CSP, encrypted API keys, auth guards. JS sandbox is genuinely weak. Prompt injection defense is surface-level.                             |
| **Scalability**          | 4            | 37 `.collect()` calls with in-memory aggregation. Analytics loads full tables. Will hit Convex limits at moderate scale.                        |
| **Error Handling**       | 5            | Strong domain error types, but Convex backend uses raw `Error()`. 34 empty catches hide failures.                                               |
| **Code Quality**         | 6            | Well-structured overall. God component (795 LOC), copy-paste AI providers, and direct localStorage bypasses reduce the score.                   |
| **DevOps/CI**            | 7            | Solid pipeline: lint, typecheck, test, build, E2E, Semgrep. Branch hygiene (108 branches) is poor.                                              |
| **Documentation**        | 8            | ADRs, env docs, design system, API reference are genuinely good. Troubleshooting guide is helpful.                                              |
| **Production Readiness** | 5            | Suitable for open beta with limited users. Not ready for real scale, adversarial users, or SLA commitments.                                     |

**Overall: 5.6 / 10**

---

## 9. Prioritized Recommendations

### Priority 1 — Immediate (blocks production confidence)

#### 9.1 Replace `as unknown as` casts with proper Convex types

**Effort**: 1-2 days
**Impact**: Eliminates an entire class of silent type-safety bugs

Replace all `as unknown as LocalType` patterns in Convex with `Doc<"tableName">` from the generated data model. Remove hand-written shadow types (`EventRow`, `UserRow`, `LessonRow`, etc.). For index query builder casts, investigate the correct Convex SDK API or file upstream issues.

#### 9.2 Add tests for zero-coverage critical paths

**Effort**: 3-5 days
**Impact**: Covers the highest-risk code paths

Priority order:

1. `openaiStream.ts` + `anthropicStream.ts` — mirror the existing `geminiStream.test.ts`
2. `sqlExecutor.ts` — statement splitting, seed logic, per-lesson state reset
3. `jsSandbox.ts` — message protocol, timeout behavior, cleanup
4. `useChatThread.ts` — extract testable logic (message merging, SSE parsing, cache sync) into pure functions, test those

#### 9.3 Adopt structured errors in Convex backend

**Effort**: 1 day
**Impact**: Enables programmatic error handling on the client

Replace `throw new Error("message")` with `throw new ConvexError({ code: "...", message: "..." })` throughout the Convex backend. Define a shared error code enum. Client-side Convex hooks can then switch on error codes.

### Priority 2 — Short-term (reduces technical debt)

#### 9.4 Migrate JS sandbox to cross-origin iframe or Web Worker

**Effort**: 2-3 days
**Impact**: Closes the #1 security gap in the runtime layer

Serve the sandbox HTML from a different origin (null origin via `srcdoc` + `sandbox="allow-scripts"` already partially achieves this) or migrate to a Web Worker like the C executor. Add origin checks to `postMessage` calls.

#### 9.5 Decompose `ControlCenterDrawer.tsx`

**Effort**: 1 day
**Impact**: Reduces largest component from 795 LOC to 5 focused components

Split into: `ControlCenterShell`, `SharePanel`, `FeedbackPanel`, `NavigationPanel`, `UserPanel`.

#### 9.6 Replace `.collect()` with pagination in analytics

**Effort**: 2-3 days
**Impact**: Prevents Convex function limits at scale

Use cursor-based pagination with `paginate()`. For aggregation queries, consider pre-computed counters updated via mutations (materialized views pattern).

#### 9.7 Clean up git branches

**Effort**: 30 minutes
**Impact**: Reduces developer confusion

```bash
git branch --merged main | grep -v main | xargs git branch -d
```

For unmerged branches, audit and delete abandoned ones.

### Priority 3 — Medium-term (improves maintainability)

#### 9.8 Extract shared AI provider logic

**Effort**: 1 day
**Impact**: Eliminates 3× duplication, enables single test suite

Create a `streamProvider()` factory that accepts URL, headers, token parser, and provider name. Each provider becomes a thin config object.

#### 9.9 Replace module-level mutable state with dependency injection

**Effort**: 3-5 days
**Impact**: Improves testability and HMR stability

For runtime executors, replace module-level singletons with a registry class passed via context/dependency injection. For the video time store, migrate to a Zustand store slice.

#### 9.10 Add Sentry client-side error reporting

**Effort**: 1 day
**Impact**: Addresses the TODO in `ErrorBoundary.tsx`

The Sentry SDK is already configured (`sentry.client.config.ts`) but the `ErrorBoundary` has a TODO for reporting. Wire `Sentry.captureException()` into the error boundary and replace silent `catch {}` blocks in critical paths with Sentry reporting.

---

_End of review._
