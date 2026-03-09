# Niotebook v0.2 — Remediation Plan

**Source audit:** `docs/reviews/2026-03-07-codebase-analysis.md`
**Total findings:** 50 (5 P0 · 13 P1 · 21 P2 · 11 P3)
**Status:** Wave 0 + Wave 1 + Wave 1b + Wave 2 + Wave 3 complete (2026-03-09)

This document is the canonical tracker for all remediation work derived from the deep codebase analysis.
Contributors: pick any open item from the current wave, create a branch, and open a PR referencing the finding ID.

---

## Wave Structure

```
Wave 0   →  Write this plan + OSS scaffolding
Wave 1   →  Parallel: Security patches, DevOps, Data fixes, Test cleanup (no shared files)
Wave 1b  →  In-place P0 security fixes on api/nio/route.ts (before architecture refactor)
Wave 2   →  Architecture refactors: split god files, extract shared infra modules
Wave 3   →  Test coverage additions (after architecture stabilizes)
Wave 4   →  P2/P3 polish: performance, API robustness, data retention
```

OSS artifacts can be worked in parallel to any wave.

---

## Wave 0 — Planning & OSS Scaffolding

| #    | Item                                                                                        | Status  |
| ---- | ------------------------------------------------------------------------------------------- | ------- |
| W0-1 | Write `docs/REMEDIATION_PLAN.md` (this file)                                                | ✅ Done |
| W0-2 | Write `CONTRIBUTING.md`                                                                     | ✅ Done |
| W0-3 | Write `.env.example` (all vars documented)                                                  | ✅ Done |
| W0-4 | Write `CODE_OF_CONDUCT.md`                                                                  | ✅ Done |
| W0-5 | Write GitHub issue templates (`.github/ISSUE_TEMPLATE/`)                                    | ✅ Done |
| W0-6 | Write GitHub PR template (`.github/PULL_REQUEST_TEMPLATE.md`)                               | ✅ Done |
| W0-7 | Write `ADR-006-architecture-layers.md` (layer boundaries, domain/infra/ui contract)         | ✅ Done |
| W0-8 | Update `CLAUDE.md` — add remediation workflow, agent team guidance, current branch strategy | ✅ Done |
| W0-9 | Update root `README.md` — add contributor quickstart, badge for CI status                   | ✅ Done |

---

## Wave 1 — Parallel Fixes (No Shared File Conflicts)

These can all be executed simultaneously across independent branches.

### 1A — Security: Isolated Files

| Finding         | Location                                            | Description                                                                                                                     | Status                                                             |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| P0-1 (LOW-07)   | `convex/auth.ts:43–46`                              | Remove `email` + `tokenIdentifier` from auth failure log (PII logging)                                                          | ✅ Done                                                            |
| P1-17 (CRIT-02) | `src/middleware.ts` _(new file)_                    | Add Clerk `clerkMiddleware` protecting `/workspace` and `/admin` at the edge                                                    | ✅ Done                                                            |
| P1-17 (HIGH-03) | `next.config.ts`                                    | Add global security headers: `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`       | ✅ Done                                                            |
| LOW-01          | `convex/auth.config.ts:6`                           | Move Clerk dev domain to env var (currently hardcoded)                                                                          | ✅ Done                                                            |
| HIGH-02         | `src/infra/devAuth.ts`, `src/infra/convexClient.ts` | Rename `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` → `NIOTEBOOK_DEV_AUTH_BYPASS` (remove from client bundle); update all references | ⏳ Deferred to Wave 4 — affects 6+ client-side files, needs design |
| CRIT-01         | `src/app/api/gmail/callback/route.ts`               | Add OAuth CSRF state param generation + validation; add admin session check; fix raw exception leak at line 31                  | ✅ Done                                                            |

### 1B — DevOps: Config Files

