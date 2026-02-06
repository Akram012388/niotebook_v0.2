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
- Location: `src/ui/landing/NotebookFrame.tsx`
- Reusable wrapper for landing page content sections
- `bg-surface`, `rounded-2xl`, `shadow-sm`, generous padding (px-8/12/16, py-10/14)
- Three-layer binder architecture (all use shared `binderInset` positioning):
  - Layer 1 (z-0): Rails — two true-black vertical lines
  - Layer 2 (z-1): Mask strip — narrow `bg-surface` strip with CSS radial-gradient mask punching holes only over the rail column
  - Layer 3 (z-2): Content — opaque `bg-surface`, no mask
- Binder geometry constants: RAIL_W=2, RAIL_GAP=2, BINDER_LEFT=20, HOLE_D=6, HOLE_SPACING=12
- Rails and mask strip share identical `top/bottom/left` = BINDER_LEFT (20px) for visual balance
- Mask uses `circle at 50% 50%` (relative to the narrow strip, not full frame)
- The binder is the brand "wink" -- nod to physical ring binders / notebook name

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

## File Locations
- Globals CSS: `src/app/globals.css` (tokens, theme, patterns)
- Layout: `src/app/layout.tsx` (font loading, body classes)
- Brand: `src/ui/brand/Wordmark.tsx`
- Shell: `src/ui/shell/AppShell.tsx`
- Landing: `src/ui/landing/` (Hero, ValueProp, Features, CTA, LandingFooter, NotebookFrame, LandingNav, ThemeToggle)
- Legal stubs: `src/app/(landing)/terms|privacy|cookies/page.tsx`
- ForceTheme: `src/ui/ForceTheme.tsx` (sets data-theme on mount, restores on unmount)
