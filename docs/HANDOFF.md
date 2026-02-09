# Session Handoff — Through Redesign v2

This file captures context for the next Claude Code session.

## What Has Been Implemented

All 20 GitHub issues (#31–#50) are closed. 153 unit tests pass, typecheck and lint clean. Redesign v2 has been merged to main with warm terracotta palette and full design token system.

### Phase 1 — Foundations (PR #51)

Branch: `fix/core-polish` → merged to `main`

| Issue | Title                            | What was done                                                                                |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| #31   | A1: AI Chat Streaming + Markdown | react-markdown + rehype-highlight in ChatMessage.tsx, `.nio-markdown` CSS                    |
| #32   | A2: Terminal Runtime Correctness | Verified JS/Python/HTML/CSS executors, C static analysis documented, 10 runtime tests        |
| #36   | A6: UI Fixes                     | Typo fix in WorkspaceShell, User panel in ControlCenterDrawer, `me` query in convex/users.ts |

### Phase 2 — Core Loop (PRs #52, #53, #54)

3 parallel worktrees merged in order A → B → C.

| PR  | Branch                   | Issues             | What was done                                                                                                                                                                                          |
| --- | ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #52 | `fix/core-polish-phase2` | #33, #34, #35      | A3: Context strip in AiPane + enriched nioContextBuilder/nioPrompt. A4: feedback table + submit mutation + share/clipboard wiring + event logging. A5: BootSequence terminal animation on sign-in page |
| #53 | `feat/courses-route`     | #37, #38, #39, #41 | B1: `/courses` route with 3 carousel rows. B2: `/courses/[courseId]` detail page. B3: CourseCard + CourseCarousel. B5: Resume query + ResumeCard                                                       |
| #54 | `feat/admin-console`     | #42–#46            | C1: `/admin` route + sidebar + AdminGuard. C2: Invite management. C3: User management. C4: Feedback dashboard. C5: Analytics dashboard (KPI cards + event log)                                         |

### Phase 3 — Content & Routing (PR #55)

Branch: `feat/content-expansion` → merged to `main`

| Issue | Title                    | What was done                                                                                                                      |
| ----- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| #47   | D1: Ingest CS50 Library  | New `cs50sql-sql` preset, `ingestCourse` mutation, `scripts/ingest-cs50-courses.ts` with all 5 CS50 courses                        |
| #48   | D2: Progress Tracking UI | `markComplete` mutation, `getCompletionCountsByCourses` query, real progress in CourseCard + "Mark Complete" button in detail page |
| #49   | D3: Coming Soon Cards    | Extracted to `src/ui/courses/comingSoonCourses.ts` (6 entries: MIT, Stanford, Google, Meta, freeCodeCamp, Khan Academy)            |
| #40   | B4: Update Routing       | `fallbackRedirectUrl` → `/courses` in sign-in/sign-up, workspace redirects to `/courses` if no `lessonId`                          |

### Phase 4 — Testing (PR #56)

Branch: `test/e2e-alpha` → merged to `main`

| Issue | Title              | What was done                                                                                                                                                                         |
| ----- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #50   | E1: E2E Test Suite | 4 Playwright test files (auth, courses, workspace, admin) — 9 active, 10 skipped pending infrastructure                                                                               |
| —     | E2: Unit Test Gaps | 22 new tests (129 → 151): CourseCard, comingSoonCourses, BootSequence, nioContextBuilder fileName/lastError. Bug fix: lastError was computed but not appended in nioContextBuilder.ts |

### Redesign v2 — Warm Terracotta Palette (Phases 5–8)

Branch: `redesign-v2` → merged to `main` (`1d8214f`)

**Design System:**

- Full CSS custom property token system in `globals.css` (light + dark modes)
- Warm terracotta accent (`#c15f3c` light / `#da7756` dark) inspired by Claude.ai
- Background pattern (subtle 24px grid overlay)
- Consistent shadow, radius, and transition tokens

**Phase 8 Route Redesign:**

- **Sidebar Shell** — Collapsible rail (56px) ↔ expanded (240px) with localStorage persistence
- **Sign-in/Sign-up** — Redesigned with NotebookFrame, ThemeToggle, OTP field fixes
- **Course Detail Cards** — Lecture cards with animation alignment
- **SiteNav Refactor** — Replaced SidebarShell with shared SiteNav component across courses and admin

**Workspace Redesign:**

- Unified terracotta accent for all active/selected states
- Shared ThemeToggle component in `src/ui/shared/`
- Terminal background flush, chat send button terracotta
- TopNav matched to landing header

**Admin Console Redesign:**

- Snapshot feedback cards (replaced table)
- User email displayed on feedback cards
- V2 design system alignment

**Chat UX Overhaul:**

- StreamingText component with requestAnimationFrame char-reveal and live markdown
- ChatGPT-style streaming with plain text, lerp scroll, and pulse dot
- Canvas 2D thinking orb with terracotta heartbeat pulse

**Landing Page:**

- Hero rework with interactive enhancements
- Remotion demo video project (4K 60fps intro animation)

### SQL & R Language Support

Branch: `upgrade/editor-r-sql` → merged to `main` (`6b22a06`)

- sql.js (WASM) executor for SQL
- WebR (WASM) executor for R
- CS50R course added to ingest pipeline
- CodeMirror language modes for SQL and R

### Mobile Viewport Gate

Branch: `feat/mobile-gate` → merged to `main` (`283f91b`)

- Mobile viewport restricted to landing and info routes only
- `/info` route consolidates all footer content

### Figma Brand Plugin v2.0

- Complete brand system rewrite with correct wordmark identity
- Design tokens, dual-theme swatches, social assets, app icons
- Full asset library exported from Figma

### Niotepad Feature

Branch: `feat/niotepad-experimental` → merged to `main` (`e2c431b`)

- Floating solid-surface panel with grid-paper background
- Bidirectional push from code, chat, and video panes
- Swipe-to-delete gesture, click-to-edit inline, click-to-write
- Per-lecture page navigation, search and filter
- Ring pulse animation on bookmark push events
- Zustand store (`useNiotepadStore`) with IndexedDB persistence

### Gmail Automation

Branch: `feat/gmail-automation` → merged to `main` (`f7f4c83`)

- Gmail API client using `google-auth-library` + raw fetch
- Buffer-based UTF-8 safe base64 encoding/decoding
- OAuth2 flow with token persistence (`.gmail-tokens.json`)
- Env vars: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`

## Current State of Main

```
Commit: f7f4c83 (2026-02-09)
Tests: 153+ unit tests passing
E2E: 9 active + 10 skipped (need seeded Convex data + admin role setup)
Typecheck: clean
Lint: clean
```

### Key Files Added/Modified Across All Phases

**New routes:**

- `src/app/courses/page.tsx` + `layout.tsx` — Course catalog
- `src/app/courses/[courseId]/page.tsx` — Course detail
- `src/app/admin/layout.tsx` + `page.tsx` — Admin dashboard
- `src/app/admin/{users,invites,feedback,analytics}/page.tsx` — Admin sub-pages
- `src/app/sign-in/` + `src/app/sign-up/` — Auth routes (redesigned)
- `src/app/(landing)/` — Landing page route group

**New UI components:**

- `src/ui/courses/` — CoursesPage, CourseDetailPage, CourseCard, ResumeCard, comingSoonCourses.ts, convexResume.ts, convexCompletions.ts
- `src/ui/admin/` — AdminLayout, AdminGuard, InviteManagement, UserManagement, FeedbackDashboard, AnalyticsDashboard
- `src/ui/auth/BootSequence.tsx` — Terminal typing animation
- `src/ui/shared/ThemeToggle.tsx` — Theme toggle (used by LandingNav, SiteNav, sign-in)
- `src/ui/shared/NotebookFrame.tsx` — Decorative notebook frame (compact prop, hidden on mobile)
- `src/ui/shell/SiteNav.tsx` — Shared navigation component for courses and admin
- `src/ui/brand/` — Wordmark and logo components
- `src/ui/landing/` — Hero, features, interactive enhancements

**Convex backend extensions:**

- `convex/feedback.ts` — submit (user) + listAll (admin)
- `convex/invites.ts` — listAll, generate, revoke (admin)
- `convex/users.ts` — listAll, updateRole (admin)
- `convex/ops.ts` — getActiveUsers, getSessionCount, getAiRequestCount, getEventLog, getTotalLessons (admin)
- `convex/resume.ts` — getResumeData (last active lesson per course)
- `convex/lessonCompletions.ts` — markComplete, getCompletionCountsByCourses, getCompletionsByCourse
- `convex/ingest.ts` — ingestCourse mutation
- `convex/schema.ts` — added `feedback` table

**Niotepad:**

- `src/ui/niotepad/` — NiotepadPanel, NiotepadComposer, NiotepadEntry, NiotepadSearch, NiotepadPageNav, NiotepadPill, NiotepadPortal, NiotepadProvider, NiotepadScrollArea, NiotepadDragHandle
- `src/infra/niotepad/` — useNiotepadStore (Zustand), niotepadSelectors, indexedDbNiotepad
- `src/domain/niotepad.ts` — Domain types for niotepad entries

**Domain/infra:**

- `src/domain/nioContextBuilder.ts` — fileName + lastError fields (bug fix: lastError now appended to output)
- `src/domain/nioPrompt.ts` — references file name, modification hash, last error
- `src/domain/lessonEnvironment.ts` — added `cs50sql-sql` preset
- `src/infra/runtime/` — SQL executor (sql.js), R executor (WebR)
- `src/infra/email/` — gmailClient.ts, gmailService.ts, types.ts (Gmail API automation)
- `scripts/ingest-cs50-courses.ts` — Ingest payloads for all 5 CS50 courses

**Tests:**

- `tests/e2e/{auth,courses,workspace,admin}.e2e.ts` — E2E suite
- `tests/unit/ui/courses/{courseCard,comingSoonCourses}.test.ts`
- `tests/unit/ui/auth/bootSequence.test.ts`
- Extended `tests/unit/nio-context-builder.test.ts`

**Dev deps added:** jsdom, @testing-library/react, @testing-library/jest-dom

## Infrastructure

### Claude Code Config (`.claude/`)

- **Agents:** 10 custom agents in `.claude/agents/` (frontend-designer, backend-engineer, debugger, scout, architect, code-reviewer, code-simplifier, performance-analyst, test-writer, dx-advocate)
- **Commands:** 11 custom commands — key ones: `/verify`, `/clean-commit`, `/clean-pr`, `/clean-checkout`, `/orchestrate-agent-team`, `/execution-pro`
- **Skills:** 3 skills — web-design-guidelines, composition-patterns, react-best-practices
- **Permissions:** `Bash(*)`, `Read(*)`, `Write(*)` in `.claude/settings.local.json`
- **Hooks:** Auto-typecheck on `.ts`/`.tsx` edits (PostToolUse hook)

### MCP Servers

- **Convex MCP** — connected (`.mcp.json`)
- **Playwright MCP** — connected (`.mcp.json`)
- **GitHub** — `gh` CLI authenticated

## What Comes Next

**Reference:** `docs/plan.md` — full workstream details

### Immediate Next Steps

1. **Activate skipped E2E tests** — 10 tests are skipped pending:
   - Seeded Convex data (courses, lessons) in the E2E environment
   - Admin role user for admin page tests
   - Wire up `.e2e-seed.json` or `scripts/e2eSeed.ts` with real course data

2. **Custom icons** — Replace Phosphor Icons with custom icon set matching brand system

3. **CodeMirror theme** — Custom editor theme aligned with warm terracotta tokens

4. **xterm theme** — Custom terminal theme matching workspace design tokens

5. **Legal content** — Fill in Terms of Service and Privacy Policy on `/info` page

6. **Deploy preview** — Push to trigger Vercel preview, manually test key flows

### Future Work (beyond alpha roadmap)

- Wasmer C compilation (currently static analysis only)
- Auto-completion trigger (video >90% → lesson complete)
- Niotepad Convex sync and push animation
- Collaborative features
- Mobile workspace support
- Landing page demo video integration

## Verification Commands

```bash
bun run typecheck   # TypeScript strict
bun run lint        # ESLint 9
bun run test        # 153 unit tests
bun run test:e2e    # E2E (needs dev server + seeded data)
```
