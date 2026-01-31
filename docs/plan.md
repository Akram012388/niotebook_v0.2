# Plan Status: ACTIVE

## Implementation Phases

- Phase 0 — Spec lock: finalize P1, P2, P8, P9 definitions.
- Phase 1 — Foundations: schema, Clerk auth (invite-only), YouTube sync + transcript ingest.
- Phase 2 — Core loop: lesson routing, editor/runtime scaffolding, resume persistence.
- Phase 3 — Video authority: YouTube player wiring, authoritative videoTimeSec flow, runtime correctness.
- Phase 4 — AI + chat: Nio prompt, context builder, streaming.
- Phase 5 — Analytics + admin + QA: events, dashboard, share/feedback tracking, E2E coverage, CI/CD alignment.
- Phase 6 — Alpha launch: courses route, admin console, content expansion, learning pulse, polish.

---

## Alpha Launch Roadmap

Target: Private alpha (5–20 testers). CS50 library (CS50x 2026, CS50P, CS50AI, CS50W, CS50SQL). Parallel workstreams via git worktrees.

### Workstream A: Core Fixes & Polish

Branch: `fix/core-polish`

#### A1 — AI Chat Streaming + Markdown Rendering

- Verify SSE streaming end-to-end (`src/app/api/nio/route.ts` → `useChatThread.ts`).
- Add markdown renderer for assistant messages (code blocks with syntax highlighting, inline code, lists, bold/italic).
- Ensure streaming tokens render markdown incrementally without layout shifts.
- Files: `src/ui/chat/ChatMessage.tsx`, `src/ui/chat/ChatScroll.tsx`, `src/ui/panes/AiPane.tsx`, `package.json`.

#### A2 — Terminal Runtime Correctness

- Verify JS executor: console.log, console.error, multi-line, async/await, imports.
- Verify Python executor (Pyodide): print, input(), imports, multi-file.
- Verify C executor: check stub status, wire Wasmer bridge if ready, document limitations.
- Verify HTML/CSS: iframe preview, VFS asset resolution.
- Files: `src/infra/runtime/*.ts`, `src/ui/code/terminal/commandRouter.ts`.

#### A3 — Learning Pulse: Context Strip + Smarter Nio

- Add context strip to AiPane header: `Lecture 3 · 12:34 · main.py (modified)`.
- Enrich `nioContextBuilder.ts` with file name, language, last run error output.
- Update `nioPrompt.ts` to leverage visible context.
- Files: `src/ui/panes/AiPane.tsx`, `src/domain/nioContextBuilder.ts`, `src/domain/nioPrompt.ts`.

#### A4 — Share & Feedback Wiring

- Connect Share buttons to clipboard + Web Share API (with fallback).
- Add `feedback` table to `convex/schema.ts`.
- Create `convex/feedback.ts` mutation to store feedback submissions.
- Log share/feedback events via existing event system.
- Files: `src/ui/shell/ControlCenterDrawer.tsx`, `convex/schema.ts`, `convex/feedback.ts`.

#### A5 — Sign-In Page Terminal Aesthetic

- Add terminal boot sequence animation next to Clerk card (right side).
- Monospace font, typing animation: `> initializing learning environment...`, `> loading CS50 runtime...`, `> ready.`
- Files: `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/ui/auth/BootSequence.tsx`.

#### A6 — UI Fixes

- Fix typo "best experinced" → "best experienced" in WorkspaceShell.
- Wire User panel in ControlCenterDrawer (email, role, sign-out).
- Files: `src/ui/layout/WorkspaceShell.tsx`, `src/ui/shell/ControlCenterDrawer.tsx`.

### Workstream B: Courses Route & User Journey

Branch: `feat/courses-route`

#### B1 — Courses Route (`/courses`)

- New Next.js route, protected by auth. Accessible on all viewports (mobile: browse-only, no video/workspace).
- Layout: "niotebook" nav, user avatar, theme toggle, sign-out.
- Carousel rows (Apple TV+ / Netflix style):
  1. **Continue Learning** (returning users): resume card with lecture number, timestamp, progress bar.
  2. **Harvard CS50 Library**: CS50x, CS50P, CS50AI, CS50W, CS50SQL cards.
  3. **Coming Soon**: greyed-out hardcoded cards (MIT, Stanford, Google, etc.).
- Files: `src/app/courses/page.tsx`, `src/ui/courses/`.

#### B2 — Course Detail Page (`/courses/[courseId]`)

