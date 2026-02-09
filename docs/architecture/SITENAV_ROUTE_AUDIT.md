# SiteNav Route Audit & File Boundary Plan

**Date:** 2026-02-07
**Branch:** `refactor/courses-navbar-layout` (merged to `main` via `redesign-v2` on 2026-02-08)
**Status:** COMPLETE — Analysis and implementation done. Retained as architecture reference.

---

## 1. Full Route Map

### Routes Already Using SiteNav (3 consumers)

| Route                             | File                                                                     | SiteNav Consumer                | Right-Side Children                          |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------- | -------------------------------------------- |
| `/` (landing)                     | `src/app/page.tsx` → `LandingNav`                                        | `src/ui/landing/LandingNav.tsx` | ThemeToggle + "Courses" or "Sign in" link    |
| `/sign-in`, `/sign-up`            | `src/app/sign-in/*/page.tsx`, `src/app/sign-up/*/page.tsx` → `AuthShell` | `src/ui/auth/AuthShell.tsx:39`  | ThemeToggle + "Home" link                    |
| `/courses`, `/courses/[courseId]` | `src/app/courses/layout.tsx`                                             | Direct usage in layout          | `CoursesNavActions` (ThemeToggle + Sign out) |

### Routes With Their Own Nav (DO NOT touch)