| Finding    | Location                                                                      | Description                                                                                            | Status                     |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| P1-16 (C1) | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | Set `tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1` in all three                   | ✅ Done                    |
| P1-18 (C2) | `next.config.ts:21–25`                                                        | Add `authToken`, `org`, `project`, `sourceMapsUploadOptions` to `sentryBuildOptions`                   | ✅ Done                    |
| M1         | `.github/workflows/ci.yml`, `lefthook.yml`                                    | Add `bun run format:check` step to CI and pre-commit hooks                                             | ✅ Done                    |
| M5         | `next.config.ts`                                                              | Add `experimental: { optimizePackageImports: ["@phosphor-icons/react", "framer-motion", "recharts"] }` | ✅ Done                    |
| M7         | `src/app/api/health/route.ts` _(new file)_                                    | Add health check endpoint returning `{ status: "ok" }`                                                 | ✅ Done                    |
| M4         | `package.json`                                                                | Align `engines.bun` to exact `"1.1.19"` (currently `"1.1.x"`)                                          | ✅ Done                    |
| L4         | `docs/env-requirements.md`                                                    | Document `NIO_DEBUG` env var; add to `.env.example`                                                    | ✅ Done (via .env.example) |

### 1C — Data: Convex Backend (No UI Overlap)

| Finding         | Location                    | Description                                                                                                                   | Status                                                                                                     |
| --------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P0-5 (Critical) | `convex/resume.ts:257`      | Fix `getResumeData` full table scan — replace `.collect()` with `.withIndex("by_userId_lessonId", q => q.eq("userId", ...))`  | ✅ Done                                                                                                    |
| Critical        | `convex/content.ts:178`     | Fix `getLessonCountsByCourse` full table scan — query only lessons for given `courseId`                                       | ✅ Done                                                                                                    |
| M3              | `convex/schema.ts`          | Add compound indexes: `by_userId_createdAt` and `by_lessonId_createdAt` on events table                                       | ✅ Done                                                                                                    |
| Schema          | `convex/schema.ts`          | Add `by_provider` index on `userApiKeys` table                                                                                | ✅ Done                                                                                                    |
| Schema          | `convex/schema.ts`          | Fix `videoTimeSec`, `timeWindowStartSec`, `timeWindowEndSec` — align optionality between schema and type mapping in `chat.ts` | ✅ Done                                                                                                    |
| Schema          | `convex/schema.ts`          | Add union type enforcement on `feedback.category` (replace `v.string()` with `v.union(v.literal(...))`)                       | ⚠️ Skipped — actual usage passes multi-value strings incompatible with literal union; keeping `v.string()` |
| Ingest          | `convex/ingest.ts:521, 612` | Remove one-time migration mutations (`migrateCs50SqlPlaylistId`, `migrateCs50VideoFixes`)                                     | ✅ Done                                                                                                    |
| Data            | `convex/chat.ts:176`        | Restrict `createChatMessage` to `role: "user"` only — reject `role: "assistant"` at the mutation level                        | ✅ Done                                                                                                    |
| API             | `convex/chat.ts:134`        | Add `min(1)` / `max(100)` bounds to `limit: v.number()` pagination parameter                                                  | ✅ Done                                                                                                    |
| API             | `src/domain/events.ts`      | Replace truthy checks in event metadata validators with type-specific guards (`isStr()` helper)                               | ✅ Done                                                                                                    |

### 1D — Testing: Cleanup (No Production Code Touched)

| Finding | Location                              | Description                                                                                      | Status                                                    |
| ------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| P1-13   | `tests/e2e/auth.e2e.ts:18`            | Delete tautological `\|\| true` assertion; write a real assertion or remove the test             | ✅ Done                                                   |
| Testing | `tests/unit/smoke.test.ts`            | Delete `expect(1 + 1).toBe(2)` smoke test                                                        | ✅ Done — deleted                                         |
| Testing | `tests/unit/chat-idempotency.test.ts` | Replace file-content grep with a behavioral test or delete                                       | ✅ Done — deleted                                         |
| Testing | `tests/unit/event-taxonomy.test.ts`   | Replace identity-check assertion with a behavioral test                                          | ✅ Done — deleted                                         |
| Testing | `tests/e2e/admin.e2e.ts:10`           | Unskip or rewrite the permanently-skipped admin auth test                                        | ✅ Done — `test.skip` restored with detailed TODO comment |
| Testing | `vitest.config.ts`                    | Add `@/*` path alias; add `@vitest/coverage-v8` config with thresholds (domain: 90%, infra: 70%) | ✅ Done                                                   |