- Course header: title, description, provider, license, source URL.
- Progress bar: X/Y lectures completed.
- Lecture list: ordered, title, duration, completion status.
- "Resume" button (last active lecture + timestamp) and per-lecture "Start" button → `/workspace?lessonId=X`.
- Files: `src/app/courses/[courseId]/page.tsx`, `src/ui/courses/`.

#### B3 — Course Card Component

- Minimalist card: title, provider badge, lecture count, progress bar.
- Hover: scale + shadow lift. Auto-sliding carousel (CSS scroll-snap).
- "Coming Soon" variant: greyed out, lock icon.
- Files: `src/ui/courses/CourseCard.tsx`, `src/ui/courses/CourseCarousel.tsx`.

#### B4 — Update User Journey Routing

- Post-auth redirect: `/courses` instead of `/workspace`.
- `/workspace` requires `lessonId` query param.
- Update Clerk `afterSignInUrl`/`afterSignUpUrl`.
- Files: `src/app/layout.tsx`, `src/app/providers.tsx`, middleware.

#### B5 — Resume Experience

- Query `frames` for last active lesson per course.
- "Continue" card: course name, lecture title, video timestamp, code language.
- Files: `convex/resume.ts`, `src/ui/courses/ResumeCard.tsx`.

### Workstream C: Admin Console

Branch: `feat/admin-console`

#### C1 — Admin Route & Layout

