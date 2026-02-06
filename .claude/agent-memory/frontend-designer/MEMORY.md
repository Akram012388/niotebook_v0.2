# Frontend Designer Agent Memory

## Design System

### Font Stack
- **Orbitron** (display/logo): loaded in `layout.tsx` as `--font-orbitron`, weights 400-700
- **Geist Sans** (body): `--font-geist-sans` / `--font-body`
- **Geist Mono** (code): `--font-geist-mono` / `--font-code`
- Token chain: `layout.tsx` sets CSS var -> `globals.css` `:root` aliases -> `@theme inline` maps to Tailwind utilities

### Color Tokens
- Accent: Crail terracotta `#C15F3C` (light) / `#DA7756` (dark)
- Background: Pampas `#F4F3EE` (light) / `#1C1917` (dark)
- Theme: `data-theme` attribute on `<html>`, not class-based

### Brand Component: Wordmark
- Location: `src/ui/brand/Wordmark.tsx`
- Used in: LandingNav (h=40), AppShell TopNav, sign-in, courses layout, auth shell
- 'i' in accent color, 1.05x size for dot emphasis
- Font-size ratio: 0.85 * height, weight: 700

### NotebookFrame Component
- Location: `src/ui/shared/NotebookFrame.tsx` (moved from landing/)
- Reusable wrapper — landing pages, auth pages, course pages, any content section
- `bg-surface`, `rounded-2xl`, `shadow-sm`, generous padding; `compact` prop for tighter padding
- Three-layer binder architecture with punch-holes (brand "wink" — notebook/ring binder)
- **Mobile pattern**: `hidden sm:block` wrapper for desktop + `sm:hidden` plain div for mobile

## Auth Pages Pattern (post-redesign)
- **Top bar**: Fixed nav matching LandingNav — Wordmark(h=40) left, ThemeToggle + "← Home" right
- **Background**: `color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-blur-md`
- **Border**: `borderBottom: 1px solid var(--border)` via inline style
- **Content area**: `max-w-4xl`, `pt-24 pb-12` (accounts for fixed nav)
- **Desktop (sm+)**: Content wrapped in NotebookFrame
- **Mobile**: Content rendered bare (no NotebookFrame)
- **Sign-in**: Two-column — Clerk form (max-w-md) + BootSequence (max-w-sm, hidden below md)
- **Mono label**: `text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60 mb-3`
- **AuthShell**: Reusable wrapper used by sign-up — same top bar + NotebookFrame pattern
- **No ForceTheme**: Pages follow user's theme preference
- **Framer Motion**: fadeUp animations with staggered delays (0, 0.1, 0.2, 0.3)

## Landing Page Structure (post-rework)
- `page.tsx` -> LandingNav, HeroSection, ValuePropSection, FeaturesSection, CTASection, LandingFooter
- LandingFooter is a standalone component at `src/ui/landing/LandingFooter.tsx` (NOT inside NotebookFrame)
- Footer uses `bg-surface-strong` for contrast, sits outside `<main>` and below all `z-[2]` sections
- Footer text uses opacity-based `text-surface-strong-foreground/{opacity}` for theme-safe contrast
- StatsSection merged into ValuePropSection (university credibility + stats as closing element, separated by `border-t border-border/40`)
- All sections below hero wrapped in NotebookFrame
- No section-level horizontal dividers (border-t/border-b removed)
- framer-motion entrance animations on all sections
- ValuePropSection: header -> 3 value props (vertical stack) -> university names + compact stats (border-t divider)
- FeaturesSection: 2x2 card grid, `bg-surface` (opaque, not /50), simple hover
- CTASection: headline + subtext + CTA button (copyright moved to footer)
- All sections use consistent `max-w-4xl`, `py-12 sm:py-16`, `px-4 sm:px-6`
- All sections have `relative z-[2]` to stack above the body grid pattern (`z-1`)
- Legal stub pages at `src/app/(landing)/terms|privacy|cookies/page.tsx` with ForceTheme dark

## Course Pages Pattern (Phase 8)
- CoursesPage and CourseDetailPage wrap content in desktop-only NotebookFrame (`compact`)
- **Mono-label pattern**: `text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60` replaces accent-bar headers
- **Animation timings** (aligned to landing): `staggerChildren: 0.1`, per-card `delay: i * 0.1`, `duration: 0.5`
- Header entrance: `initial={{ opacity:0, y:16 }}` (positive y, not negative)
- **Theme-agnostic hover**: `hover:border-accent/30 hover:shadow-md` — NO `dark:` prefix classes
- **No gradient glow overlays** — removed from CourseCard and ResumeCard
- Loading skeletons: `nio-shimmer` class (not `animate-pulse`)
- CourseDetailPage lecture grid: `grid grid-cols-1 sm:grid-cols-2`, card-based with numbered badges
- Completed cards: `border-l-[3px] border-l-accent bg-accent/[0.03]`

