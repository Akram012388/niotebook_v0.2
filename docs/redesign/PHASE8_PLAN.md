# Phase 8 — Route Redesign: Consolidated Implementation Plan

> **Status:** Approved (pending implementation)
> **Date:** 2026-02-06
> **Branch:** `redesign-v2` (base for all PRs)
> **Scope:** Sign-in, Courses, Course Detail routes + collapsible sidebar shell
> **Source docs:** `UX_SPEC_PHASE8.md`, `PHASE8_ARCHITECTURE.md`, Devil's Advocate risk assessment

---

## Summary

Update three route groups to match the redesigned landing page (source of truth for brand UI):
1. **Sign-in** (`/sign-in`) — invite-only auth page
2. **Courses** (`/courses`) — course library
3. **Course Detail** (`/courses/[courseId]`) — lecture list → card grid

This plan synthesizes findings from three parallel analyses (UX specialist, technical architect, devil's advocate) with user decisions on contested points.

---

## Final Decisions (User-Resolved Conflicts)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Sidebar** | Full collapsible rail (56px) ↔ expanded (240px) | User wants the pattern established now, even for 2 routes |
| **NotebookFrame** | Full wrap on desktop, `hidden` below `sm` breakpoint | Preserves mobile usability (271px was too tight) |
| **NotebookFrame padding** | Add `compact` prop for dense content pages | Tech architect recommendation accepted |
| **`dark:` hover states** | Remove, replace with theme-agnostic `hover:border-accent/30 hover:shadow-md` | Matches landing FeatureCard pattern |
| **Animation density** | Full landing density (0.5s, i×0.1 stagger) on all routes | User accepts the polish-over-speed tradeoff |
| **Clerk button** | Keep `bg-foreground` (already theme-responsive) | Tech architect confirmed it swaps correctly |
| **Theme** | Light default + ThemeToggle on signin/courses/detail | Remove ForceTheme dark from these 3 route groups |
| **PR strategy** | 3 parallel PRs after prerequisite commit on `redesign-v2` | Tech architect proved zero file overlap |

---

## Critical Fixes (All Agents Agreed)

### 1. Clerk OTP CSS — `globals.css:454-458`

**Bug:** Hardcoded dark-mode hex values make OTP inputs invisible on light theme.

```css
/* BEFORE (broken in light mode) */
.cl-otpCodeFieldInput {
  color: #F4F3EE !important;
  border: 1px solid #3A3531 !important;
  background: var(--surface-muted) !important;
  caret-color: #F4F3EE !important;
}

/* AFTER (theme-responsive) */
.cl-otpCodeFieldInput {
  color: var(--foreground) !important;
  border: 1px solid var(--border) !important;
  background: var(--surface-muted) !important;
  caret-color: var(--foreground) !important;
}
```

**Priority:** Must be in PR1 (sign-in). Without this, users cannot sign in on light theme.

### 2. Cold Blue-Gray Radial Gradient

Both `SignInPage` and `AuthShell` use `rgba(148,163,184,0.18)` — a cool slate that contradicts the warm palette. **Remove entirely.** Landing page has no radial gradients.

### 3. Typography Correction

**Orbitron is Wordmark-only.** The landing page does NOT use `font-display` for headings — all headings use `font-sans` (Geist Sans). Do not add `font-display` to route headings. The mono-label pattern (`text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60`) should be added to section headers.

---

## Implementation Structure

### Prerequisite Commit (on `redesign-v2` directly)

Before branching for parallel PRs:

1. Move `src/ui/landing/ThemeToggle.tsx` → `src/ui/shared/ThemeToggle.tsx`
2. Move `src/ui/landing/NotebookFrame.tsx` → `src/ui/shared/NotebookFrame.tsx`
3. Add `compact` prop to NotebookFrame (`px-6 sm:px-8 py-6 sm:py-8` when true)
4. Add `hidden sm:block` responsive wrapper option to NotebookFrame (or handle at call site)
5. Update all imports (landing page files)

### PR1: Sign-in Page Redesign

**Branch:** `redesign/signin` (from `redesign-v2`)

**Files modified:**
| File | Changes |
|------|---------|
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Remove ForceTheme, remove radial gradient, wrap in NotebookFrame, add Framer Motion entrance stagger, add top bar (Wordmark + ThemeToggle) |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Remove ForceTheme if present, align with sign-in treatment |
| `src/ui/auth/AuthShell.tsx` | Remove radial gradient overlay |
| `src/app/globals.css` | Fix Clerk OTP CSS (hardcoded hex → CSS vars) |

**Key specs:**
- Two-column layout inside NotebookFrame: Clerk form (left) + BootSequence dark inset (right)
- BootSequence: No changes needed (already `bg-surface-strong text-accent`)
- Top bar: Wordmark left, ThemeToggle right (reuse LandingNav pattern)
- NotebookFrame: `hidden sm:block` — skip binder on mobile
- Animations: fade+slide-up stagger (0.5s base, 0.1s increments)
- Add mono-label above Clerk form: "Sign in to your account"
- `clerkAppearance.ts`: No changes (already theme-responsive)

**Estimated diff:** ~80 lines across 4 files

### PR2: Sidebar Shell + Courses Layout

**Branch:** `redesign/sidebar-courses` (from `redesign-v2`)

**Files created:**
| File | Purpose |
|------|---------|
| `src/ui/shell/SidebarShell.tsx` | Main sidebar layout wrapper (sidebar + content area) |
| `src/ui/shell/SidebarNav.tsx` | Navigation items list |
| `src/ui/shell/SidebarToggle.tsx` | Collapse/expand chevron button |

**Files modified:**
| File | Changes |
|------|---------|
| `src/app/courses/layout.tsx` | Replace header with SidebarShell |
| `src/app/courses/page.tsx` | Remove ForceTheme |
| `src/app/courses/[courseId]/page.tsx` | Remove ForceTheme |

**Sidebar spec:**
- Collapsed rail: 56px (icon buttons only)
- Expanded panel: 240px (icons + labels)
- Items: Wordmark (top), Courses, Settings (placeholder), spacer, ThemeToggle, Sign out (bottom)
- State: `localStorage("niotebook.sidebar")` + React state (not Zustand)
- Breakpoints: ≥1024 expanded default, 768–1023 collapsed default, <768 hamburger/hidden
- Animation: CSS `width` transition, `duration-200 ease-default`
- Active item: `bg-accent-muted border-l-3 border-l-accent text-foreground`
- Hydration: SSR renders expanded (safe default), collapse client-side via `requestAnimationFrame` guard
- Accessibility: `role="navigation"`, `aria-label="Main navigation"`, `aria-expanded` on toggle

**Estimated diff:** ~200 lines across 6 files

### PR3: Course Detail Cards + Animation Alignment

**Branch:** `redesign/course-detail-cards` (from `redesign-v2`)

**Files modified:**
| File | Changes |
|------|---------|
| `src/ui/courses/CourseDetailPage.tsx` | Convert lecture rows → card grid inside NotebookFrame (compact), add mono-label, align animations |
| `src/ui/courses/CoursesPage.tsx` | Wrap sections in NotebookFrame (compact), add mono-labels, align animation timings |
| `src/ui/courses/CourseCard.tsx` | Remove `dark:` hover prefixes, replace with `hover:border-accent/30 hover:shadow-md` |
| `src/ui/courses/ResumeCard.tsx` | Same `dark:` prefix removal |

**Lecture card spec:**
- Grid: `grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5`
- Card: `rounded-2xl border border-border bg-surface p-5`
- Hover: `hover:border-accent/30 hover:shadow-md transition-all duration-200`
- Lecture number: `w-8 h-8 rounded-lg bg-surface-muted font-mono text-text-muted`
- Duration: `font-mono text-xs`
- Completed: `border-l-3 border-l-accent bg-accent/[0.03]`
- Actions: "Start"/"Review" pill (`bg-accent/10 text-accent`) + "Mark Complete" ghost button
- Stagger: `staggerChildren: 0.1`, per-card `delay: i × 0.1, duration: 0.5`, `viewport: { once: true, amount: 0.2 }`

**Animation alignment for courses:**
- Header: `initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} duration:0.5`
- Card stagger: `i × 0.1` delay, `0.5s` duration (up from current 0.06/0.35)
- All `whileInView` keep `once: true`

**Estimated diff:** ~150 lines across 4 files

---

## Merge Order

```
redesign-v2 ← Prerequisite commit (shared component moves)
  ├── PR2: Sidebar + Courses Layout (merge first — establishes shell)
  ├── PR1: Sign-in (merge second — includes critical OTP fix)
  └── PR3: Course Detail Cards (merge third — cosmetic, lowest risk)
```

Any order works (zero file overlap), but this sequence makes the most logical sense.

---

## Testing Strategy

| Test Type | What | When |
|-----------|------|------|
| `bun run test` | All 153 existing unit tests | After each PR |
| `bun run typecheck` | TypeScript strict | After each PR |
| `bun run lint` | ESLint + Prettier | After each PR |
| New unit test | SidebarShell component | PR2 |
| Manual QA | Clerk OTP on light + dark themes | PR1 (critical) |
| Manual QA | Sidebar collapse/expand at breakpoints | PR2 |
| Manual QA | NotebookFrame hidden on mobile | All PRs |

**Existing tests at risk:** None. All 153 tests cover domain logic, not theme/layout.

---

## Scope Boundaries (Explicitly Out of Scope)

| Item | Status | Rationale |
|------|--------|-----------|
| Admin routes | Not in scope | No ForceTheme, separate layout, not mentioned |
| Legal pages (`/terms`, `/privacy`, `/cookies`) | Keep ForceTheme dark | Not in scope for Phase 8 |
| Workspace shell | Keep AppShell as-is | Already has its own shell |
| `ForceTheme.tsx` deletion | Do NOT delete | Workspace (`light`) and legal pages (`dark`) still use it |
| Footer on authenticated routes | Not in scope | Can be Phase 9 |
| CodeMirror/xterm themes | Not in scope | Separate open items |
| Custom icon overrides | Not in scope | Separate open item |

---

## Risk Register (from Devil's Advocate, Mitigated)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Clerk OTP invisible in light mode | HIGH | Fix in PR1 (hex → CSS vars). Manual QA before merge. |
| Sidebar hydration layout shift | MEDIUM | SSR renders expanded. Client collapses via `requestAnimationFrame` guard. |
| NotebookFrame too tight on mobile | MEDIUM | `hidden sm:block` — skip entirely below `sm`. Accepted. |
| NotebookFrame padding for dense grids | LOW | `compact` prop (prereq commit). |
| `dark:` hover states after ForceTheme removal | LOW | Removing `dark:` prefixes, using theme-agnostic hover. Done in PR3. |
| Animation fatigue on repeat visits | LOW | User accepted. All `whileInView` use `once: true`. |
| Sign-up page inconsistency | LOW | PR1 includes sign-up page alignment. |

---

## File Impact Summary

- **New files:** 3 (SidebarShell, SidebarNav, SidebarToggle)
- **Moved files:** 2 (ThemeToggle, NotebookFrame → `src/ui/shared/`)
- **Modified files:** 12
- **Deleted files:** 0
- **Total estimated diff:** ~430 lines across 3 PRs + prerequisite commit