- `/admin` route protected by admin role.
- Sidebar nav: Dashboard, Users, Invites, Feedback, Events.
- Files: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`.

#### C2 — Invite Management

- Generate invite codes (single/batch), track status, revoke.
- Files: `src/app/admin/invites/page.tsx`, `convex/invites.ts`.

#### C3 — User Management

- List users (email, role, joined, last active), change roles, view activity.
- Files: `src/app/admin/users/page.tsx`, `convex/users.ts`.

#### C4 — Feedback Dashboard

- List feedback submissions, filter by category, sort by date/rating.
- Files: `src/app/admin/feedback/page.tsx`, `convex/feedback.ts`.

#### C5 — Analytics Dashboard

- Active users, sessions, AI requests, per-course stats, provider distribution, event log viewer.
- Files: `src/app/admin/analytics/page.tsx`, `convex/ops.ts`.

### Workstream D: Content Pipeline & Progress

Branch: `feat/content-expansion`

#### D1 — Ingest CS50 Course Library

- Run ingest for CS50P, CS50AI, CS50W, CS50SQL (data ready).
- Add/verify lesson environment presets per course.
- Files: `convex/ingest.ts`, `src/domain/lessonEnvironment.ts`.

#### D2 — Progress Tracking UI

- Lesson completion: auto (video >90%) or manual ("Mark Complete").
- Course progress from `lessonCompletions` table, surfaced in course cards and detail page.
- Connect to Learning Pulse: Nio references progress.
- Files: `convex/lessonCompletions.ts`, `src/ui/courses/`.

#### D3 — Hardcoded Coming Soon Cards

- Static config: `src/ui/courses/comingSoonCourses.ts`.
- Entries: MIT 6.006, Stanford CS106A, Google IT Cert, Meta Frontend Dev, etc.
- Rendered as greyed-out CourseCard variant.
- Files: `src/ui/courses/comingSoonCourses.ts`, `src/ui/courses/CourseCard.tsx`.

### Workstream E: Testing & Quality

Branch: `test/e2e-alpha`

#### E1 — E2E Test Suite

- Auth flow: sign in → redirect to /courses.
- Course browsing: navigate, view detail, click lecture.
- Workspace: lesson load, editor, terminal, video.
- Chat: send message, streamed response, markdown.
- Resume: leave workspace, return, verify restored position.
- Files: `tests/e2e/*.e2e.ts`.

#### E2 — Unit Test Gaps

- Markdown rendering, course components, admin mutations, runtime executors.
- Files: `tests/unit/`.

### Execution Order

**Phase 1 — Foundation (sequential):**

1. A1: AI streaming + markdown rendering.
2. A2: Terminal runtime correctness.
3. A6: Quick UI fixes.

**Phase 2 — Parallel (git worktrees):**

- Worktree 1: A3 + A4 + A5 (polish in existing routes).
- Worktree 2: B1–B5 (courses route — entirely new files).
- Worktree 3: C1–C5 (admin console — entirely new files).

**Phase 3 — Integration:**

- D1: Ingest remaining CS50 courses.
- D2 + D3: Progress tracking + coming soon cards (after B merged).
- B4: Update routing (after B + A stable).

**Phase 4 — Quality:**

- E1 + E2: E2E and unit tests.
- Landing page demo video (screen recording after workspace polished).

### Viewport Policy

- `/` (landing), `/sign-in`, `/sign-up`, `/courses`: all viewports (mobile browse-only on courses, no video).
- `/workspace`: desktop only (≥1024px). Mobile/tablet shows friendly message.
- `/admin`: desktop only.

## P1 — Success Metrics & Funnels

Phase: 0
Dependencies: none
Tasks:

- Finalize KPI formulas, denominators, and sessionization rules (30m inactivity, 60s heartbeat).
- Define activation and retention windows, plus share/feedback metrics.
- Define lesson completion trigger (video ≥80% OR ≥1 successful code run).
- Define cohort = inviteBatchId and analytics timezone = UTC.
- Map each KPI to required events.
  Deliverables:
- Metrics glossary and KPI formulas embedded in docs.
- Event-to-KPI mapping aligned to ADR-002.

## P2 — YouTube Sync Model (Mirror CS50)

Phase: 0 → 1
Dependencies: none
Tasks:

- Enumerate slugs from https://cs50.harvard.edu/x/weeks/ and validate CS50x 2026 pages.
- Parse each week page to extract SRT (Subtitles), TXT (metadata only), and YouTube ID; no hardcoded CDN URLs.
- Ingest SRT into transcriptSegments (segment-per-row) and store transcript metadata on lessons.
- Set transcriptStatus (ok|warn|missing|error); warn on duration mismatch >120s; emit transcript ingest events.
- Deploy-only ingest with idempotent re-ingest (delete+reinsert per lessonId + ingestVersion).
  Deliverables:
- YouTube + transcript ingestion spec.
- Transcript source URL list, mapping rules, and failure policy.
- Idempotent ingest + transcript status rules.

## P3 — Admin Cockpit MVP (Analytics‑First)

Phase: 4
Dependencies: P1, P6, P8
Tasks:

- Define cockpit layout and KPI card ordering.
- Define share + feedback counters and queries for analytics panel.
- Define invite management UX (alpha uses Clerk dashboard; admin console integration deferred).
- Define filter behaviors and time-range presets (start with 1d/7d/30d).
  Deliverables:
- Admin cockpit UX spec (see `docs/specs.md`).
- KPI query list for dashboard cards.

## P4 — Nio Persona & Anti‑Drift Rules

Phase: 3
Dependencies: P2, P8, P9
Tasks:

- Reference ADR-005 system prompt and refusal rules.
- Define context builder inputs: lesson metadata, time window, code snapshot, transcript snippet.
- Enforce token budget (4096 total, 1024 response).
- Define tests for tone, refusal, and context fidelity.
  Deliverables:
- ADR-005 system prompt + guardrails.
- Context builder contract + test checklist.

## P5 — PRD vs Spec Scope Boundaries

Phase: 0 → 1
Dependencies: none
Tasks:

- Create ADR for CI/CD, scripts, and infra choices.
- Keep PRD product-level and stable.
  Deliverables:
- ADR for CI/CD + scripts (ADR‑004).

## P6 — Instrumentation Plan

Phase: 1 → 4
Dependencies: P1, P8
Tasks:

- Implement event logger and session tracking rules.
- Emit share/feedback events from UI actions.
- Emit transcript ingest events and duration warnings.
- Enforce privacy constraints for analytics payloads.
  Deliverables:
- Event emission map tied to user flows.
- Sessionization rules + QA checklist.

## P7 — C Runtime Spike + Fallback Gate

Phase: 2
Dependencies: P2
Tasks:

- Spike TCC-in-WASM and measure warm-up + run latency.
- Implement fallback UX if perf fails.
  Deliverables:
- Spike report with go/no-go decision.
- Runtime fallback UX spec.

## P8 — Data Model / Convex Schema

Phase: 0 → 1
Dependencies: P2
Tasks:

- Implement schema from ADR-002 (lessons transcript metadata + transcriptSegments).
- Lock indexes, access rules, and core tables.
- Define seed/sync pipeline for CS50 content + transcriptSegments.
  Deliverables:
- Convex schema + index list.
- Seed/sync spec for courses, lessons, transcriptSegments.

## P9 — Error + Security Model

Phase: 0 → 2
Dependencies: P2, P4, P8
Tasks:

- Map failure modes to explicit UI states.
- Add transcript ingest failure handling and mismatch warn threshold (>120s).
- Enforce role checks, auth boundary validation, and rate limits (invite TTL applies if custom invite code flow returns).
- Define AI fallback triggers (5xx/429 or timeout ≥10s).
  Deliverables:
- Error-state UX map.
- Security checklist aligned to ADR-003.

## P10 — Repo Bootstrap + CI/CD Baseline

Phase: 0
Dependencies: none
Tasks:

- Scaffold Next.js app (Bun, TypeScript, App Router, src/, Tailwind, @/\* alias, Turbopack).
- Add Bun/Node version pinning and bun-first scripts (dev, dev:convex, build, start, lint, typecheck, test, test:e2e).
- Initialize Convex config and dev workflow.
- Add lint/format tooling (ESLint + Prettier) and Lefthook pre-commit (lint + typecheck).
- Add Vitest + Playwright (smoke test) + configs.
- Add Sentry SDK wiring + env placeholders.
- Add CI workflows (PR checks, Semgrep, Vercel preview E2E) and Vercel build command.
- Gate preview e2e runs on the `niotebook-e2e` readiness marker (set via `NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW=true`).
- Add .env.example with required vars (Convex, AI, Sentry, app URL).
  Deliverables:
- Bootstrapped repo ready for Phase 0 implementation.
- CI pipelines aligned to ADR-004.

## P11 — Core Loop (Player, Editor, Resume)

Phase: 2 (complete)
Dependencies: P7, P8, P9
Tasks:

- Implement lesson routing with course/lesson selection.
- Wire transcript window context into chat requests (no UI).
- Persist frame + code snapshot to Convex with debounced updates.
- Resume lesson state across devices: video time + code snapshot.
  Deliverables:
- Core loop wiring across player/editor/runtime/resume.
- Resume sync path (Convex source of truth).

## P13 — Tier 2 Code Editor (Complete + Fix/Polish)

Phase: post-Phase 4
Branch: `jarvis/code-editor-tier2` (base), `fix/code-editor` (polish)
Dependencies: P11, P7
Status: IMPLEMENTED (base) + IN PROGRESS (polish)

The code editor was rebuilt from a plain textarea to a professional IDE-like environment. All eight sub-phases completed in the base branch; the fix/polish pass focuses on UI consistency and runtime behavior.

1. **Virtual Filesystem (VFS)** — In-memory file tree with IndexedDB persistence, event subscriptions, Zustand store (`useFileSystemStore`).
2. **File Tree + Tabbed Editor** — CodeMirror 6 (installed from scratch), `FileTreeSidebar`, `TabBar`, `TabbedEditor` with per-tab `EditorState` swapping, `useEditorStore`.
3. **xterm.js Terminal** — `TerminalPanel` with `XTermView`, `TerminalToolbar`, streaming stdout/stderr, Zustand `useTerminalStore`, dark/light themes.
4. **Wasmer/WASIX Integration** — Iframe sandbox (`/editor-sandbox`) with COOP/COEP headers, `WasmerBridge` postMessage protocol, fallback to Pyodide/builtins.
5. **Cross-file Imports** — Python (`sys.path` + Pyodide FS mount), C (`#include` resolution from VFS), JS (`require()` shim reading VFS).
6. **Lesson-aware Environment Configs** — `LessonEnvironment` type with starter files, `environmentConfig` on lessons, optional `LessonEnvBadge`, environment presets.
7. **Split-pane Resizable Layout** — `SplitPane` component (vertical divider between editor and terminal), mouse-drag resize, persisted split ratio.
8. **Enhanced Autocomplete** — Context-aware completions via `completionProvider`, language-specific keyword/API suggestions.

Key dependencies added: `@codemirror/*` (state, view, language, commands, autocomplete, search, lang-javascript, lang-python, lang-html, lang-cpp, theme-one-dark), `@lezer/highlight`, `@xterm/xterm`, `@xterm/addon-fit`, `@xterm/addon-web-links`, `zustand`, `idb`.

Fix/polish highlights (fix/code-editor):

- Inline language selector pill (slide-out options) aligned to V/C/A controls.
- File tree resizable 180–300px, default 180px; persists per user.
- Terminal prompt-only UX (single `$`), no banner text; prompt restored after clear.
- Run/Stop/Clear moved to terminal header; disabled for HTML/CSS.
- HTML preview mount container; terminal min height ~160px.

Deliverables: `docs/code-editor-tier2-plan.md` (plan + current implementation notes).

## P12 — Video Authority + Runtime Correctness

Phase: 3
Dependencies: P11, P7, P9
Tasks:

- Wire YouTube player to use real playback time + seek events as the source of truth.
- Normalize videoTimeSec sampling (2–5s + on seek/pause) and persist via frames.
- Ensure chat/transcript context consumes authoritative video time.
- Improve runtime executor correctness (init/run/stop + timeout handling).
  Deliverables:
- Authoritative video time flow with resume + chat sync.
- Runtime execution behavior aligned to specs.
