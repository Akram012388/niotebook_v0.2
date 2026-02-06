# Niotebook v2 Redesign — Progress Tracker

> **Branch**: `redesign-v2` (base) → phase sub-branches
> **Brief**: `docs/redesign/REDESIGN_BRIEF.md`
> **Started**: 2026-02-06

---

## Phase Overview

| Phase | Description | Status | Branch | Commit |
|-------|-------------|--------|--------|--------|
| **1** | Design Tokens & Primitives | **Done** | `redesign/phase-1-tokens` | `3bbbd62` |
| **2** | Base Components | **Done** | `redesign/phase-2-components` | `002cc5b` |
| **3** | Shell & Chrome | **Done** | `redesign/phase-3-shell` | `5f8b44a` |
| **4** | Core Panes | **Done** | `redesign/phase-4-panes` | `58ed916` |
| **5** | Pages | Pending | — | — |
| **6** | Polish | Pending | — | — |

---

## Phase 1 — Design Tokens & Primitives ✅

**Commit**: `3bbbd62` on `redesign/phase-1-tokens`
**Files changed**: 4 (580 insertions, 85 deletions)

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
- [x] Verification: typecheck ✅ lint ✅ tests (153/153) ✅

---

## Phase 2 — Base Components ✅

**Commit**: `002cc5b` on `redesign/phase-2-components`
**Files changed**: 26 (237 insertions, 92 deletions)

### Deliverables
- [x] Status badges — `bg-status-*/10 text-status-*` (InviteManagement, UserManagement)
- [x] Role badges — accent-muted for admin, status-info for user, surface-muted for guest
- [x] KPI delta colors — `text-status-success` / `text-status-error`
- [x] Runtime status dots — `bg-status-info/success/warning/error`
- [x] Editor dirty indicator — `bg-status-warning` (was amber-400)
- [x] File tree delete action — `text-status-error` (was red-500)
- [x] Editor skeleton — `nio-shimmer-workspace` (warm shimmer for dark code surfaces)
- [x] HeroSection — all hardcoded hex → design tokens (bg, text, badge, CTA, orbs, grid)
- [x] CTASection — `bg-accent text-accent-foreground` with warm shadow
- [x] BootSequence — `bg-surface-strong text-accent` (was hardcoded hex)
- [x] Clerk appearance — CSS custom properties (was hardcoded hex)
- [x] Course cards — `workspace-accent` → `accent` throughout courses section
- [x] Admin charts — `var(--accent)` for chart accent, `var(--text-subtle)` for ticks
- [x] Output panel stderr — `text-status-error` (was red-300/red-600)
- [x] AI pane stream error — `status-warning/10` border+bg (was amber-200/50/800)
- [x] Env selector DEV badge — `text-status-warning` (was amber-500)
- [x] Feedback stars — `text-status-warning` (was yellow-500)
- [x] Content overview status — `text-status-success/warning/error` (was green/yellow/red)
- [x] Workspace shimmer variant added to globals.css
- [x] Verification: typecheck ✅ lint ✅ tests (153/153) ✅

---

## Phase 3 — Shell & Chrome ✅

**Commit**: `5f8b44a` on `redesign/phase-3-shell`
**Files changed**: 9

### Deliverables
- [x] ControlCenterDrawer — `workspace-accent` → `accent` throughout (6 refs, tabs, active lessons, course buttons)
- [x] AppShell — fallback wordmark uses `font-display` (Orbitron)
- [x] PaneSwitcher — active pill `bg-accent-muted text-accent shadow-sm font-semibold` (was neutral bg)
- [x] TopNav — already clean, no changes needed
- [x] Layout preset toggles — already using design tokens, no changes needed
- [x] SplitDivider — correctly retains `workspace-*` (inside code editor, always dark)
- [x] Landing sections cleanup — `workspace-accent` → `accent` in FeaturesSection, ValuePropSection, CTASection, StatsSection
- [x] ChatMessage cursor — `dark:bg-workspace-accent` → `dark:bg-accent`
- [x] Verification: typecheck ✅ lint ✅ tests (153/153) ✅

---

## Phase 4 — Core Panes ✅

**Commit**: `58ed916` on `redesign/phase-4-panes`
**Files changed**: 3 (2 code + PROGRESS.md)

### Deliverables
- [x] VideoPlayer — `bg-black` → `bg-surface-strong`, overlay text `text-white` → `text-surface-strong-foreground` (warm-tinted)
- [x] CodeEditor textarea — `bg-black text-slate-100 caret-slate-100` → `bg-workspace-editor text-workspace-text caret-workspace-text`; removed inverted `dark:bg-slate-50 dark:text-slate-900` classes
- [x] ChatMessage — already clean (dark: modifiers are intentional token-based design)
- [x] AiPane — already clean (stream error uses status-warning tokens)
- [x] All code pane components (28 files) — verified clean, workspace-* tokens used correctly
- [x] Verification: typecheck ✅ lint ✅ tests (153/153) ✅

---

## Phase 5 — Pages (Pending)

### Planned Deliverables
- [ ] Course browser — CourseCard, CourseCarousel, CourseDetailPage
- [ ] Landing page — HeroSection, FeaturesSection, etc.
- [ ] Auth screens — AuthGate, AuthShell, BootSequence

---

## Phase 6 — Polish (Pending)

### Planned Deliverables
- [ ] Background pattern fine-tuning
- [ ] All micro-interactions and motion design
- [ ] Theme transition smoothness
- [ ] Accessibility audit (contrast ratios, focus states)
- [ ] Cross-browser testing
- [ ] Final color tuning

---

## Team Roster

| Role | Agent | Status |
|------|-------|--------|
| Lead | Main Claude | Active |
| Frontend Designer | `frontend-designer` (enhanced) | Standby |
| Scout | `scout` | Standby |
| Code Reviewer | `code-reviewer` | Standby |
| Performance Analyst | `performance-analyst` | Standby |

## Workflow Per Phase
1. `/clean-checkout` → phase sub-branch
2. Scout explores target surface
3. Frontend Designer implements
4. `/verify` → typecheck + lint + test
5. Code Reviewer reviews
6. `/clean-commit` → atomic commits
7. `/clean-pr` → PR to `redesign-v2`
