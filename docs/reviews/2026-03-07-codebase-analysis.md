# Niotebook v0.2 — Deep Codebase Analysis Report

**Date:** 2026-03-07
**Method:** 5 specialized AI agents deployed in parallel, each assigned 1–2 SWE verticals
**Scope:** Read-only audit — no files were modified
**Duration:** ~7 minutes of parallel analysis
**Total output:** ~80K tokens across all agents

---

## Team Composition

| Agent | Verticals | Analysis Time | Output |
|-------|-----------|--------------|--------|
| `arch-quality-analyst` | Architecture + Code Quality | 6m 11s | 17K tokens |
| `security-analyst` | Security | 5m 13s | 15.2K tokens |
| `testing-analyst` | Testing | 3m 32s | 12.9K tokens |
| `perf-devops-analyst` | Performance + DevOps/Infrastructure | 5m 08s | 14.5K tokens |
| `data-state-analyst` | Data Management + API Design | 6m 59s | 20.7K tokens |

---

## Table of Contents

1. [Architecture & System Design](#1-architecture--system-design)
2. [Code Quality](#2-code-quality)
3. [Testing](#3-testing)
4. [Security](#4-security)
5. [Performance](#5-performance)
6. [DevOps / Infrastructure](#6-devops--infrastructure)
7. [Data Management](#7-data-management)
8. [API Design](#8-api-design)
9. [Consolidated Priority Matrix](#9-consolidated-priority-matrix)


---

## 1. ARCHITECTURE & SYSTEM DESIGN

### Strengths

1. **Layer separation is architecturally sound.** The `domain → infra → ui` stack is well-defined and generally respected. `convex/` correctly imports domain types without leaking Convex internals upward. `src/domain/` contains only pure types and functions with zero framework dependencies.

2. **`runtimeManager.ts` executor pattern is clean.** Lazy-load with deduplication via `pendingInit`, consistent `RuntimeExecutor` interface across all languages, graceful sandbox-first routing with fallback. Adding a new language requires only implementing the interface and a single case in `loadExecutor`.

3. **VFS design is correct.** `VirtualFS` is a proper class with a stable public API (`read/write/mkdir/rename/delete/glob/subscribe`), enforced size limits, and a clean snapshot/restore for IndexedDB persistence. The Zustand store wrapper derives reactive state from VFS events correctly.

4. **AI provider abstractions are solid.** `NioProviderStreamResult`, `NioProviderStreamError`, and the `encodeSseEvent/parseSseEvent` codec in `nioSse.ts` form a coherent, testable layer. The fallback gate in `infra/ai/fallbackGate.ts` delegates policy to domain.

5. **Convex schema is well-indexed.** Every query pattern has a matching index. The `chatMessages` table has three indexes covering thread listing, time ordering, and request-ID dedup — all of which are used.

6. **Auth pattern in `convex/auth.ts` is consistent.** `requireMutationUser / requireQueryUser` wrappers with dev-bypass support are used uniformly across all Convex functions. No auth check is forgotten.

7. **Domain isolation is near-complete.** `src/domain/nioContextBuilder.ts`, `nioPrompt.ts`, `rate-limits.ts`, `events.ts`, `ai-fallback.ts` are pure functions with no side effects, no framework imports, no React — genuinely testable in isolation.

### Issues — Critical

**C-1 — `convex/ops.ts` is a 649-line god file with an import in the middle of the file.**

`convex/ops.ts` mixes three completely unrelated concerns:
- Ingest verification (`verifyTranscriptWindows`, L71–194)
- E2E seed data (`seedE2E`, L196–290)
- Admin analytics (11 queries, L292–649)

Most critically, `import { requireQueryAdmin } from "./auth"` appears at **line 292** — in the middle of the file, between two exported functions. Imports belong at the top. It works in Node.js/bundlers but breaks the module contract and is a clear signal the file grew without discipline.

---

**C-2 — `getCodeExecutionCount` uses a stale, non-existent event type.**

`convex/ops.ts:413` queries `"code_executed"`, but the domain's `EventType` union defines `"code_run"`, not `"code_executed"`. No events are ever logged with the `"code_executed"` type. This function **always returns 0** and has been silently broken since introduction.

---

**C-3 — Full table scans on events table in admin analytics queries.**

`getActiveUsers` (L305–324), `getSessionCount` (L326–345), `getDailyActiveUsersSeries` (L423–451), `getTopLessons` (L536–567), and `getContentOverview` (L584–635) all call `.collect()` on the entire events table with no index filter. In-memory filtering happens after the full scan.

Compare with `getAiRequestCount` (L347) which correctly uses the `by_type_createdAt` index — the pattern is inconsistent. The events table will grow unboundedly — this is an O(N) query per analytics page load.

---

**C-4 — `domain/lessonEnvironment.ts` imports from `infra/runtime/types.ts` — dependency direction violation.**

`src/domain/lessonEnvironment.ts:7`: `import type { RuntimeLanguage } from "../infra/runtime/types"`

`RuntimeLanguage` is a core domain concept ("what languages exist") being defined in `infra/`. Both `domain/` and `infra/vfs/` depend on this type. It should live in `domain/runtime.ts` (which already exists as a file) and be imported by `infra/`.

### Issues — Medium

**M-1 — `src/app/api/nio/route.ts` is a 943-line god route.**

The single POST handler directly contains: JSON parsing, request validation, rate-limit checking, prompt injection sanitization, three-source transcript resolution (Convex → SRT → YouTube), context building, stub-mode streaming, BYOK streaming, SSE encoding, and Convex persistence. `streamWithByok` alone is 172 lines (L315–487).

---

**M-2 — SSE read-loop is duplicated across all 4 provider files.**

`geminiStream.ts`, `groqStream.ts`, `openaiStream.ts`, and `anthropicStream.ts` each implement an identical async generator (reader, decoder, buffer, while-true loop). Only the token-extraction function differs. The scaffolding is 4× duplicated.

---

**M-3 — `isRecord`, `isString`, `isNumber` type guards are duplicated 4 times.**

Defined identically in `geminiStream.ts:18`, `groqStream.ts:16`, `nioSse.ts:17`, `validateNioChatRequest.ts:14`. No shared module exists.

---

**M-4 — `requireQueryWorkspaceUser` is an exact duplicate of `requireQueryUser`.**

`convex/auth.ts:182–187` defines `requireQueryWorkspaceUser` which has the identical body as `requireQueryUser` (L177–180). Dead code unless there is an intention to differentiate workspace queries.

---

**M-5 — Convex internal functions exported alongside public API in `userApiKeys.ts`.**

`_getUserByToken`, `_upsertKey`, `_getActiveKey`, `_getKeysByUser` (prefixed with `_`) are exported from `convex/userApiKeys.ts:334–342` alongside public functions. Convex `internalQuery/internalMutation` exists precisely to prevent these from being callable externally.

---

**M-6 — Module-level mutable state in `useFileSystemStore.ts` leaks outside Zustand.**

`autoPersistTimer` (L74) and `currentLessonId` (L77) are module-level variables, not part of the Zustand store. They are invisible to devtools, cannot be reset in tests, and could misbehave if the store is instantiated multiple times.

---

**M-7 — C executor has no timeout.**

`cExecutor.ts` doesn't implement any timeout mechanism. JSCPP runs synchronously — an infinite loop will hang the browser tab. Python has `Promise.race` (L204), JS delegates to `runInSandboxedIframe` timeout, but C has no guard.

---

**M-8 — `"AUTH_REQUIRED"` error code is undocumented in the type system.**

`api/nio/route.ts:592–599` returns `{ error: { code: "AUTH_REQUIRED" } }` in a JSON 401, but `NioErrorCode` in `src/domain/ai/types.ts:42–49` has no `AUTH_REQUIRED` variant. Client-side error handling cannot statically handle this case.

---

**M-9 — `groqStream.ts` reads API key from server env; other providers take it as input.**

`groqStream.ts:51` reads `process.env.GROQ_API_KEY` (server-only), while `geminiStream.ts`, `openaiStream.ts`, and `anthropicStream.ts` accept `apiKey` as a parameter. Groq cannot support BYOK — breaking the provider abstraction symmetry invisibly in the type system.

---

**M-10 — `runtimeManager.ts` silently falls back to JS for unknown languages.**

The default case in `loadExecutor`'s switch (L71–73) returns `initJsExecutor()` for any unrecognized language, rather than throwing. If a language is added to the `RuntimeLanguage` union but not to the switch, it silently executes as JavaScript.

### Issues — Low

**L-1** — `"\x00__streamed__"` and `"\x00__plot_svg__"` are magic sentinel strings without named constants in `runtimeManager.ts:141,143` and `CodePane.tsx:373,382,388,389`. Should be named constants in `runtimeConstants.ts`.

**L-2** — `RUNTIME_WARMUP_DELAY_MS` exported from `runtimeConstants.ts` but appears unused. No references found outside its declaration file.

**L-3** — `COURSE_SOURCE_PLAYLIST_ID = "cs50x-2026"` hardcoded in `convex/ops.ts:11`. A content-specific magic string inside the analytics/ops file.

**L-4** — `jsSandbox.ts:132` uses `postMessage(..., "*")` — sends messages to any origin. The file's own TODO comment acknowledges this bad practice.

**L-5** — R plot rendering in `CodePane.tsx:391–400` bypasses React via `document.getElementById("niotebook-runtime-frame")` + `container.replaceChildren(frame)`. The same ID also appears in `htmlExecutor.ts:41`, creating a hidden coupling between two unrelated code paths that mutate the same DOM node.

### Recommendations

1. Split `convex/ops.ts` into `convex/ingest.ts` (verifyTranscriptWindows), `convex/seed.ts` (seedE2E), and `convex/analytics.ts` (all admin query functions). Fix the mid-file import immediately.
2. Fix `getCodeExecutionCount` — change `"code_executed"` to `"code_run"`.
3. Add DB-side time filters to analytics queries using the `by_type_createdAt` index pattern already demonstrated in `getAiRequestCount`.
4. Move `RuntimeLanguage` to `src/domain/runtime.ts` and import from there in both `src/infra/runtime/types.ts` and `src/infra/vfs/VirtualFS.ts`.
5. Extract SSE read loop into a shared `createSseStream(body, parseToken)` helper in `src/infra/ai/sseStream.ts`.
6. Extract `isRecord`, `isString`, `isNumber` into a shared `src/infra/ai/typeGuards.ts`.
7. Implement C executor timeout using `setTimeout + Promise.race` or Web Worker.
8. Move `autoPersistTimer` and `currentLessonId` into Zustand store state in `useFileSystemStore.ts`.
9. Delete `requireQueryWorkspaceUser` or differentiate it if needed.
10. Decompose `CodePane` — extract `RuntimeWarmup` hook, `NiotepadBookmark` hook, and the R-plot iframe renderer into a proper React ref-based component.


---

## 2. CODE QUALITY

### Strengths

1. **No `any` in `convex/` or `tests/`.** Zero `: any` occurrences found, complying with CLAUDE.md convention.

2. **Naming is consistent and semantic.** `buildNioContext`, `validateNioChatRequest`, `streamGemini`, `loadExecutor`, `consumeRateLimit` — all functions are named by what they do. File names map clearly to their responsibility.

3. **Convex mapper pattern is clean.** Every Convex module defines a local `Record` type and a `toXxxSummary` mapper (e.g., `toChatMessageSummary`, `toCourseSummary`, `toLessonSummary`). Domain types are never returned raw from Convex. Consistent across `chat.ts`, `content.ts`, `lessonCompletions.ts`, `users.ts`.

4. **`buildNioContext` is a well-designed pure function.** Clear budget-fitting algorithm with staged degradation (history trim → transcript truncate → code truncate → history trim again → hard fail). Returns a discriminated union result. Fully testable.

5. **Validation is thorough at the system boundary.** `validateNioChatRequest` in `infra/ai/validateNioChatRequest.ts` is a complete, structured validator. The `parseSseEvent` parser in `nioSse.ts` validates every field rather than trusting the wire format.

6. **VirtualFS private/public API boundary is clear.** All mutation methods are public and go through the same normalization and emit path. Private helpers are consistently private. The class is 416 lines but each method is focused.

### Issues — Critical

**Q-C1 — `CodePane.tsx` is a 648-line god component with 13+ useState/useEffect/useCallback hooks.**

`CodePane` manages: environment resolution, language state, runtime state, VFS initialization (2 useEffects), Convex event logging, runtime warmup, snapshot callbacks, code execution, stop/clear handlers, language switching, bookmark state + timer + handler + effect, keyboard shortcut handler, and R-plot DOM mutation. It imports from 15 different modules.

---

**Q-C2 — Bookmark logic is copy-pasted between `CodePane.tsx` and `AiPane.tsx`.**

Both components independently implement:
- `bookmarkConfirm` state + `bookmarkTimerRef` ref
- `handleBookmark` callback calling `useNiotepadStore.getState().addEntry()`
- Cleanup effect on unmount
- Identical inline SVG bookmark icon (with both confirmed/unconfirmed states — 30+ lines each)

`CodePane.tsx:466–502` and `AiPane.tsx:236–268` are structurally identical. The SVG bookmark icon appears verbatim at `CodePane.tsx:571–603` and `AiPane.tsx:299–331`.

### Issues — Medium

**Q-M1 — `convex/rateLimits.ts` uses `as unknown as` to escape index type inference.**

`convex/rateLimits.ts:52-58` casts `query as unknown as IndexRangeBuilder<...>`. Similar patterns appear in `convex/resume.ts` (7 occurrences), `convex/lessonCompletions.ts` (4 occurrences). `convex/ops.ts` has 19 such casts.

---

**Q-M2 — `CodePane.tsx:108`: `shouldResetSplits` is always `true`.**

`const shouldResetSplits = true;` — dead decision logic. The variable was clearly intended to be conditional but never is. Propagates to `resetOnLoad={shouldResetSplits ? "second" : undefined}`.

---

**Q-M3 — `window.dispatchEvent(new CustomEvent("niotebook:open-settings"))` is an invisible coupling.**

`AiPane.tsx:403` fires a `CustomEvent` to open settings. No type-safety, no guarantee the listener exists, no way to trace call sites statically.

---

**Q-M4 — `CodePane.tsx:391–400` — R plot uses direct DOM mutation with magic ID.**

`document.getElementById("niotebook-runtime-frame")` + `container.replaceChildren(frame)` inside an async `handleRun` function, bypassing React. The element ID also appears in `htmlExecutor.ts:41`, creating hidden coupling.

---

**Q-M5 — `openaiStream.ts` has a verbose inline type guard instead of a reusable function.**

`openaiStream.ts:106-112` uses a complex inline type assertion chain. Compare to `groqStream.ts:parseGroqToken` which is a clean, named function. `openaiStream.ts` and `anthropicStream.ts` are inconsistent with the Gemini/Groq pattern.

---

**Q-M6 — `CodePane.tsx:180–211` mixes reactive hooks with imperative `getState()` inside `useEffect`.**

`useFileSystemStore.getState()` called inside an effect that also depends on `files` from the hook subscription (L124). Creates a subtle race: the hook fires a re-render, then the effect reads `getState()` which may not be the same snapshot.

---

**Q-M7 — `CodePane.tsx:538` — `useNiotepadStore.getState()` inside a `window.addEventListener` callback registered in `useEffect`.**

Inside a keyboard event handler defined in a `useEffect` (L505–556). While valid in Zustand (stores are stable references), it accesses state imperatively without subscribing.

### Issues — Low

**Q-L1** — `clearTimeout` with `bookmarkTimerRef.current !== null` pattern repeated 3× in each of `CodePane.tsx` (L467, 492, 501) and `AiPane.tsx` (L237, 258, 264). A shared `useBookmarkConfirm` hook would eliminate this entirely.

**Q-L2** — `CodePane.tsx:475` — bookmark uses `` `Lesson ${lessonId}` `` as lecture title. Produces raw Convex ID as user-visible label. `AiPane.tsx` uses the resolved `lectureLabel` (e.g., "Lecture 3"). Inconsistent UX.

**Q-L3** — `convex/content.ts:181` — `as unknown as string` for ID comparison. `String(lesson.courseId)` would be cleaner.

**Q-L4** — `userApiKeys.ts:94` — non-null assertion `user.activeAiProvider!`. Guarded two lines above but `!` suggests type system wasn't fully cooperating.

**Q-L5** — `convex/events.ts:12–23` — `MutationConfig` and `MutationCtx` type alias boilerplate repeated in both `convex/events.ts:12–19` and `convex/rateLimits.ts:25–33`. Should live in a shared `convex/lib/mutationCtx.ts`.

### Recommendations

1. Extract a `useBookmarkConfirm(lessonId, lectureLabel)` hook that encapsulates the state + timer + handler + niotepad push. Delete the copy in both `CodePane` and `AiPane`.
2. Decompose `CodePane` — extract: `useRuntimeWarmup(language, lessonId)` hook, `useCodeExecution(language, environment)` hook, and a dedicated `RPlotFrame` React component using a ref instead of DOM ID.
3. Create `src/infra/ai/typeGuards.ts` with shared `isRecord`, `isString`, `isNumber`, `isBoolean` exports. Remove local copies from 4 files.
4. Create `src/infra/ai/sseStream.ts` with a `createSseStream<T>(body, parseToken)` factory. Remove the 4× duplicated read-loop.
5. Replace `window.dispatchEvent(new CustomEvent(...))` in `AiPane` with a Zustand store action or React context callback — traceable, typed, testable.
6. Replace magic sentinel strings — add `STREAMED_SENTINEL` and `PLOT_SVG_SENTINEL` to `runtimeConstants.ts`.
7. Create `convex/lib/mutationCtx.ts` with the repeated `MutationCtx` type alias pattern.
8. Fix `CodePane.tsx:475` to use the proper lecture label (same as `AiPane`), not raw `lessonId`.


---

## 3. TESTING

### Coverage Map — What IS Tested

**Well covered (domain layer):**
- `src/domain/nioContextBuilder.ts` — budget overflow, message trimming priority, determinism
- `src/domain/nioPrompt.ts` — prompt construction
- `src/domain/rate-limits.ts` — exact boundary (passes on limit, fails on limit+1), stateful across iterations
- `src/domain/events.ts` / event taxonomy
- `src/infra/vfs/VirtualFS.ts` — 15 cases: circular rename, event subscription, snapshot/restore, glob, path resolution. Excellent.
- `src/infra/runtime/cExecutor.ts` — real Wasmer execution, callback integration, error reporting
- `src/infra/runtime/imports/` — `cIncludes`, `importResolver`
- `src/infra/runtime/builtins/vfsBuiltins`
- Domain: `lessonEnvironment` presets — good use of `it.each` for parameterized validation
- Transcript window, video time, resume selectors, content selectors, chat selectors
- AI fallback gate / fallback logic
- Boot sequence (`ui/auth/bootSequence`)
- Terminal command router, completion provider, course cards
- Crypto (`crypto.test.ts`)

**Partially tested:**
- `src/app/api/nio/route.ts` — **stub preview path only**, real provider paths untested
- `nioSse.ts` — SSE client parsing

### Coverage Map — What Is NOT Tested (Major Gaps)

**Infrastructure — AI (all zero):**
- `src/infra/ai/promptInjection.ts` — security-critical, 10 regex injection patterns, zero tests
- `src/infra/ai/validateNioChatRequest.ts` — primary API input sanitization layer, zero tests
- `src/infra/ai/geminiStream.ts`, `openaiStream.ts`, `anthropicStream.ts`, `groqStream.ts` — all four AI provider streams, zero tests
- `src/infra/ai/subtitleFallback.ts` — SRT subtitle fetch + window slicing, zero tests
- `src/infra/ai/youtubeTranscriptFallback.ts` — YouTube transcript fallback, zero tests

**Infrastructure — Runtime (all zero):**
- `src/infra/runtime/runtimeManager.ts` — executor registry, sandbox routing, deduplication logic
- `src/infra/runtime/jsExecutor.ts` — JS execution via dynamic code evaluation
- `src/infra/runtime/pythonExecutor.ts` — Pyodide executor
- `src/infra/runtime/htmlExecutor.ts`, `cssExecutor.ts`, `sqlExecutor.ts`, `rExecutor.ts`
- `src/infra/runtime/jsSandbox.ts`
- `src/infra/runtime/wasmer/WasmerBridge.ts`, `wasmerShell.ts`, `vfsMount.ts` — entire Wasmer/WASM layer
- `src/infra/runtime/imports/jsModules.ts`, `pythonImports.ts`

**Infrastructure — VFS Store & Persistence (all zero):**
- `src/infra/vfs/useFileSystemStore.ts` — Zustand store with auto-persist debounce, IndexedDB integration, template init
- `src/infra/vfs/indexedDbBackend.ts`

**Infrastructure — Niotepad (all zero):**
- `src/infra/niotepad/niotepadSelectors.ts` — `selectFilteredEntries` (multi-term AND search, page filtering). Pure function, trivially testable.
- `src/infra/niotepad/useNiotepadStore.ts`
- `src/infra/niotepad/indexedDbNiotepad.ts`

**Infrastructure — Misc (all zero):**
- `src/infra/hash.ts`
- `src/infra/localCache.ts`, `chatLocalCache.ts`, `storageAdapter.ts`
- `src/infra/email/gmailClient.ts`, `gmailService.ts`
- `src/app/api/gmail/callback/route.ts`

**Convex backend (12 files, effectively 0% behavioral coverage):**
- `convex/chat.ts` — all chat mutations/queries
- `convex/userApiKeys.ts` — BYOK save/resolve/remove/setActive logic
- `convex/rateLimits.ts` — actual Convex mutation
- `convex/users.ts`, `transcripts.ts`, `content.ts`, `resume.ts`, `events.ts`
- `convex/ingest.ts`, `lessonCompletions.ts`, `feedback.ts`, `crons.ts`, `maintenance.ts`

**UI Components (~80 files, ~3% tested):**
- All `src/ui/chat/` components except `mockMessages.ts`
- All `src/ui/niotepad/` — 9 components
- All `src/ui/panes/` — `AiPane`, `CodePane`, `VideoPane`
- All `src/ui/admin/` — 12+ components
- `src/ui/settings/ApiKeySettings.tsx` — BYOK UI
- All `src/ui/landing/`, `src/ui/shell/`, `src/ui/layout/`

### Test Quality Assessment

**Problems found:**

`tests/e2e/auth.e2e.ts:18` — **Tautological assertion:**
```typescript
expect(hasBoot || hasClerk || true).toBe(true);
```
The `|| true` makes this always pass regardless of page state. This test cannot fail under any condition and is meaningless.

---

`tests/unit/chat-idempotency.test.ts` — **File-grep, not behavioral:** reads source files and checks for string presence. Would pass even if the functions were completely broken. Proves the string exists in the file, not that the behavior works.

---

`tests/unit/event-taxonomy.test.ts` — **Type-assertion masquerading as test:** sets a field and immediately reads it back. The TypeScript compiler would already catch any structural errors. Runtime value is identity — no logic exercised.

---

`tests/unit/smoke.test.ts` — `expect(1 + 1).toBe(2)` — confirms the test runner works. Not a test of project code.

---

`tests/e2e/workspace.e2e.ts:43-47` — test name promises terminal output verification; body only checks that `main` is visible. No terminal interaction, no output assertions.

---

`tests/e2e/admin.e2e.ts:10-14` — **Permanently skipped:** `test.skip("non-admin is redirected away from /admin", ...)`. The most important admin authorization test is permanently skipped with no plan to enable it.

---

`tests/unit/nio-route-sse.test.ts` — **Stub path only:** only exercises the stub preview path (`NIOTEBOOK_E2E_PREVIEW=true`). The real provider paths (BYOK with Gemini/OpenAI/Anthropic), the rate limiting branch, the auth required branch, the context building failure branch — none are tested.

**Positive quality observations:**
- `tests/unit/infra/vfs/VirtualFS.test.ts` — Excellent. 15 cases, circular rename, event subscription, snapshot/restore, glob, path resolution. Behaviorally focused, well-isolated.
- `tests/unit/nio-context-builder.test.ts` — Good. Tests budget overflow, message trimming priority, determinism.
- `tests/unit/rate-limit.test.ts` — Good. Tests exact boundary (passes on limit, fails on limit+1). Stateful across iterations.
- `tests/unit/infra/runtime/cExecutor.test.ts` — Good. Real Wasmer execution, callback integration, error reporting.
- `tests/unit/domain/lessonEnvironment.test.ts` — Good use of `it.each` for parameterized preset validation.

### Infrastructure Assessment

**`vitest.config.ts`:**
- No path alias — `@/*` → `src/*` is not configured. Tests must use relative paths. Inconsistent with production code conventions.
- No coverage configuration — no thresholds, no reporters. Zero enforcement or visibility into actual coverage numbers.
- No setup file — no global mocks, no test environment setup.
- `jsdom` opt-in via `// @vitest-environment jsdom` at file level is correct but undocumented.
- No typecheck — `bun run typecheck` is separate. Tests can silently have type errors that only show up in CI.

**`playwright.config.ts`:**
- Auth bypass architecture is solid — `NIOTEBOOK_DEV_AUTH_BYPASS`, `NIOTEBOOK_E2E_PREVIEW` env vars, seed script. Well thought out.
- Retry strategy appropriate — `retries: isCi ? 2 : 0`. Prevents local noise without masking CI flakiness.
- Debugging artifacts — trace/screenshot/video on failure. Good.
- Only default browser (Chromium) — no explicit browser matrix. No Safari/Firefox coverage.
- No mobile viewport — despite the app having a `MobileGate` component (`src/ui/shared/MobileGate.tsx`) and `hidden sm:block` responsive classes.
- Web server command is fragile — three commands joined with `&&`, sequential Convex push + seed + dev.
- `NEXT_PUBLIC_DEFAULT_LESSON_ID` dependency — several workspace tests `test.skip` when this env var is missing, creating invisible test gaps.

**Shared fixtures/helpers:** None. Every test file sets up its own fixtures from scratch. No shared test factories, no common builders for domain objects. This raises the friction for writing tests.

**Test determinism:** Unit tests appear deterministic. E2E tests may be flaky due to Convex real-time subscriptions and timing.

### Critical Gaps (Priority Order)

**P0 — Security/Correctness, Zero Coverage:**

1. `src/infra/ai/promptInjection.ts` — 10 regex patterns that redact injection attempts. Zero tests. **Critical subtle bug:** The `/g` flag is used on all 10 module-level `INJECTION_PATTERNS`. The paired `.replace()` call resets `lastIndex`, so this is currently safe in single-threaded flow — but unit tests would immediately expose or confirm the behavior.
2. `src/infra/ai/validateNioChatRequest.ts` — The only input sanitization layer for the `/api/nio` endpoint. All parsing branches (invalid message roles, non-string code, malformed transcript) are untested. First line of defense against malformed payloads.
3. `src/domain/lectureNumber.ts` — URL pattern extraction with 5 regex patterns. `resolveLectureNumber` has a priority chain (`subtitlesUrl → transcriptUrl → title → order`). Zero tests.

**P1 — Core Feature Paths, Zero Coverage:**

4. `src/infra/runtime/runtimeManager.ts` — Routes execution across all 7 languages. Deduplication logic for concurrent inits (`pendingInit`). Sandbox bridge fallback path. The entire runtime dispatch layer is untested.
5. `src/infra/runtime/jsExecutor.ts` — JS execution is the most-used code path for learners. Zero tests.
6. `src/infra/runtime/pythonExecutor.ts` — Pyodide WASM executor. Zero tests.
7. BYOK flow end-to-end — `convex/userApiKeys.ts` has save, `resolveForRequest`, remove, `setActiveProvider`. The crypto is tested (`crypto.test.ts`) but the Convex action layer is untested.
8. `src/infra/niotepad/niotepadSelectors.ts` — `selectFilteredEntries` has multi-term AND search, page filtering, source filtering. Pure function, trivially testable, completely untested.

**P2 — Infrastructure Reliability:**

9. `src/infra/vfs/useFileSystemStore.ts` — The Zustand store wrapping `VirtualFS`. Auto-persist debounce, `initializeFromEnvironment`, `loadFromIndexedDB`. While `VirtualFS.ts` itself is well tested, the store layer (which is what components actually use) is not.
10. AI provider streams — `geminiStream.ts`, `openaiStream.ts`, `anthropicStream.ts` — at minimum the token aggregation and error normalization logic is testable without real API calls.
11. `src/app/api/nio/route.ts` — Real provider path — only tested in stub mode. Rate limiting branch, auth required branch, `buildNioContext` failure branch, BYOK resolution path — all untested at the route level.

**P3 — Quality Assurance:**

12. Convex backend mutations — `chat.ts` (`createThread`, `addUserMessage`, `completeAssistantMessage`), `rateLimits.ts` (`consumeAiRateLimit`) — no Convex test harness exists at all.
13. E2E — AI chat interaction — No E2E test sends an actual message via the chat interface and verifies a response.
14. E2E — Code execution — No E2E test runs code in the editor and checks terminal output.

### Testing Culture Assessment

**Ratio:** ~34 test files covering ~180+ source files. Roughly 1 test file per 5–6 production files.

**Pattern:** Testing is an afterthought applied selectively. The domain layer is well-covered (the purest, most testable layer). Coverage drops sharply in infra, and is near-zero for Convex backend and UI components. This is consistent with "write domain tests when adding domain logic, skip the rest."

**Evidence of regression-driven testing:** `chat-idempotency.test.ts` (reads source files to check string presence) and `nio-prompt.test.ts` (verbatim ADR comparison) suggest some tests were added after bugs or regressions rather than from a systematic strategy.

No test helpers or factories signal that test infrastructure has not been invested in. Each new test must wire up its own fixtures. This raises the friction for writing tests.

Tautological assertions in E2E (`|| true`) and file-grep unit tests reduce the signal-to-noise ratio of the test suite. A passing CI gives false confidence.

### Recommendations (Prioritized)

1. Fix the `promptInjection.ts` regex `/g` flag concern — verify whether the `g` flag on module-level `RegExp` instances causes stateful `lastIndex` behavior. Add tests for each pattern, test multiple calls on the same input. (`tests/unit/infra/ai/promptInjection.test.ts`)
2. Add `validateNioChatRequest.test.ts` — test all rejection branches (missing fields, wrong types, malformed transcript, invalid message role). Pure data validation with no side effects.
3. Add `lectureNumber.test.ts` — test all 5 URL patterns, the priority chain, and null fallbacks.
4. Delete or fix the tautological E2E assertion in `auth.e2e.ts:18` — remove `|| true`.
5. Delete `smoke.test.ts` — it provides zero project-specific value.
6. Promote `chat-idempotency.test.ts` — replace file-content grep with a behavioral test or delete it.
7. Add vitest coverage config — configure `v8` coverage with `@vitest/coverage-v8`, add reporter, set thresholds for `src/domain/` (target 90%) and `src/infra/` (target 70%).
8. Add `@/*` path alias to `vitest.config.ts` — align test imports with production conventions.
9. Add `niotepadSelectors` tests — `selectFilteredEntries` is pure, complex, and currently untested. High value, low friction.
10. Add a BYOK E2E or integration test — at minimum test that submitting a chat message without a configured API key returns the `NO_API_KEY` error event and shows the settings prompt.
11. Add `runtimeManager.test.ts` — test the deduplication logic (concurrent `loadExecutor` calls for same language), language routing, and sandbox-first fallback path with mock executors.
12. Establish a Convex test harness — Convex provides `convex-test` for unit testing mutations and queries in isolation. All 12 backend files are currently untested.


---

## 4. SECURITY

### Critical Vulnerabilities

**CRIT-01: Gmail OAuth Callback — No CSRF State Validation, No Authentication**
`src/app/api/gmail/callback/route.ts:5-37`

The callback endpoint accepts any `?code=` parameter and exchanges it for OAuth tokens with zero checks:
- No state parameter generated, stored, or validated (CSRF attack vector per OAuth 2.0 RFC 6749 §10.12)
- No authentication or authorization check — any public internet user can hit `GET /api/gmail/callback?code=xxx` and exchange a code for tokens
- Tokens are persisted with write access (`gmail.modify`, `gmail.send`) to `niotebook@gmail.com`

An attacker can initiate their own Google OAuth flow for a crafted app, then trick an admin into visiting `/api/gmail/callback?code=<attacker_code>`, silently compromising the Gmail account. Or simply brute-force valid authorization codes.

---

**CRIT-02: No Next.js Server-Side Middleware for Route Protection**

There is no `middleware.ts` file in the project. Route protection for `/workspace`, `/admin`, and other protected paths is entirely client-side via React components (`AuthGate`, `AdminGuard`). This means:
- All protected pages' HTML, JavaScript, and data fetching code is served to unauthenticated requests
- Bots, scrapers, and unauthenticated API clients receive full page payloads
- The admin dashboard is accessible at the HTTP layer without authentication

While Convex enforces auth server-side on data access (so no actual data is leaked), the absence of a middleware guard is a defense-in-depth failure and exposes internal page structure and feature enumeration to unauthenticated actors.

### High Risk Issues

**HIGH-01: SSRF via Client-Controlled `subtitlesUrl` in Server-Side Fetch**
`src/app/api/nio/route.ts:668-674` + `src/infra/ai/subtitleFallback.ts:97`

When a request is processed, `lessonMeta` is initially populated from client-supplied data (`validation.data.lesson.subtitlesUrl` — CLIENT-CONTROLLED). If the Convex query for server-side lesson meta fails (network error, timeout, cold start), `lessonMeta` reverts to the client-supplied value and the subtitle fallback runs a server-side `fetch()` with no URL validation (`subtitleFallback.ts:97: const response = await fetch(url)`).

`validateNioChatRequest` validates `subtitlesUrl` only as `typeof === "string"`. A client can send `http://169.254.169.254/latest/meta-data/` (AWS IMDS), `http://localhost:3210` (Convex internal), or `file:///etc/passwd`. This is an **SSRF vulnerability exercisable in production** whenever a transient Convex failure occurs. When `NEXT_PUBLIC_DISABLE_CONVEX=true`, this is unconditionally exploitable.

---

**HIGH-02: `NEXT_PUBLIC_` Prefix on Security-Critical Server-Side Variables**
`src/app/api/nio/route.ts:58,63,77` · `src/infra/devAuth.ts:23-24` · `src/infra/convexClient.ts:26`

`NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` and `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW` are used in server-side auth decisions in the API route handler. `NEXT_PUBLIC_` variables are baked into the client bundle:
- Any user can inspect the client JS to learn whether auth bypass is active on a deployment
- The security posture of the deployment is publicly disclosed to attackers
- Server-side auth guards should not rely on variables that are also shipped to the client

---

**HIGH-03: No Global Security HTTP Headers**
`next.config.ts:1-25`

`next.config.ts` defines `headers()` only for the `/editor-sandbox` route (COOP/COEP). No global security headers are configured for any other route:
- No `Content-Security-Policy` — XSS attacks can load arbitrary external scripts
- No `X-Frame-Options` or `frame-ancestors` CSP directive — the app can be iframed (clickjacking)
- No `X-Content-Type-Options: nosniff` — MIME sniffing attacks possible
- No `Strict-Transport-Security` — downgrade attacks in transit
- No `Referrer-Policy` — lesson IDs and user paths leaked to third parties (YouTube, Sentry)
- No `Permissions-Policy` — unrestricted access to camera, microphone, geolocation

---

**HIGH-04: Dev Bypass Creates Unchecked Admin in Multi-Path Flow**
`convex/auth.ts:151-160`

When `NIOTEBOOK_DEV_AUTH_BYPASS=true` AND `NIOTEBOOK_E2E_PREVIEW=true` (or `NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV=true`), and no dev-bypass user exists yet, `ensureDevBypassUser` auto-creates one:

```
ctx.db.insert("users", { tokenIdentifier: "dev-bypass", email: "dev@niotebook.local", role: "admin" })
```

This user is returned for both `requireMutationUser` AND `requireMutationAdmin` calls (lines 167, 174), granting admin privileges to all Convex mutations without any real authentication. A misconfigured preview deployment could permanently insert an admin user into the production Convex database.

### Medium Risk Issues

**MED-01: Auth Bypass Flags Disable API Route Auth in Non-Production**
`src/app/api/nio/route.ts:66-83`

`isConvexAuthRequired()` returns `false` when `NODE_ENV !== "production"`, `NIOTEBOOK_E2E_PREVIEW=true`, or `NIOTEBOOK_DEV_AUTH_BYPASS=true`. Staging/preview deployments can run with no auth on the AI chat endpoint, consuming BYOK keys or platform AI quota without authentication. The rate limit check also silently skips — `rateLimitDecision = null` at line 611, so the request proceeds without rate limiting.

---

**MED-02: No Input Size Limits on Chat API Payload (Cost Amplification / DoS)**
`src/infra/ai/validateNioChatRequest.ts`

`validateNioChatRequest` validates types but imposes no size limits on `userMessage` (unbounded string), `recentMessages` (no array length cap), `code.code` (unbounded string), `transcript.lines` (unbounded array). An authenticated attacker can send a multi-megabyte payload burning BYOK token budgets or platform AI quota.

---

**MED-03: `postMessage` Target Uses Wildcard `"*"`**
`src/infra/runtime/jsSandbox.ts:132`

`iframe.contentWindow?.postMessage({ type: "exec", code, externalModules }, "*")` — sends messages to any origin. Inside the sandbox HTML, `parent.postMessage(..., "*")` sends stdout/stderr to any parent, not just the expected parent, which could be leveraged in a clickjacking scenario if CSP is absent.

---

**MED-04: JS Executor Loads Arbitrary Code from User-Specified URLs**
`src/infra/runtime/jsExecutor.ts:22-27`

User code can import from `http://` URLs (no HTTPS enforcement) or load packages from `esm.sh` that contain malicious code. Primary risk is supply-chain attacks through compromised packages.

---

**MED-05: Prompt Injection Neutralization is Blacklist-Based and Incomplete**
`src/infra/ai/promptInjection.ts:6-17`

The `INJECTION_PATTERNS` list misses: Unicode homoglyph substitutions, Base64/ROT13 encoded instructions, indirect injections via the `code.code` payload (user's code is not sanitized at line 823 in `route.ts`), roleplay framing, and multi-turn injection across `recentMessages` history (only first content is sanitized; `role: "assistant"` messages are not).

---

**MED-06: Unprotected Public Content Queries**
`convex/content.ts:68-91`

`getCourses` and `getLessonsByCourse` are public Convex queries with no authentication. `getLesson` also returns `subtitlesUrl` and `transcriptUrl` without auth — these could be proprietary CDN URLs.

---

**MED-07: Role Assignment on Every Login is Email-Based**
`convex/users.ts:16-23, 36-39`

Admin role is determined by checking `identity.email` against `NIOTEBOOK_ADMIN_EMAILS` env var on every upsert. A Clerk account created with an admin email address before that email is configured as admin gains admin on the next login after the env var is updated — no additional verification.

### Low Risk / Informational

**LOW-01** — `convex/auth.config.ts:6`: Clerk dev domain hardcoded (`https://one-muskrat-8.clerk.accounts.dev`). If deployed to production without modification, all JWTs are validated against the development Clerk instance. Should reference an environment variable.

**LOW-02** — `convex/lib/crypto.ts:7-17`: SHA-256 used as KDF (not PBKDF2, HKDF, or Argon2). For a server-managed env var expected to be high-entropy, acceptable in practice — but HKDF would be the standard approach.

**LOW-03** — `src/infra/email/gmailClient.ts:15`: `const TOKENS_PATH = join(process.cwd(), ".gmail-tokens.json")`. OAuth tokens with `gmail.modify`, `gmail.send` access stored in a local file. Accidental inclusion in a Docker image layer or a misconfigured `.gitignore` would expose full Gmail access.

**LOW-04** — `src/infra/runtime/sqlExecutor.ts:30-31`: Module-level `db` (Database instance) and `seeded` (boolean flag) persist for the lifetime of the browser tab. Switching lessons carries over previous SQL schema/data.

**LOW-05** — `src/infra/runtime/jsSandbox.ts:124-127`: The `onMessage` handler correctly checks `event.source !== iframe.contentWindow`. Combined with no `allow-same-origin` in the sandbox attribute, the iframe runs in an opaque origin. The sandbox implementation is functionally correct.

**LOW-06** — `convex/userApiKeys.ts:187-191`: If `NIOTEBOOK_KEY_ENCRYPTION_SECRET` is unset, `resolveForRequest` returns `null` instead of throwing. This silently makes all BYOK keys inaccessible without operator notification.

**LOW-07** — `convex/auth.ts:43-46`: `identity.tokenIdentifier` and `identity.email` logged in plaintext on auth failure via `console.error`. Constitutes PII logging in Convex's dashboard log stream or any log aggregator.

**LOW-08** — `convex/events.ts:32-106`: `logEvent` requires user auth but has no rate limit. An authenticated user can call it thousands of times per second, inflating the events table.

**LOW-09** — `src/infra/ai/youtubeTranscriptFallback.ts:101`: `track.baseUrl` fetched server-side without schema or hostname validation.

### Security Strengths

- **AES-256-GCM for BYOK keys** — Authenticated encryption with random per-encryption IVs. Keys never stored in plaintext. `convex/lib/crypto.ts` uses the Web Crypto API correctly.
- **Convex server-side authorization** — All mutations and queries consistently call `requireMutationUser`, `requireQueryUser`, `requireMutationAdmin`, `requireQueryAdmin`. No data access without auth at the Convex layer.
- **Thread ownership enforcement** — `convex/chat.ts:145,189,243` checks `thread.userId !== toGenericId(user.id)` on every chat operation, preventing cross-user data access.
- **Type-safe input validation** — `validateNioChatRequest` rejects malformed payloads. Convex functions use `v.union(v.literal(...))` for enumerables.
- **Per-user AI rate limiting** — `convex/rateLimits.ts` enforces per-user rate limits on AI requests, enforced server-side via Convex mutation.
- **COOP/COEP isolation** — `/editor-sandbox` has `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`, enabling `SharedArrayBuffer` for Wasmer WASM safely.
- **JS sandbox opaque origin** — `sandbox="allow-scripts"` without `allow-same-origin` means the iframe runs in an opaque origin and cannot access parent cookies, localStorage, or IndexedDB.
- **Prompt injection neutralization** — Basic protection exists via keyword blacklist with flagging. Covers the most obvious jailbreak phrases.
- **Generic error codes** — API error responses return structured codes (`RATE_LIMITED`, `AUTH_REQUIRED`) without stack traces or internal details.
- **No `dangerouslySetInnerHTML`** — Zero occurrences found in `.tsx` files. `react-markdown` without `rehype-raw` is safe from XSS by default.
- **Internal Convex helpers properly scoped** — `_getUserByToken`, `_upsertKey`, `_getActiveKey` are `internalQuery/internalMutation`, not callable from outside the Convex deployment.

### Recommendations (Priority Order)

| # | Finding | Action |
|---|---------|--------|
| 1 | CRIT-01 | Add OAuth state parameter to Gmail auth flow; validate on callback; require admin session |
| 2 | CRIT-02 | Add `middleware.ts` using Clerk's `clerkMiddleware` to protect `/workspace` and `/admin` at the edge |
| 3 | HIGH-01 | Validate `subtitlesUrl` against an allowlist of trusted hostnames before server-side fetch; never use client-supplied URL as fallback |
| 4 | HIGH-02 | Rename `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` → `NIOTEBOOK_DEV_AUTH_BYPASS` (no public prefix); remove from client bundle |
| 5 | HIGH-03 | Add global security headers in `next.config.ts`: CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS, `Referrer-Policy` |
| 6 | HIGH-04 | Add request body size check in `route.ts` and per-field max-length validation in `validateNioChatRequest` |
| 7 | MED-01 | Ensure `isConvexAuthRequired()` is enforced for all non-development environments including E2E preview |
| 8 | MED-05 | Extend prompt injection neutralization to `code.code` payload; consider structured delimiter approach rather than keyword blacklist |
| 9 | LOW-01 | Move Clerk domain to an env var in `auth.config.ts` |
| 10 | LOW-07 | Remove `identity.email` from the auth failure log line to prevent PII logging |


---

## 5. PERFORMANCE

### Strengths

- **Sandbox-first routing with fallback** — `runtimeManager.ts` routes JS execution to a sandboxed iframe first. Good isolation/performance trade-off.
- **VirtualFS lazy tree walk** — `glob()` traversal is only triggered on explicit calls, not on every state change.
- **Editor lazy initialization** — CodeMirror is instantiated once and reused across language switches via `compartment.reconfigure()`.
- **Abort signal propagation** — `request.signal.addEventListener("abort", abort)` correctly propagates client disconnects to AI stream cancellation.

### Issues — Critical

**C1 — C executor runs JSCPP synchronously on the main thread with a no-op `stop()`.**

`cExecutor.ts:61` calls `jscpp.run(processedCode, ...)` blocking the main thread. `cExecutor.ts:95`: `const stop = (): void => { return; };` — the stop implementation is a no-op. An infinite loop in C code will hang the browser tab. No timeout, no Web Worker offload.

---

**C2 — WebR CDN version mismatched with `package.json`.**

`rExecutor.ts:52`: `const WEBR_CDN = "https://webr.r-wasm.org/v0.5.0/";` — wrong version.
`package.json:64`: `"webr": "^0.5.8"` — correct version.
The TypeScript types and the runtime loaded from CDN are different versions. Any API changes between `0.5.0` and `0.5.8` could cause silent runtime errors or type mismatches.

---

**C3 — `VideoPane.tsx:44` fetches ALL courses to find one.**

`VideoPane.tsx:44`: `const courses = useQuery(getCoursesRef, {});` — fetches ALL.
`VideoPane.tsx:52`: `courses.find(item => item.id === lesson.courseId)` — O(n) scan.
No `getCourse(courseId)` query for single-course lookup exists.

### Issues — Medium

**M1 — `TopNav.tsx:42-75` fires 4 Convex live queries from a persistent global component.**

`meData`, `courses`, `lesson`, `lessons` all subscribed simultaneously from the top nav. `courses` and `lessons` queries stay alive for the entire workspace session. `courses` fetches the full collection. These are real-time WebSocket subscriptions — every Convex mutation to those tables triggers a push to every connected workspace client.

---

**M2 — `deriveState()` walks the full VFS tree on every mutation.**
`useFileSystemStore.ts:62-70,101-138`

Every `createFile`, `updateFile`, `deleteNode`, `renameNode` calls `deriveState(vfs)` which does a complete recursive tree walk to collect all files and directories. For a project with many files, each keystroke (via the editor's auto-save triggering `updateFile`) causes a full tree scan.

---

**M3 — Pyodide is fetched from external CDN on every session.**
`pythonExecutor.ts:24-26`

Pyodide's core (~10MB WASM + stdlib) is loaded from `cdn.jsdelivr.net` on every cold session. No Service Worker caching, no self-hosted bundle, no preloading. jsDelivr availability directly determines Python runtime availability.

---

**M4 — `framer-motion` included in root bundle via `template.tsx:4`.**

`src/app/template.tsx` imports from `framer-motion` and is used at the root layout level. This prevents `framer-motion` (~100KB gzipped) from being code-split — it is included in the initial page bundle that every route loads, including the landing page.

---

**M5 — SQL executor's `seeded` flag is never reset.**
`sqlExecutor.ts:31,194-210`

`let seeded = false` is module-scoped. If users add a new `seed.sql` or `schema.sql` file to the VFS after the first run, the seed never re-executes. The module-scoped `db` instance is also never reset between lessons — a user who switches lessons carries over schema/data from the previous SQL session.

---

**M6 — No `React.memo` on any pane components.**

`VideoPane`, `CodePane`, and `AiPane` are all inline function components with no memoization. They re-render whenever their parent (`WorkspaceShell`) or any ancestor re-renders. Given multiple active Convex subscriptions and frequent video time updates propagated via context, re-render frequency is high.

---

**M7 — `CodePane.tsx:505-556` — global keydown listener created without `useCallback`.**

The `handleKeyDown` function is defined inside a `useEffect` without `useCallback`. The effect recreates the function and re-attaches the listener every time `[activeLanguage, lessonId, videoTimeSec]` changes. `videoTimeSec` changes frequently (per video frame), causing listener churn.

### Issues — Low

**L1** — Orbitron loaded with 4 weights globally (`layout.tsx:18-22`). Per project conventions, Orbitron is used only for the Wordmark. Only the weight used by the Wordmark should be requested.

**L2** — `globToRegex()` creates a new `RegExp` on every call (`VirtualFS.ts:354-362`). `rExecutor.ts:143-146` calls `filesystem.glob()` on every code run. A simple pattern cache (`Map<string, RegExp>`) would eliminate the allocation.

**L3** — `VideoPane.tsx:101-113` — inline IIFEs not memoized. `sourceLabel` and `infoItems` are computed via inline IIFE patterns on every render with no `useMemo`.

**L4** — VFS snapshot uses full JSON serialization on every persist (`indexedDbBackend.ts:43`). `JSON.stringify(snapshot)` serializes the complete VFS tree on every auto-persist tick (500ms debounce). No incremental/delta persistence exists.

### Recommendations

1. **C executor:** Run JSCPP in a Web Worker with a `MessageChannel` and a timeout that posts back to the main thread. Add a real `stop()` implementation that terminates the worker.
2. **WebR version:** Update CDN URL to `https://webr.r-wasm.org/v0.5.8/` to match `package.json`, or load via a local bundle.
3. **VideoPane courses query:** Add a `getCourseByCourseId(courseId)` Convex query with an index and use it instead of `getCoursesRef`.
4. **TopNav queries:** Lift `courses` and `lessons` fetching out of `TopNav` into a shared context/hook. Consider lazy-loading the lesson selector data only when the drawer opens.
5. **`framer-motion` in template:** Move the animation wrapper into a lazy-loaded client component using `next/dynamic`.
6. **SQL executor:** Add a `clearRuntime("sql")` call on lesson change, and reset the `seeded` flag by keying it to the lesson ID.


---

## 6. DEVOPS / INFRASTRUCTURE

### Strengths

1. **Comprehensive CI** — `ci.yml` runs lint, `check:any`, `check:unknown`, typecheck, unit tests, and a production build on every PR and main push. Sequential-but-complete quality gates.

2. **E2E trigger architecture** — `e2e.yml` is triggered by Vercel deployment webhooks (`repository_dispatch: types: vercel.deployment.success`). E2E tests validate the actual preview deployment, not a local test server. Production guard prevents running destructive seed operations on production.

3. **E2E readiness marker** — `layout.tsx:74` injects `<meta name="niotebook-e2e" content="ready">` when `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true`. The preflight step in `e2e.yml:226-256` checks for this marker before running tests.

4. **Lefthook pre-commit (parallel)** — `lefthook.yml` runs lint and typecheck in parallel (`parallel: true`), reducing pre-commit latency.

5. **Exact Bun pinning** — `packageManager: bun@1.1.19` in `package.json` and `bun-version: "1.1.19"` in CI are aligned. `bun install --frozen-lockfile` in CI prevents dependency drift.

6. **Sentry zero-crash design** — All three Sentry configs use `enabled: Boolean(dsn)`. Missing env vars silently disable Sentry rather than crashing startup.

7. **`postMessage` security in Wasmer bridge** — `WasmerBridge.ts:187-189` validates both `event.origin === window.location.origin` and `event.source === this.iframe.contentWindow`. Neither alone is sufficient — this double-check is correct.

8. **Events schema is audit-complete** — `events.ts:34-64` covers 28 event types: auth lifecycle, content navigation, video interactions, code execution, AI requests + fallbacks, session lifecycle, runtime warmup, transcript ingestion, and feedback. Well-structured analytics infrastructure.

9. **Semgrep and Claude Code Review workflows** — `.github/workflows/semgrep.yml` and `claude-code-review.yml` provide static security analysis and AI-assisted code review as CI gates.

### Issues — Critical

**C1 — `tracesSampleRate: 1` in all three Sentry configs.**

`sentry.client.config.ts:8`, `sentry.server.config.ts:8`, `sentry.edge.config.ts:8` all have `tracesSampleRate: 1`. A sample rate of 1 means 100% of all transactions are traced and sent to Sentry. At any meaningful production scale, this will rapidly exhaust Sentry's performance quota and incur significant overage costs. The standard production rate is 0.1–0.2.

---

**C2 — No source map upload configured for Sentry.**
`next.config.ts:21-25`

`sentryBuildOptions` contains only `{ silent: true }`. Without `authToken`, `org`, `project`, or `sourceMapsUploadOptions`, Sentry never receives source maps. Production errors show minified stack traces, making debugging nearly impossible.

### Issues — Medium

**M1 — No `format:check` in CI or lefthook.**

`bun run format:check` is defined in `package.json:25` but not invoked in `ci.yml` or `lefthook.yml`. Prettier formatting violations can be committed and merged without any automated check.

---

**M2 — E2E tests not integrated into PR checks.**
`e2e.yml:3-7`

E2E runs only on `repository_dispatch` (Vercel webhook) or `workflow_dispatch`. PRs can merge without E2E validation. A PR that breaks a Playwright test scenario is only caught after deployment to a preview environment.

---

**M3 — `events` table missing `by_userId_createdAt` and `by_lessonId_createdAt` indexes.**
`schema.ts:185-187`

Current indexes: `by_userId`, `by_type_createdAt`. Admin analytics querying "events for user X in time range Y" requires a compound index `["userId", "createdAt"]`. Without it, Convex falls back to full collection scans filtered in-memory.

---

**M4 — `engines.bun` constraint is loose.**

`"bun": "1.1.x"` in `package.json:8` allows any 1.1.* patch, but `packageManager: bun@1.1.19` mandates exactly 1.1.19. The engine constraint should be `"1.1.19"` to match.

---

**M5 — No `optimizePackageImports` for icon library.**

`@phosphor-icons/react` exports thousands of icons. Without `experimental.optimizePackageImports: ["@phosphor-icons/react"]` in `next.config.ts`, all icon exports are included in the bundle. The same applies to `recharts` on admin pages.

---

**M6 — Turbopack (dev) vs Webpack (build) bundler split.**

`"dev": "next dev --turbopack"` and `"build": "next build"` use different bundlers. Subtle differences (module resolution order, chunk splitting, polyfills) can hide Webpack-specific issues in development.

---

**M7 — No health check endpoint.**

No `/api/health` or `/api/ping` route exists. Needed for uptime monitoring services, custom alerting, load balancer configuration, and confirming Convex connectivity on startup.

### Issues — Low

**L1** — `check:any` and `check:unknown` scripts call `rg` directly (system dependency). These checks are also absent from lefthook pre-commit hooks.

**L2** — Event metadata schema duplicated in two places (`events.ts:67-94`, `schema.ts:156-183`). Adding a new metadata field requires two separate edits.

**L3** — `JSCPP` is a non-standard npm package name (all-caps) at `^2.0.9`. Limited maintenance activity. It is the sole C execution backend. Supply chain / maintenance risk for a critical path (CS50 is primarily a C course).

**L4** — `NIO_DEBUG` env var (`process.env.NIO_DEBUG === "1"` in `api/nio/route.ts:40`) is undocumented in CLAUDE.md or `.env.example`.

**L5** — `ignoreScripts: ["sharp", "unrs-resolver"]` in `package.json` is not a standard Bun field (it is npm-specific). Bun may silently ignore it, meaning `sharp` install scripts could run unexpectedly.

### Recommendations

1. **Sentry trace rate:** Set `tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1` across all three Sentry configs. Add `SENTRY_AUTH_TOKEN`, `org`, and `project` to `sentryBuildOptions` in `next.config.ts` to enable source map uploads.
2. **Format check in CI:** Add `- run: bun run format:check` to `ci.yml` after lint. Add `format: { run: bun run format:check }` to `lefthook.yml`.
3. **E2E on PRs:** Add a lightweight smoke test job to `ci.yml` triggered on PRs, or use `workflow_call` to chain the E2E workflow after the build step.
4. **Add compound indexes:** Add `.index("by_userId_createdAt", ["userId", "createdAt"])` and `.index("by_lessonId_createdAt", ["lessonId", "createdAt"])` to the events table in `schema.ts`.
5. **`optimizePackageImports`:** Add `experimental: { optimizePackageImports: ["@phosphor-icons/react", "framer-motion", "recharts"] }` to `next.config.ts`.
6. **Health check endpoint:** Add `src/app/api/health/route.ts` that returns `{ status: "ok" }` with a 200.
7. **Document all env vars:** Add a `.env.example` file listing all required and optional env vars, including `NIO_DEBUG`, `NIOTEBOOK_E2E_PREVIEW`, `NIOTEBOOK_DEV_AUTH_BYPASS`, `ENCRYPTION_SECRET`, and all Sentry/Clerk/Convex keys.


---

## 7. DATA MANAGEMENT

### Schema Design Assessment

**Strengths:**
- Schema is well-normalized with appropriate use of `v.id()` relationships
- `chatMessages` table has three indexes covering all query patterns (`by_threadId`, `by_threadId_createdAt`, `by_threadId_requestId`) — all actively used
- `codeSnapshots` indexed by `(userId, lessonId, language)` — correct for the resume use case

**Issues:**

| # | Table | Issue | Severity |
|---|-------|-------|----------|
| 1 | `userApiKeys` | No `by_provider` index — looking up active key by provider requires filtering all user keys in JS | Medium |
| 2 | `lessonCompletions` | Admin analytics across all completions requires a full table scan — no `by_lessonId` index | Low |
| 3 | `feedback` | `category: v.string()` — no union type enforcement. Any string is accepted | Low |
| 4 | `events.metadata` | `lessonId` and `userId` stored both as top-level table fields (lines 152–153) AND inside `metadata` (lines 163–164). Partial duplication | Low |
| 5 | `rateLimits` | Records accumulate indefinitely. No cron or TTL cleanup for expired rate limit windows | Low |

### Convex Functions Assessment

**`convex/resume.ts` — Critical full table scan:**

`getResumeData` (resume.ts:257–264) does: `await ctx.db.query("frames").collect()` then filters by `userId` in JavaScript. The `frames` table has a `by_userId_lessonId` index that is NOT used here. At scale this is expensive and will hit Convex function memory/time limits.

---

**`convex/content.ts:178–185` — Another full table scan:**

`getLessonCountsByCourse` loads all lessons with `.collect()` then aggregates in JS. No index used. Called from the admin dashboard.

---

**`convex/ingest.ts` — Dead code, atomicity gaps, migration residue:**

1. `ingestCs50x2026` (lines 98–211) is nearly identical to `ingestCourse` (lines 398–513) — ~90% duplicated logic.
2. `migrateCs50SqlPlaylistId` and `migrateCs50VideoFixes` are labeled "run once per deployment, then remove" (comments at lines 515 and 607) but are permanently in the codebase.
3. The multi-step ingest pipeline (`ingestCourse → clearTranscriptSegmentsBatch → ingestTranscriptSegmentsBatch → finalizeTranscriptIngest`) is not atomic. If the process aborts between clearing and re-inserting segments, the lesson is left with 0 segments. No recovery/retry guard.

---

**`convex/chat.ts:173–219` — Trust boundary issue:**

`createChatMessage` accepts `role: v.union(v.literal("user"), v.literal("assistant"))`. Any authenticated user can write `role: "assistant"` messages directly into threads. The only check is ownership of the thread, not authority to write as the assistant role.

---

**`convex/rateLimits.ts` — Safe implementation:**

The rate limit logic is correctly domain-isolated in `src/domain/rate-limits.ts`. The mutation correctly reads, evaluates, and writes atomically within one Convex function call (no TOCTOU risk within a single mutation).

---

**`convex/maintenance.ts:26–29` — Filter scan:**

`ctx.db.query("chatMessages").filter((q) => q.lt(q.field("createdAt"), cutoffMs)).collect()` — `.filter()` is a full table scan since there is no standalone `createdAt` index on `chatMessages`. Acceptable for nightly preview cleanup, but worth noting.

---

**`convex/userApiKeys.ts` — Well-designed:**

Correct use of `action` (for crypto) calling `internalQuery/internalMutation`. The `_` prefix convention for internal functions is clear. Auto-selects first saved key at `_upsertKey:68`. Auto-clears active provider on remove:252.

---

**`convex/crons.ts` — One cron, guarded:**

Only one cron: `preview-data-cleanup` at 2am daily. Correctly guarded by `NIOTEBOOK_PREVIEW_DATA !== "true"` check inside the handler — silently skips in production unless the env flag is set.

**Issues Summary — Convex Functions:**

| # | File | Location | Issue | Severity |
|---|------|----------|-------|----------|
| 1 | `resume.ts` | Line 257 | `getResumeData` full table scan of frames — should use `by_userId_lessonId` index | Critical |
| 2 | `content.ts` | Line 178 | `getLessonCountsByCourse` full table scan of lessons | Critical |
| 3 | `ingest.ts` | Lines 98, 398 | `ingestCs50x2026` ≈ duplicate of `ingestCourse` | Medium |
| 4 | `ingest.ts` | Lines 521, 612 | One-time migration mutations never removed | Medium |
| 5 | `ingest.ts` | Multi-step flow | Non-atomic transcript ingest — partial failure leaves DB in inconsistent state | Medium |
| 6 | `chat.ts` | Line 176 | Clients can write `role: "assistant"` messages | Medium |
| 7 | `resume.ts` | Lines 37–42 | Complex `as unknown as IndexRangeBuilder<>` casts — workaround symptom | Low |
| 8 | `maintenance.ts` | Line 26 | `.filter()` full scan instead of index | Low |
| 9 | `content.ts` | Line 102 | `listAll` users — full table scan, no pagination | Low |
| 10 | `ingest.ts` | Line 174 | `finalizeTranscriptIngest` skips event logging for token-auth requests | Low |

### Client State Management Assessment

**VFS Store (`src/infra/vfs/useFileSystemStore.ts`):**

The architecture is correct: VFS is the single source of truth; the Zustand store derives `files` and `directories` from it after each mutation; IndexedDB is a durable mirror.

Issues:
- `currentLessonId` (line 77) and `autoPersistTimer` (line 74) are module-level mutable variables, not store state. Navigation between lessons without resetting the store could leave the wrong `currentLessonId` in effect, causing auto-persist to save to the wrong key.
- No validation on `JSON.parse(data)` in `indexedDbBackend.ts:57` — a corrupted snapshot silently loads as any shape.
- `DB_VERSION = 1` with no migration logic in the upgrade handler — if the VFS snapshot format ever changes, old IndexedDB data will be loaded without schema migration.

**`VirtualFS` class (`src/infra/vfs/VirtualFS.ts`):**

Well-implemented. Size limits (`MAX_FILE_SIZE = 1MB`, `MAX_TOTAL_SIZE = 50MB`) are enforced. Path normalization handles edge cases. Recursive directory operations are correct.

Minor: `restore()` at line 248 emits `{ type: "create", path: "/", node: this.root }` — listeners will see a synthetic "create" for root, which may trigger redundant UI updates.

**Niotepad Store (`src/infra/niotepad/useNiotepadStore.ts`):**

Clean design. `schedulePersist()` reads from `getState()` at timeout time (correct — avoids stale closure). Geometry persisted to localStorage synchronously on change.

Issues:
- Niotepad data is purely client-local. Clearing browser data or switching devices loses all notes. (Acknowledged as deferred.)
- `NiotepadSnapshot.version` is hardcoded `1` — no migration handler for future schema changes.
- `JSON.parse(data) as NiotepadSnapshot` at `indexedDbNiotepad.ts:55` — no validation.
- `readGeometry()` (line 113) reads from `storageAdapter` at module load time, which may run during SSR before localStorage is available.

**Convex ↔ Zustand sync:**

The boundary is clean-by-design:
- VFS (Zustand + IndexedDB): live editing, multi-file state
- `codeSnapshots` (Convex): persisted single-file snapshots per language, used for resume

The gap: VFS can hold a multi-file project, but `codeSnapshots` saves only one snapshot per `(userId, lessonId, language)` triple. In a multi-file project with multiple `.py` files, only one code state can be persisted to Convex. The actual VFS tree is not persisted to Convex.

### Data Flow Assessment

**Chat message lifecycle:**

1. Client sends user message → `createChatMessage` mutation → stored in Convex → real-time update to client
2. Client hits `/api/nio/chat` (SSE) → server streams tokens → client renders streaming text
3. On stream completion → `persistAssistantMessage` called fire-and-forget: `void persistAssistantMessage(...).catch(console.error)`

**Problem:** If step 3 fails (network error, Convex down), the user sees the assistant response in the UI but it is never written to Convex. On next page load, the conversation history will be incomplete — the assistant turn is missing. No retry, no client-side fallback.

---

**Rate limit fail-open:**

`route.ts:606-611`: If `consumeAiRateLimit` throws (any error), `rateLimitDecision` remains `null`. The subsequent `if (rateLimitDecision && !rateLimitDecision.ok)` check is `false` and the request proceeds. **Rate limiting fails open — under any Convex error condition, all users are effectively unthrottled.**

---

**Circular dependencies:** None found. Domain types flow one direction: `convex/ → src/domain/ (shared) ← src/infra/ ← src/ui/`. No cycles.

### Issues Summary — Data Management

| Priority | Location | Issue |
|----------|----------|-------|
| Critical | `convex/resume.ts:257` | `getResumeData` full table scan (all users' frames, filtered in JS) |
| Critical | `convex/content.ts:178` | `getLessonCountsByCourse` full table scan |
| Medium | `route.ts:606` | Rate limiting fails open on Convex error |
| Medium | `route.ts:471,484` | `persistAssistantMessage` fire-and-forget; silent data loss risk |
| Medium | `convex/chat.ts:176` | Any authenticated user can write `role: "assistant"` messages |
| Medium | `convex/ingest.ts:521,612` | One-time migration mutations never removed |
| Medium | `convex/ingest.ts:98,398` | `ingestCs50x2026` ≈ duplicate of `ingestCourse`; dead legacy path |
| Medium | Multi-step ingest | Non-atomic — no recovery from partial failure |
| Medium | `schema.ts:136` vs `chat.ts:32` | `videoTimeSec` optional in schema, non-optional in type mapping |
| Low | `useFileSystemStore.ts` | `currentLessonId` module-level variable could persist stale value |
| Low | All tables | No production data retention policy (frames, codeSnapshots, rateLimits grow unbounded) |
| Low | IndexedDB backends | No VFS/Niotepad IndexedDB migration strategy |
| Low | IndexedDB backends | `JSON.parse()` as Type without validation in both IndexedDB backends |
| Low | `schema.ts` | `feedback.category` accepts any string — no union validation |
| Low | `schema.ts` | `events.metadata` partially duplicates top-level `lessonId/userId` fields |


---

## 8. API DESIGN

### API Route Assessment

**`/api/nio/route.ts` — SSE chat endpoint:**

The overall design is sound. Request validation (`validateNioChatRequest`) is thorough. The fallback chain (Convex transcript → SRT subtitle → YouTube innertube) is well-structured with `Promise.allSettled`. Abort signal propagation via `request.signal.addEventListener("abort", abort)` is correct.

**Issues:**

- **No request body size cap.** `validateNioChatRequest` validates types and non-emptiness but does not enforce byte limits on `userMessage`, `code.code`, or `recentMessages`. The context budget check (`buildNioContext`) truncates at ~12KB, but parsing a multi-MB body first is still costly.

- **`resolveConvexAuthHeader:104` — Checks for literal `"undefined"`/`"null"` in the authorization header.** `if (trimmed.includes("undefined") || trimmed.includes("null")) { return null; }` — compensating for a client-side bug where the auth token is interpolated before it is available. A client sending `"Bearer undefined"` gets treated as "no auth header" rather than an auth error.

- **`isStubPreview():57-60` — Reads `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW` (a publicly visible env var) on the server.** Stub mode decision can be observed by clients. Acceptable for E2E testing, not for security-sensitive contexts.

- **Stream iteration has no timeout.** `streamGemini`, `streamOpenAI`, `streamAnthropic` set a 60s `AbortController` timeout on the initial HTTP fetch only. The `while(true)` async generator loop reading the response stream (`route.ts:423-437`) has no independent timeout. A hung provider that keeps the connection open but sends no tokens will block the request handler indefinitely.

---

**`/api/gmail/callback/route.ts` — OAuth callback:**

Three security gaps:

1. **No CSRF state parameter validation** — OAuth 2.0 requires a state parameter to prevent CSRF. The callback accepts any `code` from Google without verifying a state nonce. (`callback/route.ts:6`)
2. **No authentication/authorization check** — Endpoint is publicly reachable. Any caller who can obtain a valid Google code for the target account can trigger token exchange and store credentials. Should require admin authentication. (`callback/route.ts:5`)
3. **Error message exposes internals** — Raw exception message returned to caller at line 31.

### Convex API Assessment

**Function naming — mostly consistent:**
- `ensureChatThread` — clearly signals upsert semantics ✓
- `upsertFrame`, `upsertCodeSnapshot` ✓
- `ingestCs50x2026` — couples function name to course content; will mislead future developers ✗
- `completeAssistantMessage` — not obviously an insert; `saveAssistantMessage` would be clearer ✗

**Validators:**
- `getChatMessages:limit` — `v.number()` with no min/max. Client can pass `limit: 0` (returns empty) or `limit: 1000000` (returns a huge page). Should be clamped or validated.
- `ingestToken: v.optional(v.string())` — correct: optional allows admin-auth fallback.
- All mutation args have proper `v.*` validators.

**Return types:**
- `getLessonCountsByCourse` returns `Record<string, number>` where keys are raw Convex document IDs. This leaks the internal ID format to callers. (`content.ts:180: const key = lesson.courseId as unknown as string`)
- All other query/mutation return types are consistent.

**Authorization model:**
- Standard pattern: `requireQueryUser / requireMutationUser / requireMutationAdmin` — all correctly placed.
- Dev bypass (`NIOTEBOOK_DEV_AUTH_BYPASS`) is guarded by either preview flag or explicit dev override — no accidental prod exposure.
- `userApiKeys` public mutations (`remove`, `setActiveProvider`) skip the shared `requireMutationUser` helper and query the identity directly — slight inconsistency but equivalent in effect.

### Contract Clarity Assessment

**Shared types between client and server:**

The `src/domain/` layer is cleanly shared. Types like `ChatMessageSummary`, `FrameSummary`, `NioChatRequest` are defined once and used by both sides. `DomainId<T>` provides nominal typing at compile time.

**`DomainId<T>` is a phantom type — no runtime enforcement:**

`type DomainId<T extends string> = string & { __tableName: T; __domain?: T }` — `toDomainId` and `toGenericId` are both `as unknown as` casts at runtime — they are identity functions. Any string can be passed where a `DomainId<"users">` is expected and TypeScript will not catch it after JSON deserialization.

**Implicit contract: `videoTimeSec` in `chatMessages`:**

`schema.ts:136` declares `videoTimeSec: v.optional(v.number())`. `ChatMessageRecord:32` in `chat.ts` declares it `number` (non-optional). `toChatMessageSummary` maps it directly. If a record is stored without `videoTimeSec`, the mapping creates `videoTimeSec: undefined` which is then typed as `number` — silent type violation. Same issue for `timeWindowStartSec/timeWindowEndSec` (schema lines 137-138).

**Implicit contract: `createChatMessage` does not set telemetry fields:**

`createChatMessage` returns a `ChatMessageSummary` without `provider`, `model`, `latencyMs`, `usedFallback`, `contextHash` (all `undefined`). `completeAssistantMessage` sets them. Callers must distinguish by role, not by presence of these fields.

**Events system — type-safe but validator gaps:**

`EventMetadataInput` is typed as `Record<string, string | number | boolean | undefined>`. The validators in `events.ts:224–338` use truthy checks (`metadata.inviteId && metadata.createdBy`) rather than type-specific checks — `metadata.inviteId = 0` would fail the check, but `metadata.inviteId = "anything"` passes even if it is not a valid `InviteId`.

### AI Provider Interface Assessment

**Provider abstraction — `src/infra/ai/providerTypes.ts`:**

The `NioProviderStreamResult` interface (`{ provider, model, stream: AsyncIterable<string> }`) is a clean contract. `NioProviderStreamError` is a proper typed error class with `code`, `status`, `provider` fields. Adding a new provider requires changes in 4 places: `NioProviderId` union, new `*Stream.ts` file, a case in `streamWithByok`, and schema validator unions.

---

**Groq is dead code:**

`groqStream.ts` implements `streamGroq` using a server-side `GROQ_API_KEY` env var. But `route.ts` only calls `streamWithByok`, which routes to `gemini`, `openai`, or `anthropic` based on the user's BYOK provider (`route.ts:366-388`). Groq is never reached. `fallbackGate.ts` and `groqStream.ts` are imported nowhere in `route.ts`. They are effectively dead code — `NioProviderId` includes `"groq"` but the router does not handle it.

---

**Stream iteration timeout gap:**

Each provider's `streamX` function sets a 60s `AbortController` on the fetch request. But `clearTimeout(timeout)` in the `finally` block cancels the timeout as soon as the HTTP response headers arrive (not when the stream ends). The `while(true)` loop reading stream chunks has no independent timeout. A pathological provider that sends a 200 response but then stalls in the body would block the generator indefinitely.

---

**In-process caches are unreliable in serverless:**

`subtitleFallback.ts:12` and `youtubeTranscriptFallback.ts:12` use module-level `Map` with 15-minute TTLs. In serverless environments (Vercel functions), each invocation may run in a fresh container where the Map is empty. The caches provide no benefit in cold-start scenarios and can mislead debugging.

---

**Prompt injection mitigation — `/g` flag regex concern:**

`promptInjection.ts:6–17` defines `INJECTION_PATTERNS` as a module-level `RegExp[]` with `/gi` flags. Because these are shared stateful regex objects with `/g` flags, repeated `.test()` calls advance `lastIndex`. The paired `.replace()` call resets `lastIndex` to 0, so in single-threaded JS this is currently safe. However, using stateful shared regex objects as module-level constants is a maintainability hazard — any future change to the call pattern (e.g., concurrent promises) could introduce a real bug.

### Issues Summary — API Design

| Priority | Location | Issue |
|----------|----------|-------|
| Critical | — | None |
| Medium | `route.ts:471,484` | `persistAssistantMessage` fire-and-forget; assistant messages silently lost on Convex failure |
| Medium | `route.ts:606–611` | Rate limit check fails open on any error — all requests permitted under Convex outage |
| Medium | `gmail/callback/route.ts:5` | No OAuth state/nonce validation (CSRF risk) and no authentication gate |
| Medium | `route.ts` | No body size limit before JSON.parse() and validateNioChatRequest |
| Medium | `groqStream.ts + fallbackGate.ts` | Dead code; `groq` is in `NioProviderId` but unreachable in `streamWithByok` |
| Medium | Stream iteration | No timeout — fetch timeout cancelled on response headers, not stream completion |
| Low | `route.ts:104` | `"undefined"`/`"null"` string check in auth header compensates for a client bug |
| Low | `route.ts:55-60` | `NEXT_PUBLIC_*` env var read server-side for stub mode; observable by clients |
| Low | `content.ts:180` | `getLessonCountsByCourse` leaks raw Convex IDs as Record keys |
| Low | `chat.ts:134` | `limit: v.number()` without min/max bounds on pagination size |
| Low | `events.ts:226` | Event metadata validators use truthy checks, not type-specific validation |
| Low | `subtitleFallback.ts:12`, `youtubeTranscriptFallback.ts:12` | Module-level caches unreliable in serverless |
| Low | `/api/nio/chat` | No API versioning |
| Low | `gmail/callback/route.ts:31` | Raw exception message leaked in error response |

### Recommendations

**Immediate (correctness/data integrity):**
1. Fix `getResumeData` — replace full `frames` table scan with index query: `.withIndex("by_userId_lessonId", q => q.eq("userId", ...))` at `convex/resume.ts:257`.
2. Fix `getLessonCountsByCourse` — load only lessons for a given `courseId`, or replace with a Convex aggregate.
3. Make rate limiting fail closed — if `consumeAiRateLimit` throws, return a 503 or treat as rate-limited, not as a pass (`route.ts:606–611`).
4. Retry or queue `persistAssistantMessage` — at minimum, log a structured error with enough context to replay the write, or move persistence before stream close.
5. Restrict `createChatMessage` to `role: "user"` only — server-side; `completeAssistantMessage` is the correct path for assistant role.

**Security:**
6. Add OAuth state/nonce to Gmail callback — validate state param against a server-side nonce stored in session, add admin auth check.
7. Add request body size limit to `/api/nio/chat` (e.g., `Content-Length` check or request body reader with byte limit before JSON parsing).
8. Fix client auth bug causing `"undefined"` in Authorization header rather than compensating server-side.

**Housekeeping:**
9. Remove one-time migrations (`migrateCs50SqlPlaylistId`, `migrateCs50VideoFixes`) from `ingest.ts`.
10. Delete `groqStream.ts` and `fallbackGate.ts` or re-integrate Groq into `streamWithByok` if still desired.
11. Add stream iteration timeout — use a `Promise.race()` between the async generator and a timeout rejection in each provider stream function.
12. Add `limit` validation bounds to `getChatMessages` (e.g., clamp to 1–100).
13. Add `by_createdAt` or compound index on `chatMessages` for the maintenance cleanup query, or accept the full scan given its infrequency.
14. Add validation on IndexedDB JSON parse — use a version-aware schema check on `loadProject`/`loadNotebook` to handle format migrations gracefully.


---

## Section 9 — Consolidated Priority Matrix

All findings from all 8 verticals, deduplicated and ranked by priority. Total: 50 findings.

### Priority Definitions

| Priority | Label | Action |
|----------|-------|--------|
| P0 | Critical | Fix before next deploy. Security, data-loss, or correctness breaking |
| P1 | High | Fix this sprint. Significant risk or technical debt compounding |
| P2 | Medium | Fix next sprint. Quality, reliability, or observability gaps |
| P3 | Low | Backlog. Minor issues, polish, future-proofing |

---

### P0 — Critical (Fix Before Next Deploy)

| # | Vertical | Location | Finding |
|---|----------|----------|---------|
| 1 | Security | `convex/auth.ts:43–46` | PII logged on auth failure: `email` + `tokenIdentifier` written to Convex logs |
| 2 | Security | `gmail/callback/route.ts:5` | No OAuth CSRF state validation and no authentication gate on Gmail OAuth callback |
| 3 | Security | `api/nio/route.ts:668` | SSRF: user-supplied `subtitlesUrl` passed directly to `fetch()` with no domain allowlist |
| 4 | Security/API | `api/nio/route.ts:606–611` | Rate limiter fails open: any Convex error passes all requests through unchecked |
| 5 | Data | `convex/resume.ts:257` | `getResumeData` performs a full table scan across ALL users' `frames` — no index filter on userId |

---

### P1 — High (Fix This Sprint)

| # | Vertical | Location | Finding |
|---|----------|----------|---------|
| 6 | Architecture | `convex/ops.ts` (649 lines) | God file: auth, enrollments, events, code-run tracking, rate-limiting in one module |
| 7 | Architecture | `api/nio/route.ts` (943 lines) | God route: orchestrates auth, rate-limiting, context-building, streaming, persistence |
| 8 | Architecture | `src/ui/panes/CodePane.tsx` (648 lines) | God component: editor, terminal, file-tree, bookmark, execution logic combined |
| 9 | Code Quality | `convex/ops.ts:getCodeExecutionCount` | Bug: queries `"code_executed"` event; correct type is `"code_run"` — always returns 0 |
| 10 | Code Quality | `api/nio/route.ts:471,484` | `persistAssistantMessage` called fire-and-forget — silent data loss on Convex failure |
| 11 | Security | `src/infra/ai/promptInjection.ts` | Zero tests — critical security module with no test coverage whatsoever |
| 12 | Security | Implicit in BYOK flow | User API keys stored in `localStorage` — no sessionStorage or memory-only alternative |
| 13 | Testing | `tests/e2e/auth.e2e.ts:18` | Tautological assertion: `expect(hasBoot \|\| hasClerk \|\| true).toBe(true)` — always passes |
| 14 | Performance | `src/infra/runtime/cExecutor.ts:61,95` | JSCPP `run()` blocks the main thread; `stop()` is a no-op — runaway C programs freeze the UI |
| 15 | Performance | `src/infra/runtime/rExecutor.ts:52` | WebR CDN URL pinned to `v0.5.0` but `package.json` requires `^0.5.8` — version mismatch |
| 16 | DevOps | `sentry.*.config.ts:8` | `tracesSampleRate: 1.0` in all three Sentry configs — 100% tracing in production; extreme cost |
| 17 | DevOps | `next.config.ts` | No global security headers: missing `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `CSP` |
| 18 | DevOps | `next.config.ts:21–25` | No Sentry source map upload configured — production errors unresolvable to source lines |

---

### P2 — Medium (Fix Next Sprint)

| # | Vertical | Location | Finding |
|---|----------|----------|---------|
| 19 | Code Quality | `CodePane.tsx` + `AiPane.tsx` | Bookmark logic duplicated across two components — should be extracted to a shared hook |
| 20 | Code Quality | `CodePane.tsx` | DOM mutation via `getElementById("niotebook-runtime-frame")` bypasses React data flow |
| 21 | Code Quality | `promptInjection.ts:6–17` | Module-level `/gi` regex with shared `lastIndex` — hazardous pattern for concurrent calls |
| 22 | Code Quality | `groqStream.ts`, `fallbackGate.ts` | Dead code: Groq unreachable in `streamWithByok`; modules exist but are never called |
| 23 | Code Quality | `convex/ingest.ts` | One-time migration functions (`migrateCs50SqlPlaylistId`, `migrateCs50VideoFixes`) still present |
| 24 | Security/API | `api/nio/route.ts` | No request body size limit before `JSON.parse()` + `validateNioChatRequest` |
| 25 | API | `api/nio/route.ts:104` | Server-side `"undefined"` string check compensates for a client-side auth header bug |
| 26 | API/Performance | All stream routes | No per-stream timeout after headers received — malformed streams block indefinitely |
| 27 | API | `/api/nio/chat` | No API versioning scheme — breaking changes require coordinated client/server deploys |
| 28 | API/Data | `content.ts:180` | `getLessonCountsByCourse` leaks raw Convex internal IDs as Record keys to clients |
| 29 | API | `chat.ts:134` | `limit: v.number()` pagination has no min/max bounds — clients can request unbounded pages |
| 30 | API | `gmail/callback/route.ts:31` | Raw exception message leaked in JSON error response to client |
| 31 | Performance | `src/infra/runtime/` | No Pyodide/WebR preloading — first Python/R execution incurs full WASM download each session |
| 32 | Performance | CodeMirror setup | Language support imported dynamically per-keystroke context — no preload or bundled modules |
| 33 | Performance | Module-level caches | `subtitleFallback.ts:12`, `youtubeTranscriptFallback.ts:12` caches unreliable in serverless/cold-start |
| 34 | Testing | `tests/e2e/` | No mobile viewport coverage in E2E suite — responsive layouts untested |
| 35 | Testing | `tests/` | No Convex mutation/query unit tests — backend correctness untested |
| 36 | Testing | `tests/` | No integration tests for rate limiter behavior at boundary conditions |
| 37 | Architecture | `src/infra/vfs/` | No depth limit or node count cap on VFS — large projects could OOM the tab |
| 38 | Data | `convex/schema.ts` | `chatMessages` lacks `by_createdAt` index — cleanup maintenance query does full table scan |
| 39 | Data | `convex/` | No DB migration framework — schema changes require manual data fixes or ad hoc scripts |

---

### P3 — Low (Backlog / Polish)

| # | Vertical | Location | Finding |
|---|----------|----------|---------|
| 40 | API | `convex/chat.ts:createChatMessage` | Mutation accepts any `role` value — should restrict to `"user"` only (server-side) |
| 41 | API | `convex/events.ts:226` | Event metadata validators use truthy checks not type-specific guards |
| 42 | API | `gmail/callback/route.ts` | Raw exception message leaked in error response |
| 43 | API | `api/nio/route.ts:55–60` | `NEXT_PUBLIC_*` env vars read server-side for stub mode — observable by clients |
| 44 | Data | `convex/` | Row-level isolation on `chatMessages` not enforced at read layer — relies on client to pass own userId |
| 45 | Data | `src/infra/vfs/` | `loadProject` / `loadNotebook` perform no version-aware schema validation on IndexedDB JSON |
| 46 | Data | `convex/resume.ts` | `frames` table has no TTL or cleanup policy — grows unboundedly |
| 47 | Performance | `src/infra/runtime/` | Stale Pyodide version — newer releases offer faster startup and smaller bundle |
| 48 | DevOps | `package.json` | `check:any` and `check:unknown` only enforced on `convex/` + `tests/` + `src/domain/` — not all source |
| 49 | DevOps | CI | No automated bundle size tracking — regressions undetectable until Lighthouse audit |
| 50 | Architecture | `src/infra/runtime/` | No formal contract (interface/type) for runtime executor outputs — each executor has ad hoc shapes |

---

## Closing Note

**Analysis conducted:** 2026-03-07  
**Team:** 5 specialized review agents (Architecture, Security, Testing, Performance, Data/API) + Orchestrator  
**Coverage:** 8 SWE verticals, ~80 source files read, ~250 specific file:line citations  
**Scope:** Read-only review — no code was modified during this analysis  
**Total findings:** 50 (5 P0 · 13 P1 · 21 P2 · 11 P3)  
**Recommended next action:** Address all P0 findings before the next production deployment. Schedule P1 items for the current sprint.

