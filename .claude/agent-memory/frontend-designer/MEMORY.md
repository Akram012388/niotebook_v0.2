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
- Surface-muted: `#EDEAE4` (light) / `#2E2A27` (dark)
- Border-muted: `#EDEAE4` (light) / `#2E2A27` (dark) — good hover target for surface-muted buttons
- Theme: `data-theme` attribute on `<html>`, not class-based

### Niotepad Grid Pattern
- CSS custom property: `--niotepad-grid` at rgba opacity 0.012 (light and dark)
- Light: `rgba(28, 25, 23, 0.012)` — Dark: `rgba(244, 243, 238, 0.012)`
- Applied via inline style with two `linear-gradient` calls (horizontal + vertical)
- `backgroundSize: "24px 24px"`, `backgroundAttachment: "local"` (scrolls with content)
- Only on the scrollable content area, NOT the pane header

### Nav Button Pattern (unified post-SiteNav refactor)
- Standard class: `rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2`
- Used in: LandingNav (Link), AuthShell (Link), CoursesNavActions (button)
- No extracted component — kept inline, 3 consumers only

### SiteNav Component
- Location: `src/ui/shared/SiteNav.tsx`
- Fixed nav, `h-[72px]`, `z-50`, backdrop-blur
- Background: `color-mix(in srgb, var(--background) 80%, transparent)` (inline style — no Tailwind equiv)
- Border: `1px solid var(--border)` (inline style)
- Children gap: `gap-2 sm:gap-3` (tighter on mobile)
- Content offset: consumers use `pt-[72px]` on main content

### Brand Component: Wordmark
- Location: `src/ui/brand/Wordmark.tsx`
- Used in: SiteNav (h=40), legal pages (h=24)
- 'i' in accent color, 1.05x size for dot emphasis
- Font-size ratio: 0.85 * height, weight: 700

### NotebookFrame Component
- Location: `src/ui/shared/NotebookFrame.tsx`
- Reusable wrapper — landing, auth, course pages
- `compact` prop for tighter padding; `hidden sm:block` pattern for mobile

## Auth Pages Pattern
- **Top bar**: SiteNav with ThemeToggle + "← Home" link
- **Content area**: `max-w-4xl`, `pt-24 pb-12`
- **Desktop (sm+)**: Content wrapped in NotebookFrame
- **Mobile**: Content rendered bare

## Landing Page Structure
- `page.tsx` -> LandingNav, HeroSection, ValuePropSection, FeaturesSection, CTASection, LandingFooter
- All sections use `relative z-[2]`, consistent `max-w-4xl`, `py-12 sm:py-16`, `px-4 sm:px-6`

## Course Pages Pattern
- CoursesPage and CourseDetailPage wrap content in desktop-only NotebookFrame (`compact`)
- Loading skeletons: `nio-shimmer` class (not `animate-pulse`)

## Lessons Learned

### Inline Styles vs Tailwind Utilities (2026-02-07)
- **Problem**: `style={{ background: "var(--surface-muted)" }}` bypasses Tailwind's utility system
- **Fix**: Use `bg-surface-muted` when `--color-surface-muted` is mapped in `@theme inline`
- **Rule**: Only use inline styles when CSS custom properties aren't mapped to Tailwind tokens (e.g., `color-mix()`)

