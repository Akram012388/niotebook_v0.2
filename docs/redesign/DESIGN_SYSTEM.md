# Niotebook Design System v2.0

> **Status:** Implemented (superseded v1)
> **Source of truth:** `src/app/globals.css`
> **Brief:** `docs/redesign/REDESIGN_BRIEF.md`
> **Inspired by:** Claude.ai/code + Claude Cowork macOS

---

## Core Principles

1. **Claude Warmth** — Warm color temperatures, soft depth, parchment-like quality
2. **Calm Focus** — Reduce visual noise, generous whitespace, unhurried density
3. **Premium Craft** — Every pixel intentional, every micro-interaction polished
4. **Futuristic Identity** — Orbitron typeface as the brand fingerprint

---

## Color Palette

### Light Theme (`:root`)

```css
/* Backgrounds */
--background:      #F4F3EE;   /* Pampas — base background */
--surface:         #FAF9F7;   /* Warm white — cards, panels */
--surface-muted:   #EDEAE4;   /* Soft cream — elevated surfaces */
--surface-strong:  #1C1917;   /* Charcoal — code blocks, footer */

/* Text */
--foreground:      #1C1917;   /* Near black — primary text */
--text-muted:      #78716C;   /* Warm gray — secondary text */
--text-subtle:     #A8A29E;   /* Light warm gray — placeholders */

/* Accent (Claude terracotta) */
--accent:            #C15F3C;                  /* Crail — primary actions */
--accent-foreground: #FFFFFF;                  /* Text on accent */
--accent-muted:      rgba(193, 95, 60, 0.10); /* Accent backgrounds */
--accent-border:     rgba(193, 95, 60, 0.25); /* Accent borders */
--accent-hover:      #A8512F;                  /* Darker on hover */

/* Status (warm-tinted) */
--status-success:  #5A8A5E;
--status-warning:  #B5882C;
--status-error:    #C24B3A;
--status-info:     #5B7FA5;

/* Borders */
--border:          #DDD8D0;   /* Warm beige */
--border-muted:    #EDEAE4;   /* Warm tan */
```

### Dark Theme (`[data-theme="dark"]`)

```css
/* Backgrounds */
--background:      #1C1917;   /* Rich warm charcoal */
--surface:         #252220;   /* Elevated warm dark */
--surface-muted:   #2E2A27;   /* Higher warm dark */
--surface-strong:  #141210;   /* Deepest dark */

/* Text */
--foreground:      #F4F3EE;   /* Warm white */
--text-muted:      #A8A29E;   /* Warm muted */
--text-subtle:     #78716C;   /* Dim warm gray */

/* Accent (lighter terracotta for dark contrast) */
--accent:            #DA7756;
--accent-foreground: #1C1917;
--accent-muted:      rgba(218, 119, 86, 0.15);
--accent-border:     rgba(218, 119, 86, 0.30);
--accent-hover:      #E8906E;

/* Status (brighter for dark backgrounds) */
--status-success:  #6DA072;
--status-warning:  #D4A748;
--status-error:    #E06B5A;
--status-info:     #7A9FC0;

/* Borders */
--border:          #3A3531;
--border-muted:    #2E2A27;
```

### Workspace Tokens (always-dark code surfaces)

```css
--workspace-editor:        #1C1917;
--workspace-sidebar:       #1C1917;
--workspace-terminal:      #1C1917;
--workspace-tabbar:        #252220;
--workspace-border:        #3A3531;
--workspace-border-muted:  #2E2A27;
--workspace-text:          #F4F3EE;
--workspace-text-muted:    #A8A29E;
--workspace-accent:        <theme-dependent>;  /* #C15F3C (light) / #DA7756 (dark) */
--workspace-accent-muted:  <theme-dependent>;
```

---

## Typography

### Font Stack

| Role          | Font          | CSS Variable         | Usage                                      |
|---------------|---------------|----------------------|--------------------------------------------|
| **Display**   | Orbitron      | `--font-display`     | Wordmark, page titles, section headers     |
| **Body/UI**   | Geist Sans    | `--font-body`        | Body text, labels, buttons, nav, chat      |
| **Code**      | Geist Mono    | `--font-code`        | Code editor, terminal, inline code         |

### Loading (layout.tsx)

```tsx
import { Geist, Geist_Mono, Orbitron } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["400","500","600","700"] });
```

