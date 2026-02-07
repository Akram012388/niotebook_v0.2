# Niotebook v2 Redesign — Branch State

> **Purpose:** Cross-session persistence file for Claude Code to recall exact branch state.
> **Last updated:** 2026-02-07
> **Branch:** `redesign-v2`
> **Base:** `main`
> **Head commit:** `9d11205` (prerequisite: shared component moves)
>
> **Phase 8 branches (merged to redesign-v2):**
>
> - `redesign/sidebar-courses` — `691a3f5` (sidebar shell + courses layout) ✅ merged
> - `redesign/signin` — `239e2f9` (sign-in/sign-up redesign) ✅ merged
> - `redesign/course-detail-cards` — `c7757bf` (lecture cards + animation alignment) ✅ merged
>
> **Post-Phase 8 (nav refactor):**
>
> - `refactor/courses-navbar-layout` — Replaces SidebarShell with shared SiteNav top nav.
>   Deletes SidebarShell, CourseCarousel, re-export shims. Creates SiteNav + CoursesNavActions.

---

## Branch Summary

The `redesign-v2` branch contains a complete visual refresh of Niotebook's frontend, replicating Claude.ai/code warmth. All 7 implementation phases are done. **52 files changed, +1,659 / -696 lines** vs `main`.

**Status:** Ready for final review and merge to `main`.

---

## What Changed (vs main)

### Design Token System (`src/app/globals.css`)

- Full dual-theme CSS custom property system (`:root` + `[data-theme="dark"]`)
- Light: Pampas `#F4F3EE` bg, Crail `#C15F3C` accent
- Dark: Charcoal `#1C1917` bg, Terracotta `#DA7756` accent
- Warm-tinted status colors (success/warning/error/info)
- Workspace tokens (always-dark code surfaces)
- Shadow scale (sm/md/lg) with warm undertones
- Border radius scale (sm/md/lg/xl/full)
- Transition timing (fast/normal/slow/spring)
- `.nio-pattern` grid overlay (24px, linear-gradient)
- `.nio-shimmer` + `.nio-shimmer-workspace` skeleton loaders
- `nio-markdown` styles (warm code blocks, accent links/blockquotes)
- Clerk appearance overrides using CSS variables
- Tailwind 4 `@theme inline` mapping all tokens to utility classes

### Font System (`src/app/layout.tsx`)

- Orbitron (display) — `--font-display` / `font-display`
- Geist Sans (body) — `--font-body` / `font-sans`
- Geist Mono (code) — `--font-code` / `font-mono`
- Loaded via `next/font/google`, applied as CSS variables on `<body>`

### Theme System

- `data-theme` attribute on `<html>` (not class-based)
- Blocking `<script>` in `<head>` reads localStorage or `prefers-color-scheme`
- Tailwind 4: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
- Landing page: capsule ThemeToggle (dark/light/system) in LandingNav
- Workspace: always dark via `workspace-*` tokens

### Component Token Migration (Phases 2-6)

All hardcoded Tailwind color classes replaced with design tokens across **all** components:

| Area    | Files    | Key Changes                                          |
| ------- | -------- | ---------------------------------------------------- |
| Admin   | 10 files | Chart accents, status badges, KPI colors             |
| Auth    | 3 files  | BootSequence, Clerk appearance                       |
| Code    | 8 files  | Editor bg/text, skeleton, runtime dots, output panel |
| Chat    | 2 files  | Cursor color, stream error styling                   |
| Courses | 4 files  | Card accents, status colors                          |
| Landing | 8 files  | Complete rework (see Phase 7)                        |
| Shell   | 3 files  | ControlCenterDrawer, AppShell, PaneSwitcher          |
| Video   | 1 file   | Player bg/overlay text                               |
| Layout  | 1 file   | WorkspaceGrid border                                 |
| Panes   | 2 files  | AiPane, CodePane                                     |

### Landing Page Rework (Phase 7)

- **HeroSection** — Claude-style clarity, removed parallax/glow effects
- **NotebookFrame** — New component, 3-layer binder architecture (rails + mask + content)
- **ThemeToggle** — Capsule toggle replacing ForceTheme
- **Wordmark** — Pure text Orbitron with terracotta accent 'i' (replaced SVG)
- **ValuePropSection** — Merged StatsSection into it
- **StatsSection** — Deleted (merged)
- **LandingFooter** — New component, multi-column (Product/Resources/Legal/Connect)
- **Legal pages** — `/terms`, `/privacy`, `/cookies` (stub content)

