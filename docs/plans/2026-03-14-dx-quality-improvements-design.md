# DX & Quality Improvements Design

**Date:** 2026-03-14
**Branch:** `chore/dx-quality-improvements`
**Status:** Approved

## Overview

Three workstreams to improve Niotebook's developer experience, test coverage, and user-facing features:

1. **Niotepad Export to Markdown** — download notes as `.md` files
2. **Test Coverage Expansion** — Convex backend + domain layer gaps
3. **DX & OSS Readiness** — missing infrastructure for contributors and open-source release

## 1. Niotepad Export to Markdown

### Architecture

Pure client-side download: Zustand store → build markdown string → Blob → anchor click download.

No backend involvement. Works offline. Instant.

### Entry Formatting

| Source | Format in Markdown                                       |
| ------ | -------------------------------------------------------- |
| manual | Raw content (already markdown)                           |
| video  | `**MM:SS** — Lecture Title` header + raw content         |
| code   | Fenced code block with language from `metadata.language` |
| chat   | Fenced code block (plain, no language)                   |

### Filenames

- **Single page:** `niotepad-{slugified-title}-{YYYY-MM-DD}.md`
- **Export all:** `niotepad-all-{slugified-course-title}-{YYYY-MM-DD}.md`
- Slugify: lowercase, replace non-alphanum with hyphens, collapse multiples, trim
- Fallback title: `"notes"`

### UI

- Small download icon in `NiotepadDragHandle` toolbar (next to close button)
- Click opens dropdown: "Export Page" / "Export All"
- Dropdown dismisses on selection or click-outside
- No toast — browser download dialog is sufficient feedback

### New Files

- `src/domain/niotepadExport.ts` — `buildPageMarkdown(page)`, `buildAllPagesMarkdown(pages, courseTitle)`, `slugify(title)`
- `src/infra/niotepad/downloadFile.ts` — `downloadMarkdownFile(content, filename)` via Blob + anchor

### Modified Files

- `src/ui/niotepad/NiotepadDragHandle.tsx` — add export dropdown

## 2. Test Coverage Expansion

### Scope

**Convex backend (7 modules):**

- `auth.ts`, `users.ts`, `content.ts`, `transcripts.ts`, `lessonCompletions.ts`, `events.ts`, `analytics.ts`
- Pattern: existing `convex-test` from `tests/convex/setup.ts`
- Per file: 5-10 cases (happy path, auth guards, edge cases)

**Domain layer (4 modules):**

- `niotepad.ts` (type guards), `ids.ts` (ID factories), `lesson-completions.ts` (calculation logic), `content.ts` (selectors)
- Pattern: existing Vitest describe/it/expect
- Per file: 3-8 cases

**New feature test:**

- `niotepadExport.test.ts` — markdown building, slugification, fenced code blocks

### New Test Files (12)

```
tests/convex/auth.test.ts
tests/convex/users.test.ts
tests/convex/content.test.ts
tests/convex/transcripts.test.ts
tests/convex/lessonCompletions.test.ts
tests/convex/events.test.ts
tests/convex/analytics.test.ts
tests/unit/domain/ids.test.ts
tests/unit/domain/content.test.ts
tests/unit/domain/lesson-completions.test.ts
tests/unit/domain/niotepad.test.ts
tests/unit/domain/niotepadExport.test.ts
```

Estimated: ~80-100 new test cases (374 → ~460+).

### Skipped (deferred)

- UI component tests (need jsdom/testing-library, lower risk)
- Runtime executor tests (need WASM mocking, high complexity)
- `crons.ts`, `maintenance.ts`, `seed.ts`, `feedback.ts`, `idUtils.ts` (low risk / ops)
- `nio.ts`, `runtime.ts` (pure type defs, no logic)

## 3. DX & OSS Readiness

### 3.1 SECURITY.md (root)

Vulnerability reporting policy. Email: niotebook@gmail.com. 48h acknowledgment SLA. "Do NOT open public issues." Reference to OSS audit. Brief security posture summary.

### 3.2 React ErrorBoundary (`src/ui/shared/ErrorBoundary.tsx`)

Class component catching render errors. Fallback UI: "Something went wrong" + "Reload" button. Logs to console.error (Sentry captures via global handler). Wrapped in `src/app/layout.tsx` around children.

### 3.3 `setup` script (package.json)

`"setup": "bun install && cp -n .env.example .env.local && echo '... Ready ...'"`

### 3.4 `clean` script (package.json)

`"clean": "rm -rf .next node_modules .turbo"`

### 3.5 `dev:all` script (package.json)

`"dev:all": "npx concurrently -n convex,next -c blue,green \"bun run dev:convex\" \"bun run dev\""`

Adds `concurrently` as devDependency.

### 3.6 Dependabot (`.github/dependabot.yml`)

npm ecosystem, weekly, minor+patch only, 5 PR limit, grouped by type.

### 3.7 Troubleshooting guide (`docs/TROUBLESHOOTING.md`)

5-8 common issues: port conflicts, Convex deployment picker, lockfile mismatch, missing env vars, Clerk redirect loop, E2E lesson ID, TypeScript errors after pull.

### 3.8 Custom error classes (`src/domain/errors.ts`)

`NioError` (base, with `code`), `AuthError`, `RateLimitError` (with `retryAfterMs`), `ValidationError`. Update `src/app/api/nio/route.ts` to use them. Convex functions keep raw `Error` (serialization boundary).

### Files Created

```
SECURITY.md
.github/dependabot.yml
docs/TROUBLESHOOTING.md
src/domain/errors.ts
src/ui/shared/ErrorBoundary.tsx
```

### Files Modified

```
package.json              — scripts + concurrently devDep
src/app/layout.tsx        — ErrorBoundary wrapper
src/app/api/nio/route.ts  — custom error classes
```

## File Overlap Analysis

No file is touched by more than one workstream, except:

- `package.json` — scripts (DX) only; no conflict with test/niotepad work
- No overlap between niotepad export files and test files
- No overlap between DX files and feature/test files

All three workstreams can be implemented in parallel or any order.