## Lessons Learned

### Grid Pattern z-index Stacking (2026-02-06)
- **Problem**: `.nio-pattern::before` grid overlay is `position: fixed; z-index: 1`, painting ON TOP of all content without explicit z-index
- **Fix**: All landing `<section>` elements need `relative z-[2]` to establish stacking contexts above the grid
- **Rule**: Any positioned element on landing page must have z-index >= 2 to sit above the body grid pattern
- **Note**: `position: relative` alone does NOT create a stacking context -- you need `z-index` too
- **Design**: Sections with transparent backgrounds still show grid through them (correct); NotebookFrame `bg-surface` hides grid (correct)

### Tailwind 4 @theme inline - Circular Reference Bug (2026-02-06)
- **Problem**: `@theme inline { --font-display: var(--font-display) }` creates circular CSS custom property reference
- **Fix**: Point directly to the source variable: `--font-display: var(--font-orbitron)`
- **Rule**: In `@theme inline`, never reference a CSS var with the same name as the theme token being declared

### Dark Surface Text Contrast (2026-02-06)
- **Problem**: `text-text-muted` / `text-text-subtle` tokens are relative to page background, not always-dark surfaces
- In dark mode, `text-subtle` is `#78716C` which has ~3.8:1 contrast on `surface-strong` (#141210) -- fails WCAG AA
- **Fix**: On `bg-surface-strong` elements, use `text-surface-strong-foreground/{opacity}` instead of muted/subtle tokens
- Headings: `/50`, links: `/70`, copyright: `/40`, borders: `/10`
- **Rule**: Never use page-background-relative text tokens on always-dark surfaces

### Clerk OTP Theme Responsiveness (2026-02-07)
- **Problem**: Hardcoded dark-mode colors (#F4F3EE, #3A3531) in Clerk OTP inputs break in light theme
- **Fix**: Use CSS custom properties: `var(--foreground)`, `var(--border)` instead of hardcoded hex
- **Location**: `globals.css` `.cl-otpCodeFieldInput` rule

### Git Race Conditions with Team Agents (2026-02-07)
- **Problem**: When working in a team, other agents switch git branches concurrently, wiping uncommitted changes
- **Fix**: Write files + `git add` + `git commit` as quickly as possible; verify branch before each operation
- **Rule**: After writing files, immediately stage and commit in the same sequence

### SidebarShell Component (2026-02-07)
- Location: `src/ui/shell/SidebarShell.tsx`
- Collapsible sidebar (240px expanded, 56px collapsed rail)
- Fixed position, `bg-surface`, `border-r border-border`
- State: `useState` + `localStorage` key `niotebook.sidebar`
- Uses `requestAnimationFrame` hydration guard (same pattern as ThemeToggle)
- Responsive: auto-collapse below 768px via `matchMedia`
- Width transition: `200ms cubic-bezier(0.4, 0, 0.2, 1)` — only after mount
- Main content uses matching `marginLeft` transition
- Nav items: Courses (active), Settings (disabled placeholder)
- Bottom: ThemeToggle + Sign out (via `useClerk`)
- Wordmark: expanded shows full text, collapsed shows just "n"
- Active state: `bg-accent-muted border-l-[3px] border-l-accent text-foreground font-medium`

### Team Branch Management (2026-02-07)
- **Problem**: Multiple agents share workspace; `git checkout --` resets ALL unstaged files
- **Fix**: Write files -> `git add` immediately -> then clean up other agents' stale changes
- **Rule**: Never run `git checkout --` on broad patterns when you have unstaged work

## File Locations
- Globals CSS: `src/app/globals.css` (tokens, theme, patterns)
- Layout: `src/app/layout.tsx` (font loading, body classes)
- Brand: `src/ui/brand/Wordmark.tsx`
- Shell: `src/ui/shell/AppShell.tsx`, `src/ui/shell/SidebarShell.tsx`
- Landing: `src/ui/landing/` (Hero, ValueProp, Features, CTA, LandingFooter, NotebookFrame, LandingNav, ThemeToggle)
- Legal stubs: `src/app/(landing)/terms|privacy|cookies/page.tsx`
- ForceTheme: `src/ui/ForceTheme.tsx` (sets data-theme on mount, restores on unmount)
- Shared: `src/ui/shared/ThemeToggle.tsx`, `src/ui/shared/NotebookFrame.tsx`
- Auth: `src/ui/auth/` (AuthShell, BootSequence, clerkAppearance, AuthGate)
- Sign-in: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Sign-up: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Courses: `src/ui/courses/` (CoursesPage, CourseDetailPage, CourseCard, ResumeCard)
- StorageAdapter: `src/infra/storageAdapter.ts` (SSR-safe localStorage wrapper)
