# Niotebook v2 Redesign — Progress Tracker

> **Branch**: `redesign-v2` (base) — phase sub-branches merged via PRs
> **Brief**: `docs/redesign/REDESIGN_BRIEF.md`
> **Started**: 2026-02-06
> **Status**: All 8 phases complete + SiteNav refactor. Merged to `main` on 2026-02-08 (commit `1d8214f`).

---

## Phase Overview

| Phase | Description                | Status   | Branch                                                                        | Commit                  |
| ----- | -------------------------- | -------- | ----------------------------------------------------------------------------- | ----------------------- |
| **1** | Design Tokens & Primitives | **Done** | `redesign/phase-1-tokens`                                                     | `3bbbd62`               |
| **2** | Base Components            | **Done** | `redesign/phase-2-components`                                                 | `ada381d`               |
| **3** | Shell & Chrome             | **Done** | `redesign/phase-3-shell`                                                      | `e09aed3`               |
| **4** | Core Panes                 | **Done** | `redesign/phase-4-panes`                                                      | `1f0b0d3`               |
| **5** | Pages                      | **Done** | `redesign/phase-5-pages`                                                      | `9b85b96`               |
| **6** | Polish                     | **Done** | `redesign/phase-6-polish`                                                     | `2d71060`               |
| **7** | Landing Page Rework        | **Done** | `feat/landing-hero-rework`                                                    | `418f0f8` (merge)       |
| **8** | Route Redesign             | **Done** | `redesign/sidebar-courses`, `redesign/signin`, `redesign/course-detail-cards` | merged to `redesign-v2` |
| —     | SiteNav Refactor           | **Done** | `refactor/courses-navbar-layout`                                              | merged to `redesign-v2` |
| —     | Merge to Main              | **Done** | `redesign-v2` → `main`                                                        | `1d8214f`               |

---

## Phase 1 — Design Tokens & Primitives

**Commit**: `3bbbd62` on `redesign/phase-1-tokens`

### Deliverables

- [x] Warm Claude palette — Pampas `#F4F3EE` / Charcoal `#1C1917`
- [x] Terracotta accent — Crail `#C15F3C` (light) / `#DA7756` (dark)
- [x] Dual-theme tokens (light + dark) with system preference default
- [x] Shadow scale (sm/md/lg) with warm tints
- [x] Border radius scale (sm/md/lg/xl/full)
- [x] Transition duration + easing tokens
- [x] Font role assignments (display/body/code)
- [x] Grid/dot pattern `.nio-pattern` on `<body>`
- [x] Skeleton shimmer `.nio-shimmer` animation
- [x] Updated nio-markdown styles (warm code blocks, accent links/blockquotes)
- [x] Tailwind `@theme inline` extended with all new tokens
- [x] Status colors (success/warning/error/info) warm-tinted
- [x] Enhanced `frontend-designer` agent with design system knowledge
- [x] Created `REDESIGN_BRIEF.md` with finalized values
- [x] Verification: typecheck, lint, tests (153/153)

---

## Phase 2 — Base Components

**Commit**: `ada381d` on `redesign/phase-2-components`
**Files changed**: 26 (237 insertions, 92 deletions)

### Deliverables

- [x] Status badges — `bg-status-*/10 text-status-*` (InviteManagement, UserManagement)
- [x] Role badges — accent-muted for admin, status-info for user, surface-muted for guest
- [x] KPI delta colors — `text-status-success` / `text-status-error`
- [x] Runtime status dots — `bg-status-info/success/warning/error`
- [x] Editor dirty indicator — `bg-status-warning`
- [x] File tree delete action — `text-status-error`
- [x] Editor skeleton — `nio-shimmer-workspace` (warm shimmer for dark code surfaces)
- [x] HeroSection — all hardcoded hex to design tokens
- [x] CTASection — `bg-accent text-accent-foreground` with warm shadow
- [x] BootSequence — `bg-surface-strong text-accent`
- [x] Clerk appearance — CSS custom properties
- [x] Course cards — `workspace-accent` to `accent` throughout
- [x] Admin charts — `var(--accent)` for chart accent, `var(--text-subtle)` for ticks
- [x] Output panel stderr — `text-status-error`
- [x] AI pane stream error — `status-warning/10` border+bg
- [x] Env selector DEV badge — `text-status-warning`
- [x] Feedback stars — `text-status-warning`
- [x] Content overview status — `text-status-success/warning/error`
- [x] Workspace shimmer variant added to globals.css
- [x] Verification: typecheck, lint, tests (153/153)