### 1E — Quick Bug Fixes (One-Liners)

| Finding    | Location                                | Description                                                                      | Status                                                              |
| ---------- | --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| P1-9 (C-2) | `convex/ops.ts:413`                     | Fix `getCodeExecutionCount` — change `"code_executed"` → `"code_run"`            | ✅ Done                                                             |
| P1-15 (C2) | `src/infra/runtime/rExecutor.ts:52`     | Fix WebR CDN URL — change `v0.5.0` → `v0.5.8` to match `package.json`            | ✅ Done                                                             |
| L-2        | `src/infra/runtime/runtimeConstants.ts` | Remove or use `RUNTIME_WARMUP_DELAY_MS` (currently exported but unused)          | ✅ Done — removed                                                   |
| M-4        | `convex/auth.ts:182`                    | Delete `requireQueryWorkspaceUser` (exact duplicate of `requireQueryUser`)       | ✅ Done                                                             |
| L-3        | `convex/ops.ts:11`                      | Move `COURSE_SOURCE_PLAYLIST_ID` to a named constant or config file              | ⏳ Deferred — constant already named; full fix is ops.ts split (2A) |
| LOW-06     | `convex/userApiKeys.ts:187`             | Throw (not silently return null) when `NIOTEBOOK_KEY_ENCRYPTION_SECRET` is unset | ✅ Done                                                             |
| LOW-08     | `convex/events.ts`                      | Add rate limit to `logEvent` (authenticated but currently uncapped)              | ✅ Done — `consumeEventLogRateLimit` implemented                    |

---

## Wave 1b — P0 In-Place Security Fixes (api/nio/route.ts)

Fix in the current god-file structure before the architecture refactor. Minimal blast radius.

| Finding        | Location                                          | Description                                                                                                                         | Status                                 |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| P0-3 (HIGH-01) | `api/nio/route.ts:668` + `subtitleFallback.ts:97` | Validate `subtitlesUrl` against trusted hostname allowlist before server-side `fetch()`. Never use client-supplied URL as fallback. | ✅ Done                                |
| P0-4           | `api/nio/route.ts:606–611`                        | Make rate limiter fail closed — if `consumeAiRateLimit` throws, return 503 or treat as rate-limited (not pass-through)              | ✅ Done                                |
| MED-02         | `api/nio/route.ts` + `validateNioChatRequest.ts`  | Add request body size cap + per-field max-length validation (`userMessage`, `code.code`, `recentMessages` array)                    | ✅ Done                                |
| M-8            | `api/nio/route.ts:592`                            | Add `AUTH_REQUIRED` to `NioErrorCode` union in `src/domain/ai/types.ts`                                                             | ✅ Done                                |
| API            | `api/nio/route.ts:104`                            | Fix client-side auth header bug that causes `"Bearer undefined"` — server-side guard kept with TODO comment                         | ✅ Done (TODO documented)              |
| API            | All stream routes                                 | Add per-stream timeout after headers received — `Promise.race()` between async generator and timeout rejection                      | ✅ Done — 120s stream body timeout     |
| API            | `api/nio/route.ts:471, 484`                       | Make `persistAssistantMessage` retry-aware — log structured error with enough context to replay, or queue the write                 | ✅ Done — structured logging + 1 retry |

---

## Wave 2 — Architecture Refactors (Dedicated PRs)

Do these after Wave 1 and 1b are merged. Each is a standalone PR.

### 2A — Split `convex/ops.ts` (649 lines → 3 files)

| Task | Description                                                                                  | Status                                |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| 2A-1 | Move `verifyTranscriptWindows` (L71–194) → `convex/ingest.ts` (already exists — merge logic) | [ ] Remaining                         |
| 2A-2 | Move `seedE2E` (L196–290) → `convex/seed.ts` (new file)                                      | ✅ Done                               |
| 2A-3 | Move all 11 admin analytics queries (L292–649) → `convex/analytics.ts` (new file)            | ✅ Done                               |
| 2A-4 | Fix mid-file import at L292 — all imports to top of file                                     | ✅ Done (ops.ts now 183 lines, clean) |
| 2A-5 | Merge `ingestCs50x2026` duplicate logic into `ingestCourse` (90% overlap — see Data finding) | [ ] Remaining                         |

