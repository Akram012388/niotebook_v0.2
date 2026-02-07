# Niotebook v2 — UI/UX Redesign Brief

> **Status:** Complete (all 7 phases implemented)
> **Created:** 2026-02-06
> **Last updated:** 2026-02-06
> **Supersedes:** `DESIGN_SYSTEM.md` (v1 — now updated to reflect v2 implementation)

---

## Vision Statement

A **complete visual refresh** of Niotebook's frontend, replicating the warmth, calm focus, and premium craft of **Claude.ai/code** and **Claude Cowork (macOS)**. The redesign replaces the visual identity while preserving every behavior, structure, interaction pattern, and keyboard shortcut in the application.

---

## Design Philosophy

| Principle               | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **Claude Warmth**       | Warm color temperatures, soft depth, parchment-like quality — never cold or clinical |
| **Calm Focus**          | Reduce visual noise, generous whitespace, unhurried density                          |
| **Premium Craft**       | Every pixel intentional, every micro-interaction polished, no detail too small       |
| **Futuristic Identity** | Orbitron typeface as the brand fingerprint — geometric, distinctive, forward-looking |

---

## Typography System

| Role              | Font           | Usage                                                                    |
| ----------------- | -------------- | ------------------------------------------------------------------------ |
| **Display/Brand** | **Orbitron**   | Wordmark, page titles, major headings, section headers, key UI accents   |
| **UI/Body**       | **Geist Sans** | Body text, labels, buttons, navigation items, form inputs, chat messages |
| **Code**          | **Geist Mono** | Code editor, terminal, inline code, file names, timestamps               |

### Rationale