| Route                   | File                                | Nav Component               | Reason                                                                                                                             |
| ----------------------- | ----------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/workspace?lessonId=X` | `src/app/workspace/page.tsx`        | `AppShell` → `TopNav`       | Completely separate full-IDE shell with workspace-specific controls. Own design system tokens (`--workspace-*`). ForceTheme light. |
| `/admin/*`              | `src/app/admin/layout.tsx`          | `AdminLayout` (sidebar nav) | Internal admin panel with sidebar navigation. Wrapped in `AuthGate` + `AdminGuard`. Entirely separate UI.                          |
| `/editor-sandbox`       | `src/app/editor-sandbox/layout.tsx` | None (isolated iframe)      | Has its own `<html>` root. No Clerk, no Convex, no providers. COOP/COEP sandboxed.                                                 |

### Routes That Need Attention: Legal Pages (3 pages)

| Route      | File                                 | Current Nav                                        | Issue                                                                                                                 |
| ---------- | ------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/terms`   | `src/app/(landing)/terms/page.tsx`   | Wordmark (inline, not a nav) + "Back to home" link | No SiteNav. Uses `ForceTheme dark`. Has inline Wordmark (`height={24}`) at top of content body — NOT a fixed nav bar. |
| `/privacy` | `src/app/(landing)/privacy/page.tsx` | Same as terms                                      | Same issue.                                                                                                           |
| `/cookies` | `src/app/(landing)/cookies/page.tsx` | Same as cookies                                    | Same issue.                                                                                                           |

### Legal Pages Analysis

The three legal pages are **identical in structure** (stub content). They all:

1. Force dark theme via `<ForceTheme theme="dark" />`
2. Render a Wordmark inline (not fixed, not nav) at `height={24}`
3. Have a "Back to home" link at the bottom
4. Live in the `(landing)` route group (no layout file — they inherit root layout directly)

**Decision required:** Should legal pages get SiteNav?

**Option A — Leave as-is (Recommended)**

- Legal pages are stub content with no real users yet
- Adding SiteNav + removing ForceTheme is a design decision, not a refactor
- The inline Wordmark + "Back to home" link pattern is sufficient for legal stubs
- Can be done later when actual legal content is written
- **Effort:** Zero
- **Risk:** Zero

**Option B — Wire SiteNav now**

- Would require: removing ForceTheme, wrapping in SiteNav, deciding what right-side actions to show (ThemeToggle? Sign in? Nothing?)
- Adds 3 file changes to this PR's scope
- Mixes refactoring (nav consolidation) with a design change (legal page look & feel)
- **Effort:** Low
- **Risk:** Low but scope-creepy

**Recommendation:** Option A. Legal pages are out of scope for this nav refactor. They're stubs. Flag as a follow-up task.

---

## 2. SiteNav API Review

### Current API

```tsx
interface SiteNavProps {
  children: ReactNode; // Right-side content
  wordmarkHref?: string; // Default "/"
  ariaLabel?: string; // Default "Site navigation"
}
```

### Assessment: Sufficient for All Current Consumers

| Consumer      | `children`                | `wordmarkHref` | `ariaLabel`         | Missing? |
| ------------- | ------------------------- | -------------- | ------------------- | -------- |
| LandingNav    | ThemeToggle + auth link   | `/` (default)  | `"Main"`            | No       |
| AuthShell     | ThemeToggle + "Home" link | `/` (default)  | `"Auth navigation"` | No       |
| CoursesLayout | `<CoursesNavActions />`   | `"/courses"`   | default             | No       |

### Potential Future Needs

1. **Left-side content beyond Wordmark?** — No current route needs this. Admin has its own sidebar. Workspace has TopNav. No consumer needs a left-side slot.

2. **Different nav height?** — All three consumers render at the same height (~72px from `py-4` + Wordmark `height={40}` + border). The `pt-[72px]` offset in CoursesLayout confirms this. Consistent across consumers. No override needed.

3. **Different background/behavior?** — All three consumers use the same backdrop-blur + color-mix background. No transparent-to-opaque scroll transition needed (that's a HeroSection concern, not a nav concern). No override needed.

4. **className or style override?** — Not needed now. If a future consumer needs custom styling, `className` can be added then. Don't add speculative props.

### Verdict: No API Changes Needed

The current 3-prop API (`children`, `wordmarkHref`, `ariaLabel`) covers every non-workspace route. The children slot pattern is maximally flexible — each consumer composes its own right-side content without SiteNav needing to know about ThemeToggle, auth links, or sign-out buttons.

---

## 3. File Ownership Boundaries (Phase 2)

### UI/UX Designer — Visual Polish & Responsive Tweaks

These files contain visual/interactive code the designer owns:

| File                                   | Scope of Work                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/ui/shared/SiteNav.tsx`            | Responsive padding, height, backdrop styling, potential hover states               |
| `src/ui/courses/CoursesNavActions.tsx` | Sign-out button styling, spacing, hover/focus states                               |
| `src/ui/auth/AuthShell.tsx`            | Nav children styling consistency, "Home" button styling to match CoursesNavActions |
| `src/ui/landing/LandingNav.tsx`        | "Sign in" / "Courses" button styling to match CoursesNavActions                    |
| `src/ui/brand/Wordmark.tsx`            | Only if Wordmark sizing/spacing needs adjustment within nav context                |

**Total: 5 files max** (Wordmark only if needed)

### DX Advocate — Dead Code Cleanup & Docs

These files contain dead code, stale docs, or orphaned references:

| File                                               | Action                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| `docs/architecture/COURSES_LAYOUT_REFACTOR.md`     | Update or archive — references SidebarShell as current, but it's deleted |
| `docs/redesign/PHASE8_ARCHITECTURE.md`             | Update SidebarShell references to reflect current SiteNav architecture   |
| `docs/redesign/PHASE8_PLAN.md`                     | Update to reflect completed SidebarShell → SiteNav migration             |
| `docs/redesign/STATE.md`                           | Update phase status                                                      |
| `.claude/agent-memory/architect/MEMORY.md`         | Update stale SidebarShell references                                     |
| `.claude/agent-memory/frontend-designer/MEMORY.md` | Update stale SidebarShell references                                     |
| `.claude/agent-memory/dx-advocate/MEMORY.md`       | Update stale references                                                  |
| `.claude/agent-memory/code-reviewer/MEMORY.md`     | Update stale SidebarShell references                                     |

**Total: 8 files** (all docs/memory, zero source code)

### Conflict-Free Verification

No file appears in both lists. The boundary is clean:

- **Designer** owns `src/ui/` source files (visual layer)
- **DX Advocate** owns `docs/` and `.claude/agent-memory/` files (documentation layer)
- **Neither** touches: `src/app/` route files (already wired correctly), `src/ui/shared/ThemeToggle.tsx` (no changes needed), `src/ui/shared/NotebookFrame.tsx` (no changes needed)

---

## 4. Dead Code Inventory (for DX Advocate)

### Already Deleted on This Branch (confirmed via git status)

- `src/ui/shell/SidebarShell.tsx` — ✅ deleted
- `src/ui/courses/CourseCarousel.tsx` — ✅ deleted
- `src/ui/landing/ThemeToggle.tsx` (re-export shim) — ✅ deleted
- `src/ui/landing/NotebookFrame.tsx` (re-export shim) — ✅ deleted

### Zero Source Code Imports Remaining

- `SidebarShell` — only referenced in docs/memory files (28 references across 8 doc files)
- `CourseCarousel` — only referenced in docs (3 references)
- `niotebook.sidebar` localStorage key — only referenced in docs (7 references), no source code uses it

### Orphaned Infrastructure

- `storageAdapter.ts` — Still used by ThemeToggle + 4 other workspace components. NOT dead code.
- `ForceTheme.tsx` — Still used by workspace (`ForceTheme light`) and 3 legal pages (`ForceTheme dark`). NOT dead code.

---

## 5. Open Questions for Lead

1. **Legal pages SiteNav wiring** — Recommended to defer. Confirm this is acceptable scope boundary.
2. **Button styling consistency** — LandingNav, AuthShell, and CoursesNavActions all have slightly different button styles for their action buttons (all use inline `style` with `var(--surface-muted)` but copy-pasted independently). The designer should evaluate whether to extract a shared `NavButton` component or keep them independent. This is a design decision, not an architecture decision.
3. **Admin panel** — Completely separate UI with its own sidebar navigation. Does not need SiteNav. Confirmed excluded from scope.