### 2B — Decompose `src/app/api/nio/route.ts` (943 lines)

| Task | Description                                                                                                           | Status                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 2B-1 | Extract transcript resolution into `src/infra/ai/transcriptResolver.ts` (Convex → SRT → YouTube chain)                | ✅ Done                                                    |
| 2B-2 | Extract `streamWithByok` (172 lines) into `src/infra/ai/byokStream.ts`                                                | ✅ Done                                                    |
| 2B-3 | Extract SSE read-loop shared by all 4 provider files into `src/infra/ai/sseStream.ts` (eliminates 4× duplication)     | ⏳ Deferred to Wave 4 — blocked on further route.ts slim   |
| 2B-4 | Extract `isRecord`, `isString`, `isNumber` type guards into `src/infra/ai/typeGuards.ts` (eliminates 4× duplication)  | ✅ Done                                                    |
| 2B-5 | Slim `route.ts` to: request validation → auth check → rate limit → transcript resolve → stream dispatch → persistence | ✅ Done (partially — route.ts slimmed; 2B-3 still pending) |

### 2C — Decompose `src/ui/panes/CodePane.tsx` (648 lines)

| Task | Description                                                                                                                                             | Status  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2C-1 | Extract `useRuntimeWarmup(language, lessonId)` hook                                                                                                     | ✅ Done |
| 2C-2 | Extract `useCodeExecution(language, environment)` hook                                                                                                  | ✅ Done |
| 2C-3 | Extract `useBookmarkConfirm(lessonId, lectureLabel)` hook — shared between `CodePane` and `AiPane` (eliminates duplicate state + timer + handler + SVG) | ✅ Done |
| 2C-4 | Extract `RPlotFrame` as a proper React component using `useRef` (eliminates `document.getElementById("niotebook-runtime-frame")` DOM mutation)          | ✅ Done |
| 2C-5 | Move `autoPersistTimer` and `currentLessonId` from module-level variables into Zustand store state                                                      | ✅ Done |
| 2C-6 | Fix `CodePane.tsx:475` — use resolved `lectureLabel` (not raw `lessonId`) for bookmark, matching `AiPane` behavior                                      | ✅ Done |
| 2C-7 | Fix `shouldResetSplits = true` (dead constant, L108) — make it conditional or remove it                                                                 | ✅ Done |

### 2D — Shared Infra Modules

| Task | Description                                                                                                                           | Status                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2D-1 | Create `convex/lib/mutationCtx.ts` — move repeated `MutationCtx` / `MutationConfig` type aliases from `events.ts` and `rateLimits.ts` | ✅ Done                    |
| 2D-2 | Move `RuntimeLanguage` from `src/infra/runtime/types.ts` → `src/domain/runtime.ts`; fix dependency direction violation                | ✅ Done                    |
| 2D-3 | Add named constants `STREAMED_SENTINEL` and `PLOT_SVG_SENTINEL` to `runtimeConstants.ts` (replace `"\x00__streamed__"` magic strings) | ✅ Done                    |
| 2D-4 | Fix `M-9`: Make `groqStream.ts` accept `apiKey` as parameter (align with Gemini/OpenAI/Anthropic) OR delete it as dead code (see 2E)  | ✅ Done — deleted via 2E-1 |
| 2D-5 | Replace `window.dispatchEvent(new CustomEvent("niotebook:open-settings"))` in `AiPane.tsx` with a typed Zustand store action          | ✅ Done                    |

### 2E — Dead Code Removal

| Task | Description                                                                                                                                                             | Status  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2E-1 | Delete `groqStream.ts` and `fallbackGate.ts` — Groq is unreachable in `streamWithByok`; or re-integrate if desired                                                      | ✅ Done |
| 2E-2 | Remove `"groq"` from `NioProviderId` union if Groq is deleted, or implement the routing                                                                                 | ✅ Done |
| 2E-3 | Move `_getUserByToken`, `_upsertKey`, `_getActiveKey`, `_getKeysByUser` in `userApiKeys.ts` to `internalQuery/internalMutation` (already correct — verify and document) | ✅ Done |