Orbitron is a geometric, futuristic display font that gives Niotebook a distinctive brand fingerprint. However, its wide letter-spacing and display-oriented design make it unsuitable for dense body text, so Geist Sans (Vercel's system font) handles all UI/body copy — it is clean, modern, highly readable, and native to the Next.js ecosystem. Geist Mono is the natural monospace companion for code surfaces.

---

## Color System

**Dual-theme** (warm dark + warm light), defaulting to **system preference**.

### Core Tokens (Finalized in Phase 1)

| Token              | Light Mode                | Dark Mode                    |
| ------------------ | ------------------------- | ---------------------------- |
| **bg-base**        | Pampas `#F4F3EE`          | Rich warm charcoal `#1C1917` |
| **bg-surface**     | Warm white `#FAF9F7`      | Elevated warm dark `#252220` |
| **bg-elevated**    | Soft cream `#EDEAE4`      | Higher warm dark `#2E2A27`   |
| **text-primary**   | Near black `#1C1917`      | Warm white `#F4F3EE`         |
| **text-secondary** | Warm gray `#78716C`       | Warm muted `#A8A29E`         |
| **text-muted**     | Light warm gray `#A8A29E` | Dim warm gray `#78716C`      |
| **accent**         | Crail `#C15F3C`           | Lighter terracotta `#DA7756` |
| **accent-subtle**  | `rgba(193,95,60,0.10)`    | `rgba(218,119,86,0.15)`      |
| **border-default** | Warm beige `#DDD8D0`      | Warm dark `#3A3531`          |
| **border-strong**  | Warm tan `#EDEAE4`        | Warm dark divider `#2E2A27`  |

> **Phase 1 complete:** All hex values finalized. See `src/app/globals.css` for the canonical token definitions.

### Accent Color

**Claude terracotta** — `#C15F3C` (light) / `#DA7756` (dark). Sourced from Claude's brand color "Crail". Replaces the previous amber/orange (#d97706). The dark variant is lighter to maintain contrast on dark backgrounds.

### Status Colors

| Status      | Usage                              |
| ----------- | ---------------------------------- |
| **Success** | Green — execution success, saves   |
| **Warning** | Warm yellow — caution states       |
| **Error**   | Red — failures, validation errors  |
| **Info**    | Blue — informational, neutral tips |

Status colors should use warm-tinted variants (not pure/saturated) to match the overall warmth of the palette.

---

## Background Treatment

- **Subtle grid pattern** overlay on base backgrounds (signature Claude Cowork element)
- Barely perceptible — felt more than seen
- Applied globally via `.nio-pattern` class on `<body>` (layout.tsx)
- Pattern: `linear-gradient` crosshatch, 24px grid, 1px lines
- Opacity: 1.8% (light mode) / 2% (dark mode) — adapts per theme
- Implemented via CSS custom properties — no image assets

---

## Spacing & Density

- **4px base grid** (maintained from v1)
- **Generous whitespace** — Claude-level breathing room, not cramped
- Padding and margins should feel unhurried and spacious
- Content should never feel packed; every element gets room to exist

### Scale

| Token | Value |
| ----- | ----- |
| `0`   | 0px   |
| `1`   | 4px   |
| `2`   | 8px   |
| `3`   | 12px  |
| `4`   | 16px  |
| `5`   | 20px  |
| `6`   | 24px  |
| `8`   | 32px  |
| `10`  | 40px  |
| `12`  | 48px  |
| `16`  | 64px  |

---

## Border Radius

Softer, warmer corners than v1 — closer to Claude's rounded-but-not-pill aesthetic.

| Token  | Value  | Usage                        |
| ------ | ------ | ---------------------------- |
| `sm`   | 6px    | Inputs, badges, small cards  |
| `md`   | 8px    | Buttons, cards, panels       |
| `lg`   | 12px   | Modals, drawers, large cards |
| `xl`   | 16px   | Hero elements, feature cards |
| `full` | 9999px | Pills, avatars, toggles      |

---

## Shadows

Warm, subtle depth — never harsh or cold. Shadows use warm undertones.

| Token       | Light Mode                                | Dark Mode                              |
| ----------- | ----------------------------------------- | -------------------------------------- |
| `shadow-sm` | `0 1px 2px rgba(28, 25, 23, 0.05)`        | `0 1px 2px rgba(0, 0, 0, 0.2)`         |
| `shadow-md` | `0 4px 6px -1px rgba(28, 25, 23, 0.07)`   | `0 4px 6px -1px rgba(0, 0, 0, 0.3)`    |
| `shadow-lg` | `0 10px 15px -3px rgba(28, 25, 23, 0.08)` | `0 10px 15px -3px rgba(0, 0, 0, 0.35)` |

---

## Motion & Micro-interactions

| Element               | Treatment                                              |
| --------------------- | ------------------------------------------------------ |
| **Panel transitions** | Spring-based easing, smooth pane switching             |
| **Hover states**      | Gentle opacity/background shifts, not abrupt           |
| **Loading states**    | Elegant skeleton screens with warm shimmer             |
| **Streaming text**    | Smooth character-by-character with subtle cursor       |
| **Drawer open/close** | Fluid slide + fade (refine current 180ms/120ms timing) |
| **Theme transitions** | Smooth cross-fade between dark and light               |
| **Focus rings**       | Warm accent glow, not harsh blue outlines              |
| **Button press**      | Subtle scale-down (0.98) + opacity shift               |
| **Card hover**        | Gentle lift via shadow elevation                       |

### Timing

| Token    | Duration | Easing                              | Usage                        |
| -------- | -------- | ----------------------------------- | ---------------------------- |
| `fast`   | 100ms    | `cubic-bezier(0.4, 0, 0.2, 1)`      | Hover states, opacity shifts |
| `normal` | 180ms    | `cubic-bezier(0.4, 0, 0.2, 1)`      | Most transitions             |
| `slow`   | 250ms    | `cubic-bezier(0.4, 0, 0.2, 1)`      | Drawers, panels, modals      |
| `spring` | 300ms    | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions   |

---

## Icon System

- **Base set:** Phosphor icons (existing — keep as foundation)
- **Custom overrides:** Key brand-defining icons get custom treatment to match Claude's warmer aesthetic
- **Style:** Consistent weight, warm feel, slightly rounded where appropriate
- **Default variant:** Outline (light weight), with filled variants for active states

---

## Component Implementation

- **Pure Tailwind CSS 4** — no external component libraries (no shadcn/ui, no Radix)
- **Handcrafted** everything for full pixel control
- **CSS custom properties** for theme tokens (enables dark/light switching via class toggle)
- Custom Tailwind theme configuration with `nio-*` prefixed design tokens

---

## Scope

### What Changes (Visual Refresh)

- All color values, backgrounds, borders
- Typography (font families, sizes, weights, line heights)
- Spacing and density (more generous, Claude-like breathing room)
- Border radii (softer, warmer corners)
- Shadows (warm, subtle depth)
- Button/input/card styling
- Background textures (grid/dot pattern)
- All micro-interactions and transitions
- Theme system (add dual-theme with system preference default)
- Icon styling and selective icon swaps

### What's Protected (Do Not Touch)

- Layout presets (1-col, 2-col, 3-col) and their proportions (100% / 60-40 / 40-30-30)
- Navigation structure (TopNav + right drawer)
- Pane arrangement (Video/Code/AI triad)
- All keyboard shortcuts (1/2/3/V/C/A/Esc)
- Chat UX patterns (Enter-to-send, Shift+Enter newline, streaming, badge-to-seek, composer)
- CodeMirror editor configuration and syntax highlighting
- Terminal (xterm.js) internals
- File tree behavior and VFS system
- All business logic and state management (Zustand stores, Convex hooks)
- API integrations, auth flow (Clerk), runtime execution
- Mobile policy (workspace desktop-only >=1024px)

---

## Rollout Strategy

**Foundation-first approach** — build the design system tokens and primitives, then apply systematically across all surfaces.

### Phase 1 — Design Tokens & Primitives ✅

- CSS custom properties for all color/spacing/typography tokens
- Tailwind 4 theme configuration with `nio-*` tokens
- Theme provider component (dark/light/system)
- Font loading (Orbitron, Geist Sans, Geist Mono)
- Background grid/dot pattern CSS

### Phase 2 — Base Components ✅

- Status/role badges, KPI colors, runtime dots
- Editor skeleton shimmer, dirty/delete indicators
- HeroSection, CTASection, BootSequence — hardcoded hex → tokens
- Clerk appearance, course cards, admin charts, output panel, feedback stars

### Phase 3 — Shell & Chrome ✅

- ControlCenterDrawer, AppShell, PaneSwitcher — accent token migration
- Landing sections — `workspace-accent` → `accent`
- ChatMessage cursor fix

### Phase 4 — Core Panes ✅

- VideoPlayer, CodeEditor textarea — warm token migration
- All 28 code pane components verified clean

### Phase 5 — Pages ✅

- Editor sandbox error, CodePane SVG preview — warm palette
- All landing/course/auth/admin components verified — zero hardcoded colors

### Phase 6 — Polish ✅

- Focus states (ChatComposer, LanguageSelect)
- Transition duration normalization (no arbitrary brackets)
- Pattern, radius, shadow, typography consistency audit

### Phase 7 — Landing Page Rework ✅

- Hero rework — Claude-style clarity, removed parallax/glow effects
- NotebookFrame 3-layer binder architecture for all sections
- Capsule theme toggle (dark/light/system) replacing ForceTheme
- Text wordmark with Orbitron + terracotta accent 'i'
- Multi-column footer with social icons and legal stub pages
- Section gap normalization (consistent 128px inter-frame spacing)

---

## Reference Touchstones

| Reference                 | What to take from it                                            |
| ------------------------- | --------------------------------------------------------------- |
| **Claude.ai/code**        | Warmth, color palette, spacing rhythm, calm focus               |
| **Claude Cowork (macOS)** | Grid/dot pattern, panel transitions, premium native feel        |
| **Geist font family**     | Body/code typography — clean, modern, Vercel-native             |
| **Orbitron**              | Brand display font — geometric, futuristic identity fingerprint |

---

## Open Questions

_Track unresolved decisions here as the redesign progresses._

- [x] ~~Exact Claude terracotta hex value~~ → `#C15F3C` (light) / `#DA7756` (dark)
- [x] ~~Grid/dot pattern exact density, opacity, and rendering approach~~ → 24px linear-gradient crosshatch, 1.8-2% opacity
- [x] ~~Orbitron weight variants~~ → 400, 500, 600, 700 (already loaded)
- [x] ~~Landing page structure~~ → NotebookFrame binder + capsule ThemeToggle + multi-column footer
- [x] ~~Wordmark approach~~ → Pure text Orbitron (not SVG), terracotta accent 'i' via `text-accent` span
- [ ] Custom icon overrides — which specific icons need bespoke treatment?
- [ ] CodeMirror theme — build a matching warm theme or keep current?
- [ ] xterm.js theme — match the new palette?
- [ ] Legal pages — draft actual Terms, Privacy, and Cookie policy content

---

## Changelog

| Date       | Change                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-06 | Initial brief created from brainstorming session                                                                                                                                                         |
| 2026-02-06 | Phase 1 complete: design tokens, warm palette, grid pattern, font assignments, shimmer animation. All token values finalized. frontend-designer agent enhanced with design system expertise.             |
| 2026-02-06 | Phases 2-6 complete: full token migration across all components, pages, shell, panes. Zero hardcoded colors remaining. Focus states and transition polish done.                                          |
| 2026-02-06 | Phase 7 complete: Landing page rework — NotebookFrame binder architecture, hero simplification, capsule theme toggle, text wordmark, multi-column footer, legal stubs, gap normalization. PR #87 merged. |
