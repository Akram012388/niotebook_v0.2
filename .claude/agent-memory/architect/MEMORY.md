# Architect Agent Memory

## SiteNav Architecture (2026-02-07, post courses-nav refactor)

- **SiteNav** (`src/ui/shared/SiteNav.tsx`): shared fixed top nav, 3-prop API (children, wordmarkHref, ariaLabel)
- **3 consumers**: LandingNav, AuthShell, CoursesLayout — all use children slot for right-side actions
- **Nav height**: ~72px (py-4 + Wordmark height=40 + border), confirmed by `pt-[72px]` offset in CoursesLayout
- **API verdict**: No changes needed. Children slot is maximally flexible.
- **Full audit**: `docs/architecture/SITENAV_ROUTE_AUDIT.md`

## ForceTheme Usage Map

- `/sign-in`, `/sign-up`: NO ForceTheme (AuthShell, follows global theme)
- `/courses`, `/courses/[courseId]`: NO ForceTheme (SiteNav + CoursesNavActions)
- `/workspace`: ForceTheme **light**
- `/terms`, `/privacy`, `/cookies`: ForceTheme dark (stub content, inline Wordmark, no nav)
- `/admin/*`: NO ForceTheme (own AdminLayout sidebar)
- Landing `/`: NO ForceTheme (ThemeToggle)

## Route Nav Map

| Route                      | Nav                 | SiteNav?          |
| -------------------------- | ------------------- | ----------------- |
| `/`                        | LandingNav          | YES               |
| `/sign-in`, `/sign-up`     | AuthShell           | YES               |
| `/courses/*`               | CoursesLayout       | YES               |
| `/workspace`               | AppShell→TopNav     | NO (own system)   |
| `/admin/*`                 | AdminLayout sidebar | NO (own system)   |
| `/editor-sandbox`          | None (iframe)       | NO                |
| `/terms,/privacy,/cookies` | Inline Wordmark     | NO (stubs, defer) |

## Dead Code Status (branch: refactor/courses-navbar-layout)

- SidebarShell.tsx: DELETED, zero source imports, doc refs updated (marked superseded/deleted)
- CourseCarousel.tsx: DELETED, zero source imports, doc refs cleaned
- Landing re-export shims (ThemeToggle, NotebookFrame): DELETED, doc refs cleaned
- `niotebook.sidebar` localStorage key: orphaned (zero source refs, doc refs updated)
- `storageAdapter.ts`: NOT dead (used by ThemeToggle + 4 workspace components)
- `ForceTheme.tsx`: NOT dead (workspace + 3 legal pages)

## Theme Architecture

- `data-theme` attribute on `<html>`, blocking script in `<head>` (layout.tsx:76-79)
- ThemeToggle reads/writes `localStorage("niotebook.theme")`
- Tailwind 4 dark variant: `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
- Workspace tokens (`--workspace-*`) are always-dark, independent of theme

## Known Bugs / Tech Debt

- `globals.css:454-458`: Clerk OTP hardcoded dark-mode colors — breaks in light mode
- `clerkAppearance.ts` says `bg-foreground` but `globals.css` overrides to `var(--accent)`
- Button styling inconsistency: LandingNav, AuthShell, CoursesNavActions all copy-paste same inline style pattern

## Typography

- Orbitron: ONLY in Wordmark component
- All headings: Geist Sans (font-sans)
- Mono labels: `text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60`

## Shell Complexity

- CoursesLayout: 21 lines (SiteNav + CoursesNavActions + main wrapper)
- Workspace TopNav: ~310 lines, drawer state, focus trapping
- AdminLayout: 73 lines, sidebar nav with 6 items

## Test Suite (153 tests)

- UI tests: BootSequence (4), CourseCard (7), ComingSoonCourses (4), Terminal (8), Autocomplete (10)
- CourseCard test checks `opacity-60` — fragile if changed
- Tests mock framer-motion and next/link — safe from visual changes
- No E2E tests exercise auth UI

## Niotepad Architecture (2026-02-08)

- **Plan:** `docs/niotepad-feature.md` -- comprehensive floating panel plan
- **Branch:** `feat/niotepad-experimental` (fresh from main, supersedes `feat/niotepad`)
- **Key decision:** Floating portal overlay, NOT a fourth pane type (unlike feat/niotepad)
- **Mount:** React portal to document.body, outside workspace DOM tree
- **Z-index:** 50 (same as ControlCenterDrawer -- mutual exclusion required)
- **Shortcut:** `Cmd/Ctrl+J` (NOT Cmd+N -- browser-reserved, cannot be overridden)
- **State:** Single Zustand store for panel state + entry CRUD + page navigation
- **Persistence:** IndexedDB for entries (debounced 500ms), localStorage for panel geometry
- **Pages:** Per-lecture, auto-created on first push/write for a lesson
- **Glassmorphism:** backdrop-filter: blur(12px) + 78% alpha surface bg + multi-layer shadows
- **Paper:** repeating-linear-gradient ruled lines at 24px spacing + binder dots from NotebookFrame
- **Prior work reusable:** domain types, IndexedDB backend, useSelectionPush hook, /api/nio/summarize
- **Sacred files (DO NOT MODIFY):** WorkspaceGrid.tsx, LayoutGrid.tsx, layoutTypes.ts
- **8 implementation phases:** Foundation -> Shell -> Paper -> Swipe -> Pages -> Push -> Search -> Polish
- **nanoid:** Available as transitive dep (via convex or other), not direct -- may need explicit dep
- **framer-motion:** Already ^12.29.2 in deps, used by 9 files currently

## Workspace Layout Architecture

- **3 modes:** single (1-col), split (3fr+2fr), triple (2fr+1.5fr+1.5fr)
- **State:** `useSyncExternalStore` with module-level snapshot + localStorage
- **Pane state:** Module-level snapshots for singlePane, leftPane, rightPane
- **Video time:** Module-level external store with Set<listener> pattern
- **Key constraint:** Code in left pane forces Chat in right pane (split mode)
- **Keyboard:** 1/2/3 for layout, v/c/a for pane switching (raw keydown, not meta)
- **TopNav height:** 72px (h-[72px]), contains LayoutPresetToggle + ControlCenter button
- **ControlCenterDrawer:** fixed inset-0 z-50, right-0 slide-in, 360px wide, has focus trap