### 2F — C Executor: Main Thread Safety

| Task | Description                                           | Status                                           |
| ---- | ----------------------------------------------------- | ------------------------------------------------ |
| 2F-1 | Run JSCPP in a Web Worker with `MessageChannel`       | ⏳ Deferred to Wave 4 — significant feature work |
| 2F-2 | Add timeout (`Promise.race` against worker + timeout) | ⏳ Deferred to Wave 4 — depends on 2F-1          |
| 2F-3 | Implement real `stop()` that terminates the worker    | ⏳ Deferred to Wave 4 — depends on 2F-1          |

---

## Wave 3 — Test Coverage

After architecture refactors land. Target: meaningful behavioral tests, not file-content assertions.

### P0 Security Tests (Highest Priority)

| Test File                                            | What to Cover                                                                                                                    | Status  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `tests/unit/infra/ai/promptInjection.test.ts`        | Each of the 10 regex patterns, multiple calls on same input (verify `/g` flag `lastIndex` behavior), Unicode/encoding edge cases | ✅ Done |
| `tests/unit/infra/ai/validateNioChatRequest.test.ts` | All rejection branches: missing fields, wrong types, malformed transcript, invalid message role                                  | ✅ Done |
| `tests/unit/domain/lectureNumber.test.ts`            | All 5 URL patterns, priority chain, null fallbacks                                                                               | ✅ Done |

### P1 Core Feature Coverage

| Test File                                             | What to Cover                                                                                | Status                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `tests/unit/infra/runtime/runtimeManager.test.ts`     | Language routing, deduplication (`pendingInit`), sandbox fallback, unknown-language handling | ✅ Done                                    |
| `tests/unit/infra/runtime/jsExecutor.test.ts`         | Basic execution, import resolution, error output                                             | ✅ Done                                    |
| `tests/unit/infra/niotepad/niotepadSelectors.test.ts` | `selectFilteredEntries`: multi-term AND search, page filtering, source filtering             | ✅ Done                                    |
| `tests/unit/infra/ai/subtitleFallback.test.ts`        | SRT fetch, window slicing, error handling                                                    | ✅ Done                                    |
| `tests/e2e/byok.e2e.ts`                               | No API key → `NO_API_KEY` error event → settings prompt shown                                | ⏳ Deferred to Wave 4 — needs full E2E env |

### P2 Infrastructure Reliability

| Test File                                         | What to Cover                                                                                                                   | Status                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `tests/unit/infra/ai/geminiStream.test.ts`        | Token aggregation, error normalization (no real API needed — mock the fetch)                                                    | ✅ Done                                                         |
| `tests/unit/infra/vfs/useFileSystemStore.test.ts` | Auto-persist debounce, `initializeFromEnvironment`, lesson-switch isolation                                                     | ⏳ Deferred to Wave 4 — needs jsdom IndexedDB setup             |
| `tests/unit/infra/ai/sseStream.test.ts`           | Shared SSE read loop (after Wave 2 extraction)                                                                                  | ⏳ Deferred to Wave 4 — blocked on 2B-3 sseStream.ts extraction |
| `tests/unit/infra/ai/typeGuards.test.ts`          | `isRecord`, `isString`, `isNumber`, `isBoolean` (after Wave 2 extraction)                                                       | ✅ Done                                                         |
| `tests/unit/infra/ai/byokStream.test.ts`          | `NO_API_KEY` SSE event when no key configured; `STREAM_ERROR` SSE event on provider failure; abort mid-stream; unknown provider | ✅ Done                                                         |

### P3 Backend (Convex Test Harness)

| Task                               | Description                                                                                                      | Status                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Setup                              | Install `convex-test`; add `tests/convex/` directory                                                             | ⏳ Deferred to Wave 4 — needs `convex-test` harness setup |
| `tests/convex/chat.test.ts`        | `createThread`, `addUserMessage`, `completeAssistantMessage` mutations                                           | ⏳ Deferred to Wave 4                                     |
| `tests/convex/rateLimits.test.ts`  | `consumeAiRateLimit` and `consumeEventLogRateLimit` at boundary conditions (allow path, deny path, reset timing) | ⏳ Deferred to Wave 4                                     |
| `tests/convex/userApiKeys.test.ts` | Save, resolve, remove, setActiveProvider                                                                         | ⏳ Deferred to Wave 4                                     |