---

## Phase 3 — Shell & Chrome

**Commit**: `e09aed3` on `redesign/phase-3-shell`
**Files changed**: 9

### Deliverables

- [x] ControlCenterDrawer — `workspace-accent` to `accent` (6 refs, tabs, active lessons, course buttons)
- [x] AppShell — fallback wordmark uses `font-display` (Orbitron)
- [x] PaneSwitcher — active pill `bg-accent-muted text-accent shadow-sm font-semibold`
- [x] TopNav — verified clean, no changes needed
- [x] Layout preset toggles — verified clean, no changes needed
- [x] SplitDivider — correctly retains `workspace-*` (inside code editor, always dark)
- [x] Landing sections — `workspace-accent` to `accent` in FeaturesSection, ValuePropSection, CTASection
- [x] ChatMessage cursor — `dark:bg-workspace-accent` to `dark:bg-accent`
- [x] Verification: typecheck, lint, tests (153/153)

---

## Phase 4 — Core Panes

**Commit**: `1f0b0d3` on `redesign/phase-4-panes`
**Files changed**: 3

### Deliverables

- [x] VideoPlayer — `bg-black` to `bg-surface-strong`, overlay text to `text-surface-strong-foreground`
- [x] CodeEditor textarea — `bg-black text-slate-100 caret-slate-100` to `bg-workspace-editor text-workspace-text caret-workspace-text`; removed inverted dark classes
- [x] ChatMessage — verified clean
- [x] AiPane — verified clean (stream error uses status-warning tokens)
- [x] All code pane components (28 files) — verified clean
- [x] Verification: typecheck, lint, tests (153/153)

---

## Phase 5 — Pages

**Commit**: `9b85b96` on `redesign/phase-5-pages`
**Files changed**: 3

### Deliverables

- [x] Editor sandbox error — `#f87171` to `var(--status-error)`
- [x] CodePane SVG preview iframe — `#0A0A0A` to `#1C1917` (warm dark)
- [x] All landing page components (8 files) — verified clean
- [x] All course components (6 files) — verified clean
- [x] All auth components (3 files) — verified clean
- [x] All admin components (16 files) — verified clean
- [x] Zero hardcoded Tailwind color classes remain in `src/`
- [x] Verification: typecheck, lint, tests (153/153)

---

## Phase 6 — Polish

**Commit**: `2d71060` on `redesign/phase-6-polish`
**Files changed**: 5

### Deliverables

- [x] ChatComposer — `focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/40`
- [x] LanguageSelect — `focus-visible:ring-2 focus-visible:ring-accent/40`
- [x] ControlCenterDrawer — normalized `duration-[120ms]` to `duration-100`, `duration-[180ms]` to `duration-200`
- [x] `.nio-pattern` — verified applied to `<body>` in layout.tsx
- [x] Border radius — all using standard Tailwind classes
- [x] Shadows — standard + intentional landing glow effects
- [x] Typography — arbitrary `text-[11px]`/`text-[10px]` intentional for dense UI
- [x] Opacity patterns — all intentional (grid overlays, hover reveals)
- [x] Zero arbitrary `duration-[Xms]` brackets remain in TSX
- [x] Verification: typecheck, lint, tests (153/153)

---

## Phase 7 — Landing Page Rework

**Merge commit**: `418f0f8` via PR #87 (`feat/landing-hero-rework` to `redesign-v2`)
**Files changed**: 16 (833 insertions, 508 deletions)
**Commits**: 12

### Deliverables

#### Hero & Navigation

- [x] HeroSection — stripped to Claude-style clarity (removed parallax orbs, glow effects, animated badge)
- [x] ThemeToggle — replaced `ForceTheme` with capsule toggle (dark/light/system) in LandingNav
- [x] Wordmark — converted from SVG to pure text `font-display` (Orbitron) with terracotta accent 'i'

#### Section Architecture

- [x] NotebookFrame component — 3-layer binder architecture: rails (z-0) + CSS radial-gradient mask strip (z-1) + content (z-2)
- [x] All sections wrapped in NotebookFrame for cohesive "notebook page" feel
- [x] StatsSection merged into ValuePropSection (reduced section count, tighter layout)
- [x] All sections lifted above `.nio-pattern` grid overlay with `z-[2]`
- [x] Compact spacing: removed inter-section dividers, tuned grid dot size