---

## File Inventory (52 changed files)

### New Files (7)

```
src/app/(landing)/cookies/page.tsx
src/app/(landing)/privacy/page.tsx
src/app/(landing)/terms/page.tsx
src/ui/landing/LandingFooter.tsx
src/ui/landing/NotebookFrame.tsx
docs/redesign/PROGRESS.md
docs/redesign/REDESIGN_BRIEF.md
```

### Deleted Files (1)

```
src/ui/landing/StatsSection.tsx
```

### Modified Files (44)

```
.claude/agent-memory/frontend-designer/MEMORY.md
.claude/agents/frontend-designer.md
src/app/editor-sandbox/page.tsx
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/ui/admin/AiUsageChart.tsx
src/ui/admin/ContentOverview.tsx
src/ui/admin/DauChart.tsx
src/ui/admin/FeedbackDashboard.tsx
src/ui/admin/InviteManagement.tsx
src/ui/admin/KpiCard.tsx
src/ui/admin/TopLessonsChart.tsx
src/ui/admin/UserGrowthChart.tsx
src/ui/admin/UserManagement.tsx
src/ui/auth/BootSequence.tsx
src/ui/auth/clerkAppearance.ts
src/ui/brand/Wordmark.tsx
src/ui/chat/ChatComposer.tsx
src/ui/chat/ChatMessage.tsx
src/ui/code/CodeEditor.tsx
src/ui/code/EditorSkeleton.tsx
src/ui/code/EditorTab.tsx
src/ui/code/EnvSelector.tsx
src/ui/code/FileTreeActions.tsx
src/ui/code/LanguageSelect.tsx
src/ui/code/OutputPanel.tsx
src/ui/code/RuntimeStatus.tsx
src/ui/courses/CourseCard.tsx
src/ui/courses/CourseDetailPage.tsx
src/ui/courses/CoursesPage.tsx
src/ui/courses/ResumeCard.tsx
src/ui/landing/CTASection.tsx
src/ui/landing/FeaturesSection.tsx
src/ui/landing/HeroSection.tsx
src/ui/landing/LandingNav.tsx
src/ui/landing/ThemeToggle.tsx
src/ui/landing/ValuePropSection.tsx
src/ui/layout/WorkspaceGrid.tsx
src/ui/panes/AiPane.tsx
src/ui/panes/CodePane.tsx
src/ui/shell/AppShell.tsx
src/ui/shell/ControlCenterDrawer.tsx
src/ui/video/VideoPlayer.tsx
```

---

## Open Items

- [ ] Custom icon overrides — which icons need bespoke treatment?
- [ ] CodeMirror theme — build a matching warm theme or keep current?
- [ ] xterm.js theme — match the new palette?
- [ ] Legal pages — draft actual Terms, Privacy, Cookie policy content
- [ ] Legal pages SiteNav wiring — currently using inline Wordmark + ForceTheme dark (deferred from nav refactor)
- [ ] Final PR: `redesign-v2` to `main`
- [ ] Nav refactor: merge `refactor/courses-navbar-layout` into `redesign-v2`

---

## Verification State

| Check               | Last Run | Result       |
| ------------------- | -------- | ------------ |
| `bun run typecheck` | Phase 7  | Pass         |
| `bun run lint`      | Phase 7  | Pass         |
| `bun run test`      | Phase 6  | 153/153 pass |

---

## Key Reference Files

| File                                               | Purpose                                       |
| -------------------------------------------------- | --------------------------------------------- |
| `src/app/globals.css`                              | Canonical token definitions (source of truth) |
| `src/app/layout.tsx`                               | Font loading, theme script, body classes      |
| `docs/redesign/REDESIGN_BRIEF.md`                  | Design direction, decisions, rationale        |
| `docs/redesign/PROGRESS.md`                        | Phase-by-phase implementation log             |
| `docs/redesign/DESIGN_SYSTEM.md`                   | Design system reference (v2, updated)         |
| `docs/redesign/STATE.md`                           | This file — cross-session state persistence   |
| `.claude/agent-memory/frontend-designer/MEMORY.md` | Frontend agent design knowledge               |
| `docs/architecture/SITENAV_ROUTE_AUDIT.md`         | SiteNav route audit + file boundary plan      |
| `docs/architecture/COURSES_LAYOUT_REFACTOR.md`     | Courses nav refactor analysis + resolution    |