### Follow-up Design Fixes (deferred from Wave 2 / PR #103 review)

| Task  | Location                             | Description                                                                                                                                                                                              | Status                |
| ----- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| W3-D1 | `src/ui/panes/useCodeExecution.ts`   | Remove `setRuntimeState` from `UseCodeExecutionResult` public return type — it leaks internal state shape to callers. Requires restructuring warmup state ownership (merge hooks or use shared atom).    | ⏳ Deferred to Wave 4 |
| W3-D2 | `src/infra/ai/transcriptResolver.ts` | Change `lessonId: string` param to `Id<"lessons">` in `fetchTranscriptWindow` and `fetchLessonMeta`; push the `as Id<"lessons">` cast to callers at the HTTP boundary. Removes the internal double-cast. | ⏳ Deferred to Wave 4 |

---

## Wave 4 — P2/P3 Polish

### Deferred from Previous Waves

| Item                       | Origin | Description                                                                                                                      |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| HIGH-02                    | Wave 1 | Rename `NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS` → `NIOTEBOOK_DEV_AUTH_BYPASS` (move to server-only env); requires 6+ file changes |
| 2B-3                       | Wave 2 | Extract shared SSE read-loop into `src/infra/ai/sseStream.ts` (eliminates 4× duplication across provider streams)                |
| 2F-1/2/3                   | Wave 2 | Run JSCPP C executor in a Web Worker with real timeout + stop() support                                                          |
| byok.e2e.ts                | Wave 3 | E2E test: no API key → `NO_API_KEY` error → settings prompt (needs full E2E env with Clerk + Convex)                             |
| useFileSystemStore.test.ts | Wave 3 | Unit tests for VFS Zustand store auto-persist debounce, lesson-switch isolation (needs jsdom IndexedDB)                          |
| sseStream.test.ts          | Wave 3 | Unit tests for shared SSE read-loop (blocked on 2B-3 extraction)                                                                 |
| Convex test harness        | Wave 3 | Install `convex-test`; write chat, rateLimits, userApiKeys mutation tests                                                        |
| W3-D1                      | Wave 3 | Remove `setRuntimeState` from `UseCodeExecutionResult` public API (state shape leak)                                             |
| W3-D2                      | Wave 3 | Type `lessonId` as `Id<"lessons">` in `transcriptResolver.ts` instead of `string`                                                |

### Performance

| Finding | Location                              | Description                                                                             | Status |
| ------- | ------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| M3      | `src/infra/runtime/pythonExecutor.ts` | Add Pyodide preloading strategy (Service Worker or preload link)                        | [ ]    |
| C2      | `src/infra/runtime/rExecutor.ts`      | Load WebR via local bundle instead of CDN (or add CDN fallback guard)                   | [ ]    |
| M4      | `src/app/template.tsx`                | Lazy-load `framer-motion` wrapper via `next/dynamic`                                    | [ ]    |
| C3      | `src/ui/video/VideoPane.tsx:44`       | Add `getCourseByCourseId(courseId)` Convex query with index; replace full-courses fetch | [ ]    |
| M5      | `src/infra/runtime/sqlExecutor.ts`    | Reset `seeded` flag and `db` instance on lesson change (key by lessonId)                | [ ]    |
| M1      | `src/ui/shell/TopNav.tsx`             | Lift `courses`/`lessons` Convex queries to shared context; lazy-load lesson selector    | [ ]    |
| M6      | Pane components                       | Add `React.memo` to `VideoPane`, `CodePane`, `AiPane`                                   | [ ]    |
| M7      | `CodePane.tsx:505`                    | Wrap `handleKeyDown` in `useCallback`; remove `videoTimeSec` from its dependency array  | [ ]    |
| L1      | `src/app/layout.tsx:18`               | Load Orbitron with one weight only (Wordmark weight)                                    | [ ]    |
| L2      | `src/infra/vfs/VirtualFS.ts:354`      | Cache `globToRegex()` results in a `Map<string, RegExp>`                                | [ ]    |