### Focus-Visible Rings for Keyboard Navigation (2026-02-07)
- Use `focus-visible` not `focus` — avoids ring on mouse clicks
- Pattern: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`

### Nav Height Contract (2026-02-07)
- SiteNav is exactly `h-[72px]` — contract with content areas using `pt-[72px]`
- Made explicit (was implicit via py-4 + content height)

### Grid Pattern z-index Stacking (2026-02-06)
- `.nio-pattern::before` is `position: fixed; z-index: 1`
- All content sections need `relative z-[2]`

### Tailwind 4 @theme inline Circular References (2026-02-06)
- Never do `--font-display: var(--font-display)` — point to source var

### Dark Surface Text Contrast (2026-02-06)
- On `bg-surface-strong`, use `text-surface-strong-foreground/{opacity}` not `text-text-muted`

### Clerk OTP Theme Fix (2026-02-07)
- Use CSS custom properties in `.cl-otpCodeFieldInput`, not hardcoded hex

### Git Branch Discipline in Team Environments (2026-02-07, updated 2026-02-08)
- Write files -> `git add` immediately -> commit ASAP
- Verify branch before each git operation
- **Always run `git branch --show-current` after checkout** — linter hooks can modify files mid-checkout
- If a commit lands on the wrong branch: cherry-pick to correct branch, then `git reset --hard HEAD~1` on the wrong one
- When multiple teammates share a working directory, `git status` shows everyone's changes — only stage your own files

### React Compiler Lint: useCallback Dependencies (2026-02-08)
- `react-hooks/preserve-manual-memoization` fires when inferred deps don't match declared deps
- When adding a new reference inside a `useCallback`, MUST add it to the dependency array
- React Compiler infers dependencies — if it sees `headerTitle.primary` used, it expects it in deps

### React Compiler Lint: No Ref Writes During Render (2026-02-07)
- `react-hooks/refs` rule forbids `someRef.current = value` in the render body
- Move ref writes into `useEffect`: `useEffect(() => { ref.current = value }, [value])`
- For RAF loops reading latest prop values: use `useEffect` to sync prop -> ref, RAF reads ref
- Effect order: React runs effects after render, RAF runs before next paint -- timing is fine

### RevealContent Typewriter Pattern (2026-02-07)
- RAF loops that depend on growing content must NOT use content length in `useEffect` deps
- Store cursor in `useRef`, content length in `useRef`, run RAF loop once on mount (`[]` deps)
- The loop reads `contentLenRef.current` each tick -- always sees latest value
- Guard with `Math.min(cursor, target)` in case content ever shrinks

## Admin Console Pattern (redesigned 2026-02-07)
- **Layout**: Sidebar (w-60) + main content (max-w-[1200px] mx-auto)
- **Sidebar**: Wordmark (h=24) + "Admin" pill badge, nav items with icons, ThemeToggle at bottom, "Back to app" link
- **Active nav**: `bg-accent text-white font-medium shadow-sm` on `rounded-xl`
- **Inactive nav**: `text-text-muted hover:bg-surface-muted hover:text-foreground`
- **Cards**: `rounded-2xl border border-border bg-surface p-5` + `hover:border-accent/20 hover:shadow-md transition-all duration-200`
- **Section labels**: `text-xs font-semibold font-mono uppercase tracking-[0.15em] text-accent`
- **Toggle groups**: `rounded-xl border border-border bg-surface p-1` container, `rounded-lg` buttons with `bg-accent text-white` active
- **Input pattern**: `rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-text-subtle transition-colors duration-150 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20`
- **Table containers**: `rounded-2xl border border-border` outer
- **Table headers**: `bg-surface-muted` with `py-3 text-xs font-medium text-text-muted`
- **Table rows**: `hover:bg-surface-muted/50 transition-colors duration-100`
- **Event badges**: `rounded-md bg-accent-muted px-2 py-0.5 font-mono text-accent` (not plain bg-surface-muted)
- **Status badges**: `rounded-full px-2.5 py-0.5 text-xs font-medium` with status color bg/text
- **Generate button**: `rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent-hover`
- **Loading state**: spinner `animate-spin border-2 border-border border-t-accent` + text
- **Access denied**: lock icon in `bg-accent-muted` container + text

## Figma Brand Plugin (tools/figma-brand-plugin/)
- **Build**: `bun run build` (esbuild, target es2017)
- **Manifest**: `documentAccess: "dynamic-page"` -- all Figma APIs must be async
- **Core helper**: `buildWordmarkText(label, fontSize, mode)` creates text with terracotta 'i'
- **Wordmark identity**: 'i' at char index 1 in both "niotebook" and "nio"
  - Light: black text (#1c1917), 'i' = #c15f3c
  - Dark: white text (#f4f3ee), 'i' = #da7756
  - Accent: all terracotta (#c15f3c)
- **No gray bar** -- removed in v2 rewrite
- **clearPage()**: removes all children; use on Social/Brand Guide pages; do NOT use on shared pages (Logo System, App Icons)
- **Pages**: Logo System (wordmark + nio mark + badge), Social, App Icons (icon + favicons + email), Brand Guide
- **Font loading**: `loadLogoFont()` tries Orbitron Bold -> Regular -> Inter Bold
- **Brand Guide**: master frame 1440px wide, dark bg, cursorY cursor tracking prevents overlaps

## File Locations
- Globals CSS: `src/app/globals.css` (tokens, theme, patterns)
- Layout: `src/app/layout.tsx` (font loading, body classes)
- Brand: `src/ui/brand/Wordmark.tsx`
- Shell: `src/ui/shell/AppShell.tsx`
- Shared: `src/ui/shared/SiteNav.tsx`, `ThemeToggle.tsx`, `NotebookFrame.tsx`
- Landing: `src/ui/landing/` (Hero, ValueProp, Features, CTA, LandingFooter, LandingNav)
- Auth: `src/ui/auth/AuthShell.tsx`, `BootSequence.tsx`
- Courses: `src/ui/courses/CoursesNavActions.tsx`, `CoursesPage.tsx`, `CourseDetailPage.tsx`
- Legal stubs: `src/app/(landing)/terms|privacy|cookies/page.tsx`
- ForceTheme: `src/ui/ForceTheme.tsx`
- StorageAdapter: `src/infra/storageAdapter.ts`
- Niotepad: `src/ui/panes/NiotepadPane.tsx`, `src/ui/panes/NiotepadEntry.tsx`
- Domain types: `src/domain/niotepad.ts` (NiotepadEntry type with metadata including lectureTitle)
