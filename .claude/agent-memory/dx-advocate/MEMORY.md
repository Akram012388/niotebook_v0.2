# DX Advocate Agent Memory

## Codebase Navigation Map

### Route → Shell Mapping (as of 2026-02-07, refactor/courses-navbar-layout branch)

| Route                            | Layout shell                            | Nav component                     |
| -------------------------------- | --------------------------------------- | --------------------------------- |
| `/` (landing)                    | None (page-level)                       | LandingNav → SiteNav              |
| `/sign-in`, `/sign-up`           | None                                    | AuthShell → SiteNav               |
| `/courses`, `/courses/[id]`      | CoursesLayout (via courses/layout.tsx)  | SiteNav + CoursesNavActions       |
| `/workspace`                     | AppShell (TopNav + ControlCenterDrawer) | TopNav                            |
| `/admin/*`                       | AdminLayout                             | AdminLayout (built-in)            |
| `/terms`, `/privacy`, `/cookies` | None                                    | None (ForceTheme dark, inline WM) |

### Shared Components

- `src/ui/shared/SiteNav.tsx` — shared fixed top nav (3-prop API: children, wordmarkHref, ariaLabel)
- `src/ui/shared/ThemeToggle.tsx` — canonical location (re-export shim deleted)
- `src/ui/shared/NotebookFrame.tsx` — canonical location (re-export shim deleted)
- `src/ui/courses/CoursesNavActions.tsx` — right-side actions for courses nav

### Deleted Components (refactor/courses-navbar-layout)

- `src/ui/shell/SidebarShell.tsx` — replaced by SiteNav
- `src/ui/courses/CourseCarousel.tsx` — dead code (never imported)
- `src/ui/landing/ThemeToggle.tsx` — re-export shim removed
- `src/ui/landing/NotebookFrame.tsx` — re-export shim removed
- `localStorage("niotebook.sidebar")` — orphaned key, no source code references

### Key Architectural Patterns

- **SiteNav children slot**: Each consumer composes its own right-side actions
- **Nav height**: ~72px (py-4 + Wordmark h=40 + border), offset via `pt-[72px]`
- **AppShell is workspace-only**: Only imported by `src/app/workspace/page.tsx`
- **TopNav has its own theme toggle** (binary light/dark, different from capsule ThemeToggle)

### Test Coverage Gaps

- No unit tests for: SiteNav, LandingNav, AuthShell, NotebookFrame, ThemeToggle, Wordmark
- E2E tests for courses exist but are shallow (no nav interaction tests)
- Unit tests exist for: CourseCard, comingSoonCourses (data-level)

### Documentation Architecture

- `docs/architecture/SITENAV_ROUTE_AUDIT.md` — SiteNav route audit + file boundaries (current)
- `docs/architecture/COURSES_LAYOUT_REFACTOR.md` — historical analysis + resolution (Section 10)
- `docs/redesign/PHASE8_ARCHITECTURE.md` — Phase 8 architecture (Sections 1-2 superseded by SiteNav)
- `docs/redesign/PHASE8_PLAN.md` — Phase 8 plan (PR2 superseded by nav refactor)
- `docs/redesign/STATE.md` — branch state tracker

### DX Friction Points (remaining)

1. TopNav in workspace has its own binary theme toggle, not the shared capsule ThemeToggle
2. CLAUDE.md and README don't mention component organization patterns
3. No JSDoc on page-level components (layouts, route pages)
4. Legal pages have no SiteNav — deferred, currently use inline Wordmark + ForceTheme dark