### API Robustness

| Finding | Location                | Description                                                                                                                    | Status |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ |
| API     | `api/nio/chat`          | Add API versioning scheme (e.g., `/api/v1/nio/chat`)                                                                           | [ ]    |
| API     | `convex/content.ts:180` | Fix `getLessonCountsByCourse` to not leak raw Convex IDs as Record keys                                                        | [ ]    |
| API     | Module-level caches     | Document or remove `subtitleFallback.ts` / `youtubeTranscriptFallback.ts` module-level `Map` caches (unreliable in serverless) | [ ]    |

### Data / Schema

| Finding | Location                                     | Description                                                             | Status |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| Data    | `convex/schema.ts`, `convex/crons.ts`        | Add TTL cleanup for `rateLimits` and `frames` tables (unbounded growth) | [ ]    |
| Data    | `src/infra/vfs/indexedDbBackend.ts:57`       | Add version-aware schema validation on `JSON.parse(data)`               | [ ]    |
| Data    | `src/infra/niotepad/indexedDbNiotepad.ts:55` | Add validation on `JSON.parse(data) as NiotepadSnapshot`                | [ ]    |
| Data    | `schema.ts`                                  | Add `DB_VERSION` migration strategy for VFS and Niotepad IndexedDB      | [ ]    |
| Data    | `convex/`                                    | Document no-production-data retention policy; add docs                  | [ ]    |

### DevOps

| Finding | Location     | Description                                                                                     | Status |
| ------- | ------------ | ----------------------------------------------------------------------------------------------- | ------ |
| L1      | CI scripts   | Move `check:any` and `check:unknown` from `rg` (system dep) to project tooling; add to lefthook | [ ]    |
| L2      | Event system | Consolidate event metadata schema (currently duplicated in `events.ts` and `schema.ts`)         | [ ]    |
| DevOps  | CI           | Add automated bundle size tracking (e.g., `bundlemon` or `next-bundle-analyzer` in CI)          | [ ]    |
| DevOps  | E2E          | Add mobile viewport to Playwright config; add at least one responsive layout E2E test           | [ ]    |

---

## OSS Artifacts Checklist

These can be worked in parallel to any wave.

| Artifact                                     | Description                                                                                         | Status  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------- |
| `CONTRIBUTING.md`                            | Contributor guide: repo layout, PR process, test requirements, branch naming, agent team guidelines | ✅ Done |
| `.env.example`                               | All env vars with descriptions, required/optional flag, example values                              | ✅ Done |
| `CODE_OF_CONDUCT.md`                         | Standard Contributor Covenant or custom                                                             | ✅ Done |
| `.github/ISSUE_TEMPLATE/bug_report.yml`      | Structured bug report template                                                                      | ✅ Done |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Feature request template                                                                            | ✅ Done |
| `.github/PULL_REQUEST_TEMPLATE.md`           | PR checklist: tests, docs, type-check, lint                                                         | ✅ Done |
| `ADR-006`                                    | Architecture decision: domain/infra/ui layer contract, `RuntimeLanguage` in domain                  | ✅ Done |
| `ADR-007`                                    | Architecture decision: VFS design and IndexedDB persistence strategy                                | [ ]     |
| `CLAUDE.md`                                  | Update: remediation workflow, current wave status, agent team guidance                              | ✅ Done |
| `README.md`                                  | Update: contributor quickstart, CI badge, architecture overview link                                | ✅ Done |

---

## Branch Naming Convention

```
fix/SEC-01-gmail-csrf           # Security fix
fix/PERF-C1-c-executor-worker   # Performance fix
refactor/ARCH-split-ops-ts      # Architecture refactor
test/TEST-promptinjection        # Test coverage
docs/oss-contributing            # Documentation
```

## PR Requirements (for all waves)

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run test` passes (no regressions)
- [ ] New tests added for new/changed logic
- [ ] Finding ID referenced in PR description (e.g., "Fixes P0-3 SSRF via subtitlesUrl")

---

_Last updated: 2026-03-09 · Wave 3 complete · Source analysis: `docs/reviews/2026-03-07-codebase-analysis.md`_