### Tailwind Mapping

```css
--font-sans: var(--font-body);    /* Geist Sans — `font-sans` utility */
--font-mono: var(--font-code);    /* Geist Mono — `font-mono` utility */
--font-display: var(--font-orbitron);  /* Orbitron — `font-display` utility */
```

---

## Spacing Scale

4px base grid (uses standard Tailwind spacing):

| Token | Value  | Tailwind Class |
|-------|--------|----------------|
| 1     | 4px    | `p-1`          |
| 2     | 8px    | `p-2`          |
| 3     | 12px   | `p-3`          |
| 4     | 16px   | `p-4`          |
| 5     | 20px   | `p-5`          |
| 6     | 24px   | `p-6`          |
| 8     | 32px   | `p-8`          |
| 10    | 40px   | `p-10`         |
| 12    | 48px   | `p-12`         |
| 16    | 64px   | `p-16`         |

---

## Border Radius

```css
--radius-sm:   6px;    /* Inputs, badges, small cards */
--radius-md:   8px;    /* Buttons, cards, panels */
--radius-lg:   12px;   /* Modals, drawers, large cards */
--radius-xl:   16px;   /* Hero elements, feature cards */
--radius-full: 9999px; /* Pills, avatars, toggles */
```

---

## Shadows

Warm, subtle depth — warm undertones in light mode, deeper in dark mode.

### Light Mode

```css
--shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);
--shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.07);
--shadow-lg: 0 10px 15px -3px rgba(28, 25, 23, 0.08);
```

### Dark Mode

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.20);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.30);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.35);
```

---

## Transitions

```css
--duration-fast:   100ms;   /* Hover states, opacity shifts */
--duration-normal: 180ms;   /* Most transitions */
--duration-slow:   250ms;   /* Drawers, panels, modals */
--duration-spring: 300ms;   /* Playful micro-interactions */

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Background Pattern

Subtle grid overlay (Claude Cowork signature). Barely perceptible.

```css
.nio-pattern::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--pattern-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--pattern-color) 1px, transparent 1px);
  background-size: 24px 24px;
  z-index: 1;
}

/* Light mode: --pattern-opacity: 0.018 */
/* Dark mode:  --pattern-opacity: 0.02  */
```

Applied on `<body>` via `nio-pattern` class in `layout.tsx`.

---

## Focus States

Global warm accent focus ring:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

## Skeleton Loaders

### Standard (theme-aware)

```css
.nio-shimmer {
  background: linear-gradient(90deg, var(--surface-muted) 25%, var(--surface) 50%, var(--surface-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Workspace (always-dark code surfaces)

```css
.nio-shimmer-workspace {
  background: linear-gradient(90deg, var(--workspace-border-muted) 25%, var(--workspace-border) 50%, var(--workspace-border-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

---

## Theme System

- **Mechanism:** `data-theme` attribute on `<html>` element
- **Options:** `light`, `dark`, system preference (default)
- **Blocking script** in `<head>` prevents flash — reads `localStorage("niotebook.theme")` or `prefers-color-scheme`
- **Landing page:** Capsule ThemeToggle component (dark/light/system)
- **Workspace:** Always dark via `workspace-*` tokens (no theme switching)
- **Tailwind 4:** `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`

---

## Tailwind 4 Integration

No `tailwind.config.js` — uses `@theme inline` in `globals.css`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
  /* ... all tokens mapped to Tailwind utilities */

  --font-sans: var(--font-body);
  --font-mono: var(--font-code);
  --font-display: var(--font-orbitron);

  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-full: var(--radius-full);
}
```

---

## Icon System

- **Library:** Phosphor Icons (existing)
- **Style:** Outline/stroke (not filled)
- **Sizes:** 16px (sm), 20px (md), 24px (lg)
- **Stroke Width:** 1.5-2px

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Canonical token definitions + base styles |
| `src/app/layout.tsx` | Font loading, theme script, body classes |
| `src/ui/landing/ThemeToggle.tsx` | Capsule theme toggle component |
| `src/ui/landing/NotebookFrame.tsx` | 3-layer binder frame component |
| `src/ui/brand/Wordmark.tsx` | Text-based Orbitron wordmark |
| `docs/redesign/REDESIGN_BRIEF.md` | Design direction and decisions |
| `docs/redesign/PROGRESS.md` | Phase-by-phase implementation log |