#### Footer & Legal

- [x] LandingFooter — multi-column layout (Product / Resources / Legal / Connect)
- [x] Social icons (X, GitHub, Discord, Email) with inline SVGs
- [x] Wordmark + copyright bar at footer bottom
- [x] `bg-surface-strong` dark footer with `text-surface-strong-foreground` palette
- [x] Legal stub pages — `/terms`, `/privacy`, `/cookies` (placeholder content, ForceTheme dark)

#### Bug Fixes

- [x] Section gaps normalized — all inter-frame gaps consistent at 128px
- [x] FeaturesSection heading moved inside NotebookFrame
- [x] Footer columns centered with `md:justify-items-center`
- [x] Footer wordmark accent — `[&>span]` direct child selector preserves terracotta 'i'
- [x] Footer gap — `mt-12 sm:mt-16` matches inter-frame spacing
- [x] Verification: typecheck, lint

---

## Phase 8 — Route Redesign (Sidebar, Sign-in, Course Detail Cards)

**Branches:** `redesign/sidebar-courses` (`691a3f5`), `redesign/signin` (`239e2f9`), `redesign/course-detail-cards` (`c7757bf`)

### Deliverables

- [x] SidebarShell — collapsible rail (56px) ↔ expanded (240px) with localStorage persistence
- [x] Courses layout refactored to use SidebarShell + NotebookFrame wrapping
- [x] Sign-in/sign-up redesign — removed ForceTheme, added ThemeToggle to top bar
- [x] NotebookFrame moved to `src/ui/shared/` (shared across landing, courses, auth)
- [x] ThemeToggle moved to `src/ui/shared/` (shared across landing, courses, auth)
- [x] OTP input field visibility fix for dark theme
- [x] Course detail lecture cards with animation alignment
- [x] `clerkAppearance` colorPrimary kept as foreground (not changed to accent per UX_SPEC)

---

## SiteNav Refactor

**Branch:** `refactor/courses-navbar-layout`

### Deliverables

- [x] SiteNav shared top nav component (`src/ui/shared/SiteNav.tsx`) replaces SidebarShell
- [x] SidebarShell deleted
- [x] CourseCarousel deleted (carousel approach removed)
- [x] Re-export shims cleaned up
- [x] CoursesNavActions component for courses-specific nav items
- [x] ThemeToggle integrated into SiteNav

---

## Merge to Main

**Commit:** `1d8214f` — `feat(design): merge Redesign v2 — warm Claude palette & design token system`
**Date:** 2026-02-08

All 8 phases + SiteNav refactor merged from `redesign-v2` to `main`.

---

## Commit History (20 commits, `main..redesign-v2`)

```
418f0f8 Merge pull request #87 from Akram012388/feat/landing-hero-rework
7669412 fix(landing): match footer gap to inter-frame spacing
44b00ea fix(landing): normalize section gaps, footer centering, and wordmark accent
bf578c0 feat(landing): add multi-column footer and legal stub pages
bf79b20 refactor(landing): merge StatsSection into ValuePropSection
c1ab8a9 fix(landing): lift sections above grid pattern overlay with z-[2]
1a2f828 fix(landing): restructure NotebookFrame to 3-layer binder architecture
f74b322 feat(landing): add binder punch-hole effect and polish notebook frames
6a8dc90 feat(landing): rework all sections with notebook frame treatment
def5924 feat(landing): compact spacing, remove dividers, tune grid size
ff2e978 feat(landing): text wordmark, fine grid pattern, tighter hero spacing
457cc33 feat(landing): rework hero section for Claude-style clarity
e26930a feat(landing): replace ForceTheme with capsule theme toggle
c592ae6 fix(design): deduplicate dark tokens and use CSS vars in markdown pre (#86)
2d71060 feat(design): Phase 6 — polish focus states and transition consistency
9b85b96 feat(design): Phase 5 — final hardcoded color cleanup in pages
1f0b0d3 feat(design): Phase 4 — core pane token migration
e09aed3 feat(design): Phase 3 — shell & chrome accent token migration
ada381d feat(design): Phase 2 — replace hardcoded colors with design tokens
3bbbd62 feat(design): implement Phase 1 design tokens and warm Claude palette
```
