# Phase 8 — UX Specification: Route Redesign

> **Status:** Draft
> **Author:** UX Specialist (architect agent)
> **Scope:** Sign-in, Courses, Course Detail routes
> **Source of truth:** Landing page (`src/app/page.tsx` + `src/ui/landing/*`)
> **Branch:** `redesign-v2`

---

## Table of Contents

1. [Gap Analysis Per Route](#1-gap-analysis-per-route)
2. [NotebookFrame Integration](#2-notebookframe-integration)
3. [Animation Inventory](#3-animation-inventory)
4. [Sidebar UX Design](#4-sidebar-ux-design)
5. [Sign-in Page UX](#5-sign-in-page-ux)
6. [Course & Lecture Card Design](#6-course--lecture-card-design)
7. [Typography Audit](#7-typography-audit)

---

## 1. Gap Analysis Per Route

### 1.1 Sign-in Page (`src/app/sign-in/[[...sign-in]]/page.tsx`)

| Landing Pattern | Current State | Gap |
|---|---|---|
| **ThemeToggle** (capsule, 3-option) | `ForceTheme theme="dark"` — forces dark, no user control | **Critical.** Must remove `ForceTheme`, add `ThemeToggle` to page. Default to light. |
| **NotebookFrame** binder wrapper | Not used. Content sits in a plain `div` with radial gradient overlay | **Critical.** Wrap Clerk + BootSequence in a `NotebookFrame`. |
| **Wordmark** with Orbitron accent 'i' | Present (`Wordmark height={28}`) but sits outside any frame | Move inside NotebookFrame or into a nav-like strip |
| **Warm background** (`bg-background`) | Uses `bg-background` — correct token, but ForceTheme overrides to dark | Removing ForceTheme will let the actual theme token through |
| **Radial gradient overlay** | `bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_55%)]` — uses cold blue-gray `rgb(148,163,184)` | **Gap.** Landing has zero radial gradients. Remove entirely, or warm it up with `rgba(193,95,60,0.04)` accent tint |
| **Grid pattern** (`.nio-pattern`) | Not visible because ForceTheme overrides, but body already has `nio-pattern` class | Will work correctly once ForceTheme is removed |
| **Section header font-mono label** | Landing uses `text-[11px] font-mono uppercase tracking-[0.2em]` for section labels | Not present. No section label above "Sign in" heading |
| **Framer Motion entrance animations** | None. Page content appears instantly | **Gap.** Landing hero has fade+slide-up stagger. Sign-in should mirror this. |
| **CTA button styling** | Clerk renders its own button (`formButtonPrimary` in `clerkAppearance.ts`) | Button uses `bg-foreground text-background` — landing uses `bg-accent text-accent-foreground`. Consider aligning Clerk primary button to accent. |
| **Hover glow on interactive elements** | None | Landing CTA has `hover:shadow-[0_0_30px_var(--accent-muted)]` |
| **Footer** | None | Not needed for sign-in (single-purpose page) |
| **Skip-to-content link** | Not present | Landing has one. Add for a11y compliance. |

### 1.2 Courses Page (`src/app/courses/page.tsx` → `CoursesPage.tsx`)

| Landing Pattern | Current State | Gap |
|---|---|---|
| **ThemeToggle** | `ForceTheme theme="dark"` in route — dark locked | **Critical.** Remove ForceTheme, add ThemeToggle (in new sidebar or header). |
| **NotebookFrame** | Not used anywhere on courses | **Critical.** Wrap main content area in NotebookFrame. |
| **Navigation** | Minimal header bar in `CoursesLayout.tsx` — Wordmark + Sign-out button. No sidebar. | **Critical.** Replace with new collapsible rail sidebar (see §4). |
| **Section labels** (`font-mono uppercase tracking-[0.2em]`) | Uses accent bar + bold text for section headings. No mono label treatment. | **Gap.** Add mono labels above major sections ("Harvard University", "Continue Learning"). |
| **Cards** — hover border-accent/30 + shadow-md | `CourseCard` has hover: `hover:scale-[1.02] hover:shadow-xl` + `dark:hover:border-accent/40` | Partially aligned. But the `dark:` prefix hover states will break when ForceTheme is removed — need theme-agnostic hover: `hover:border-accent/30 hover:shadow-md`. |
| **Search input** | Present. Uses `focus:border-accent/40 focus:ring-accent/20` — good. | Border radius uses `rounded-xl` (16px?). Landing buttons use `rounded-xl` too. Consistent. |
| **Stagger animations** | Uses `sectionVariants` with `staggerChildren: 0.06` and `cardVariants` with per-card delay | Close to landing pattern (`delay: index * 0.1` in FeaturesSection). Acceptable. |
| **Progress indicators** | `CourseCard` has progress bar (h-1.5 bg-accent). | Good. Keep and ensure it works in both themes. |
| **Grid pattern** | Body already has `nio-pattern` | Will show correctly once ForceTheme is removed. |
| **Generous whitespace** | `gap-14` between sections, `px-6 py-12` page padding | Good — aligns with landing's generous spacing. |
| **Skip-to-content link** | Not present | Add for a11y. |
| **Footer** | None | Consider a lightweight footer or omit for authenticated routes. |

### 1.3 Course Detail Page (`src/app/courses/[courseId]/page.tsx` → `CourseDetailPage.tsx`)

| Landing Pattern | Current State | Gap |
|---|---|---|
| **ThemeToggle** | `ForceTheme theme="dark"` | **Critical.** Same fix as courses. |
| **NotebookFrame** | Not used | **Critical.** Wrap content in NotebookFrame. |
| **Navigation** | Inherits from `CoursesLayout` — same minimal header | **Critical.** Will use new sidebar. |
| **Lecture list** | Row-based list with `rounded-xl border` per item. Looks like a table of stacked rows. | **Decision:** Switch to card-based presentation inside a grid (per interview). See §6. |
| **Back link** | `← Back to courses` with SVG arrow. Plain text link. | Consider framing as breadcrumb or integrate into sidebar navigation. |
| **Progress bar** | Standalone `rounded-2xl border bg-surface` panel with accent progress bar | Good component. Wrap in NotebookFrame or keep as standalone card. |
| **Resume CTA** | `bg-accent px-5 py-2.5 rounded-xl` — matches landing CTA style | Good. Add hover glow: `hover:shadow-[0_0_20px_var(--accent-muted)]` (already present). |
| **Mark Complete button** | `border border-border hover:border-accent/30` — ghost button | Aligned with design system. |
| **Section header** | Uses accent bar + bold text ("Lectures") | Add mono label treatment per landing pattern. |
| **Animations** | Per-row `initial/animate` with stagger `delay: 0.05 * Math.min(i, 10)` | Good but needs adjustment if switching to cards. |
| **Empty/loading state** | Single `animate-pulse rounded-2xl bg-surface-muted` skeleton | Minimal. Consider adding nio-shimmer class for warm shimmer. |

---

## 2. NotebookFrame Integration

### 2.1 Component Interface (Existing)

```tsx
// src/ui/landing/NotebookFrame.tsx
<NotebookFrame className="">
  {children}
</NotebookFrame>
```

**Current behavior:** 3-layer binder (rails → mask → content). `bg-surface` fill, `border-border` border, `rounded-2xl`, `shadow-sm`. Internal padding: `px-8 sm:px-12 md:px-16 py-10 sm:py-14`.

### 2.2 Relocation

`NotebookFrame` currently lives in `src/ui/landing/`. Since it will be used across sign-in, courses, and course detail, **move it to `src/ui/brand/NotebookFrame.tsx`** (alongside `Wordmark.tsx`). Update all imports.

### 2.3 Sign-in Page

```
┌──────────────────────────────────────────────┐
│  LandingNav-style strip (Wordmark + Toggle)  │
├──────────────────────────────────────────────┤
│  NotebookFrame                               │
│  ┌────────────────┬─────────────────────┐    │
│  │  Clerk SignIn   │  BootSequence       │    │
│  │  (light bg)     │  (dark inset panel) │    │
│  └────────────────┴─────────────────────┘    │
│  ──────────────────────────────────────────   │
│  "Niotebook alpha is invite-only..."         │
└──────────────────────────────────────────────┘
```

- One `NotebookFrame` wrapping the entire two-column layout
- Left column: Clerk `<SignIn>` with updated `clerkAppearance` (accent primary button)
- Right column: `BootSequence` rendered in a `bg-surface-strong rounded-2xl` inset panel (always dark)
- Below: subtitle text

### 2.4 Courses Page

```
┌─────────┬────────────────────────────────────────┐
│ Sidebar  │  NotebookFrame                         │
│ (rail)   │  ┌──────────────────────────────────┐  │
│          │  │ Page header + search              │  │
│ [icons]  │  │ Continue Learning (cards)         │  │
│          │  │ Harvard University (card grid)    │  │
│          │  │ MIT OpenCourseWare (card grid)    │  │
│          │  │ ...                               │  │
│          │  └──────────────────────────────────┘  │
└─────────┴────────────────────────────────────────┘
```

- Sidebar sits outside the frame
- One `NotebookFrame` wraps the entire scrollable content area
- All section groups (Harvard, MIT, etc.) live **inside** the single frame
- The frame provides the binder aesthetic; individual section headings remain as-is

### 2.5 Course Detail Page

```
┌─────────┬────────────────────────────────────────┐
│ Sidebar  │  NotebookFrame                         │
│ (rail)   │  ┌──────────────────────────────────┐  │
│          │  │ Breadcrumb / course title         │  │
│ [icons]  │  │ Progress bar card                 │  │
│          │  │ Lectures heading                  │  │
│          │  │ Lecture card grid (2-col)         │  │
│          │  └──────────────────────────────────┘  │
└─────────┴────────────────────────────────────────┘
```

- Same layout as courses: sidebar + single NotebookFrame
- Lecture list transitions from rows to a card grid

---

## 3. Animation Inventory

### 3.1 Landing Page Animations (Source of Truth)

| Element | Type | Initial | Animate | Transition |
|---|---|---|---|---|
| **Hero badge** | `motion.div` | `opacity:0, y:-10` | `opacity:1, y:0` | `duration:0.5` |
| **Hero words** (3x stagger) | `motion.span` | `opacity:0, y:20` | `opacity:1, y:0` | `duration:0.6, delay:0.1/0.3/0.5` |
| **Hero tagline** | `motion.p` | `opacity:0, y:16` | `opacity:1, y:0` | `duration:0.6, delay:0.7` |
| **Hero CTA** | `motion.div` | `opacity:0, y:16` | `opacity:1, y:0` | `duration:0.6, delay:0.9` |
| **Hero video** | `motion.div` | `opacity:0, y:24` | `opacity:1, y:0` | `duration:0.8, delay:1.1` |
| **Section header** (in-frame) | `motion.div` whileInView | `opacity:0, y:16` | `opacity:1, y:0` | `duration:0.5` |
| **Value props** (stagger) | `motion.div` whileInView | `opacity:0, y:24` | `opacity:1, y:0` | `duration:0.5, delay: i*0.1` |
| **Feature cards** (stagger) | `motion.div` whileInView | `opacity:0, y:24` | `opacity:1, y:0` | `duration:0.5, delay: i*0.1` |
| **CTA section** | `motion.div` whileInView | `opacity:0, y:20` | `opacity:1, y:0` | `duration:0.7` |

**Key patterns:**
- All use `opacity:0 → 1` + `y:N → 0` (slide up + fade in)
- Stagger delay: `i * 0.1` per card/item
- Durations: 0.5–0.8s range
- `viewport: { once: true, amount: 0.2 }` for in-view triggers

### 3.2 Current Route Animations vs Landing

| Route Element | Current Animation | Landing Equivalent | Adjustment Needed |
|---|---|---|---|
| **CoursesPage header** | `y:-12, duration:0.4` | Hero-style `y:16, duration:0.6` | Change to `y:16` (positive→slide up), increase to `duration:0.5` |
| **Continue Learning section** | `opacity:0→1, delay:0.15, duration:0.4` | Section header pattern | Good. Add `y:16` for slide-up. |
| **Course card stagger** | `staggerChildren:0.06`, per-card `delay: i*0.06, duration:0.35` | `delay: i*0.1, duration:0.5` | Increase to `i*0.1` and `duration:0.5` |
| **CourseDetailPage header** | `y:-12, duration:0.4` | Same fix as courses header | Align to `y:16, duration:0.5` |
| **Progress panel** | `opacity:0, delay:0.15, duration:0.4` | Section content pattern | Add `y:16` for consistency |
| **Lecture rows** | `y:12, delay:0.05*min(i,10), duration:0.3` | Card stagger `delay:i*0.1, duration:0.5` | Increase when converting to cards |
| **Sign-in page** | **No animations at all** | Full hero-level stagger | **Add complete entrance sequence** |

### 3.3 Prescribed Animation Values Per Route

#### Sign-in Page
```
Wordmark/heading:     initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} duration:0.5
Subtitle:             initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} duration:0.5, delay:0.1
Clerk card (left):    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} duration:0.6, delay:0.2
BootSequence (right): initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} duration:0.6, delay:0.3
```

#### Courses Page
```
Page header:          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} duration:0.5
Search input:         (part of header motion — no separate animation)
Section label:        initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} duration:0.5
Card stagger:         staggerChildren:0.1, per-card delay: i*0.1, duration:0.5
                      viewport={{ once:true, amount:0.2 }}
```

#### Course Detail Page
```
Breadcrumb/title:     initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} duration:0.5
Progress panel:       initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} duration:0.5, delay:0.1
Lecture heading:      initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} duration:0.5
Lecture cards:        staggerChildren:0.1, per-card delay: i*0.1, duration:0.5
                      viewport={{ once:true, amount:0.2 }}
```

---

## 4. Sidebar UX Design

### 4.1 Overview

A new collapsible rail sidebar replaces the current `CoursesLayout` header bar for all authenticated non-workspace routes (courses, course detail). The workspace route keeps its own `AppShell`.

### 4.2 States

| State | Width | Content |
|---|---|---|
| **Collapsed (rail)** | 56px | Icon buttons only (vertically stacked) |
| **Expanded** | 240px | Icons + labels, section grouping |

### 4.3 Icon Rail Items

| Icon | Label | Href | Notes |
|---|---|---|---|
| Wordmark 'n' | — | `/` | Top-most. Always visible. In collapsed: just the 'n' letter. In expanded: full Wordmark. |
| Grid / Dashboard | Courses | `/courses` | Active when on `/courses` |
| Gear / Settings | Settings | `#` (future) | Placeholder for future settings |
| **Spacer** | — | — | Push remaining items to bottom |
| ThemeToggle | Theme | — | Capsule toggle (same as landing). In collapsed rail: show only current-mode icon, click cycles. In expanded: full capsule. |
| Sign-out | Sign out | action | `signOut()` from Clerk |

### 4.4 Behavior

- **Toggle mechanism:** Click a hamburger/chevron icon at top of rail to expand/collapse. Or click-away to collapse.
- **Persistence:** Collapsed/expanded state stored in `localStorage("niotebook.sidebar")`.
- **Breakpoints:**
  - `≥1024px` (lg): Default expanded, user can collapse
  - `768–1023px` (md): Default collapsed (rail), user can expand (overlays content)
  - `<768px` (sm): No sidebar at all — use a top nav bar with hamburger menu (mobile)
- **Animation:** Expand/collapse uses `width` transition with `duration: 250ms` and `ease-default` easing. Content area responds with matching margin transition.
- **Active indicator:** Active nav item gets a 3px accent-colored left border + `bg-accent-muted` background.

### 4.5 Sidebar Component Structure

```
src/ui/shell/Sidebar.tsx          — Main sidebar component
src/ui/shell/SidebarItem.tsx      — Individual nav item
src/ui/shell/SidebarLayout.tsx    — Layout wrapper (sidebar + main content area)
src/ui/shell/useSidebarState.ts   — Hook: localStorage persistence + breakpoint detection
```

### 4.6 Sidebar Visual Spec

```
┌──────────────────────┐
│  ╔══╗                │  ← Wordmark area (h=56px)
│  ║n ║ iotebook       │     Collapsed: just 'n' in Orbitron
│  ╚══╝                │     Expanded: full Wordmark
├──────────────────────┤
│  ┃█┃ Courses         │  ← Active (accent left border)
│  ┃ ┃ Settings        │
│                      │
│                      │
│  ┃ ┃ ☀ Theme toggle  │  ← Bottom-anchored
│  ┃ ┃ → Sign out      │
└──────────────────────┘
```

- **Background:** `bg-surface` with `border-r border-border`
- **Item height:** 44px
- **Icon size:** 20px
- **Label font:** `font-sans text-sm` (Geist Sans)
- **Active item:** `bg-accent-muted border-l-3 border-l-accent text-foreground`
- **Inactive item:** `text-text-muted hover:bg-surface-muted hover:text-foreground`
- **Transition on hover:** `duration-fast` (100ms)

---

## 5. Sign-in Page UX

### 5.1 Current Architecture

- **File:** `src/app/sign-in/[[...sign-in]]/page.tsx`
- **Layout:** Single full-width container, left-aligned content (Wordmark → heading → subtitle → two-column: Clerk + BootSequence)
- **Theme:** Force-dark via `ForceTheme`
- **Background:** Cold blue-gray radial gradient
- **Animations:** None

### 5.2 Target Architecture

```
╔══════════════════════════════════════════════════════════╗
║  (Minimal top bar: Wordmark left, ThemeToggle right)    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║     NotebookFrame (centered, max-w-4xl)                  ║
║     ┌───┬─────────────────────────────────────────┐      ║
║     │ ▌ │                                         │      ║
║     │ ▌ │  ┌──────────────┐  ┌────────────────┐   │      ║
║     │ ▌ │  │              │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │      ║
║     │ ▌ │  │  Clerk       │  │ ▓ Boot         ▓ │   │      ║
║     │ ▌ │  │  SignIn       │  │ ▓ Sequence     ▓ │   │      ║
║     │ ▌ │  │  Component   │  │ ▓ (dark inset) ▓ │   │      ║
║     │ ▌ │  │              │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │      ║
║     │ ▌ │  └──────────────┘  └────────────────┘   │      ║
║     │ ▌ │                                         │      ║
║     │ ▌ │  Invite-only alpha. Use your invite...  │      ║
║     │ ▌ │                                         │      ║
║     └───┴─────────────────────────────────────────┘      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### 5.3 Key Changes

1. **Remove `ForceTheme theme="dark"`** — page defaults to light (or user's theme preference)
2. **Remove cold radial gradient** — the `bg-[radial-gradient(...rgba(148,163,184,...))]` overlay. Replace with clean `bg-background` (warm Pampas in light, warm charcoal in dark)
3. **Add top bar** — reuse LandingNav pattern: fixed, backdrop-blur, Wordmark left, ThemeToggle right. No "Sign in" button (we're already on sign-in). Could add a "← Back to home" link.
4. **Wrap content in NotebookFrame** — centered `max-w-4xl`, giving the page the binder feel
5. **Two-column layout inside frame** — `flex gap-8 items-start`, Clerk left, BootSequence right
6. **BootSequence as dark inset** — Wrap in `bg-surface-strong rounded-2xl p-6` (always dark regardless of theme). BootSequence already uses `bg-surface-strong` — good, no change needed to the component itself.
7. **Update `clerkAppearance.ts`** — change `formButtonPrimary` from `bg-foreground text-background` to `bg-accent text-accent-foreground hover:bg-accent-hover` to match the landing CTA pattern
8. **Add entrance animations** — Framer Motion fade+slide-up stagger (see §3.3)
9. **Add heading above Clerk** — `text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60` label: "Sign in to your account" or similar
10. **Responsive:** Below `md`, hide BootSequence (as it currently does with `hidden md:block`). Single column with just the Clerk SignIn.

### 5.4 Clerk Appearance Updates

Current `clerkAppearance.ts` uses `colorPrimary: "var(--foreground)"` which makes buttons match the foreground color (dark on light, light on dark). This clashes with the landing page's accent-primary CTA pattern.

**Change to:**
```ts
variables: {
  colorPrimary: "var(--accent)",        // was --foreground
  colorText: "var(--foreground)",
  colorTextSecondary: "var(--text-muted)",
  colorBackground: "var(--surface)",
  borderRadius: "var(--radius-lg)",
  fontFamily: "var(--font-geist-sans)",
},
elements: {
  formButtonPrimary:
    "rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover",
  // ... rest unchanged
}
```

### 5.5 BootSequence Panel

The `BootSequence` component (`src/ui/auth/BootSequence.tsx`) already uses `bg-surface-strong` and `text-accent` — these are the right tokens. Its `border-border` will resolve to the warm beige in light mode, which should contrast well against the `surface-strong` dark background.

**No changes needed to `BootSequence` internals.** It correctly renders as a dark inset on any background.

---

## 6. Course & Lecture Card Design

### 6.1 Course Cards (Existing — Keep & Refine)

The existing `CourseCard` component is already well-structured with card-based presentation, hover effects, and progress indicators.

**Refinements needed:**

1. **Remove `dark:` prefix hover states** — Currently `dark:hover:border-accent/40 dark:hover:shadow-accent/5`. Since we're removing ForceTheme dark, these dark-only hover states need to work in both themes:
   ```
   Before: dark:hover:border-accent/40 dark:hover:shadow-accent/5 hover:border-foreground/20 hover:shadow-foreground/5
   After:  hover:border-accent/30 hover:shadow-md
   ```
   This matches the landing `FeatureCard` pattern exactly.

2. **Remove internal gradient glow** — The `bg-gradient-to-br from-accent/0 to-accent/0 dark:group-hover:from-accent/[0.03]` effect is dark-mode-only. Either make it theme-agnostic or remove it for simplicity (landing cards don't have this).

3. **Add landing-style section labels** — Before each provider group:
   ```html
   <p class="text-[11px] font-mono uppercase tracking-[0.2em] mb-4 text-accent/60">
     Harvard CS50 Series
   </p>
   ```

### 6.2 Lecture Cards (New — Replace Rows)

**Current:** Row-based list items with `rounded-xl border` — looks like a stacked table.

**Target:** Card-based grid presentation matching the `FeatureCard` and `CourseCard` patterns.

#### Layout
```
Grid: grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5
```

#### Card Structure
```
┌──────────────────────────────┐
│  ┌──┐                       │
│  │01│  Lecture Title         │
│  └──┘  12:34 duration       │
│                              │
│  ┌─────────────────────┐    │
│  │ ▓▓▓▓▓▓▓░░░░░░░░░░░ │    │  ← Progress bar (if partially watched)
│  └─────────────────────┘    │
│                              │
│  ✓ Completed    [Review →]  │  ← or [Start →] if not completed
│                  [Mark ✓]   │
└──────────────────────────────┘
```

#### Card Spec

| Property | Value |
|---|---|
| **Container** | `rounded-2xl border border-border bg-surface p-5` |
| **Hover** | `hover:border-accent/30 hover:shadow-md transition-all duration-200` |
| **Lecture number** | `w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-mono text-text-muted` |
| **Title** | `text-sm font-semibold text-foreground` |
| **Duration** | `text-xs text-text-muted` |
| **Completed state** | Left border accent: `border-l-3 border-l-accent`, subtle bg: `bg-accent/[0.03]` |
| **Completed icon** | Accent checkmark (existing SVG) |
| **Progress bar** | `h-1.5 rounded-full bg-surface-muted` with `bg-accent` fill (if watch progress is available) |
| **Actions** | "Start" / "Review" pill button: `rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent` |
| **Mark Complete** | Ghost button: `rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-accent/30` |

#### Stagger Animation
```
Parent: variants={{ hidden: { opacity:0 }, visible: { opacity:1, transition: { staggerChildren:0.1 } } }}
Child:  variants={{ hidden: { opacity:0, y:24 }, visible: (i) => ({ opacity:1, y:0, transition: { delay: i*0.1, duration:0.5 } }) }}
viewport={{ once:true, amount:0.2 }}
```

### 6.3 Resume Cards (Existing — Refine)

The `ResumeCard` component has the same `dark:` prefix issue as `CourseCard`. Same fix:
- Remove `dark:hover:border-accent/40 dark:hover:shadow-accent/5`
- Replace with `hover:border-accent/30 hover:shadow-md`
- Remove the gradient glow div

### 6.4 Coming Soon Cards (Existing — Minor Tweaks)

Already has `opacity-60` and `hover:opacity-80 hover:scale-[1.02] hover:shadow-lg`. This is fine — the muted appearance clearly communicates "not yet available." No major changes needed.

---

## 7. Typography Audit

### 7.1 Font Usage Rules (from Design System)

| Font | Role | Tailwind Class |
|---|---|---|
| **Orbitron** | Display/brand: wordmark, page titles, section headers | `font-display` |
| **Geist Sans** | Body/UI: everything else | `font-sans` (default) |
| **Geist Mono** | Code surfaces, labels, timestamps | `font-mono` |

### 7.2 Current Usage vs Intended

#### Sign-in Page
| Element | Current Font | Should Be | Fix |
|---|---|---|---|
| Wordmark | Orbitron (`font-display`) | Orbitron | ✅ Correct |
| "Sign in" heading | Default sans (Geist Sans) — `text-3xl font-semibold` | **Orbitron** (it's a page title) | Add `font-display` |
| Subtitle text | Default sans | Geist Sans | ✅ Correct |
| Clerk header title | Orbitron via `font-[family-name:var(--font-orbitron)]` | Orbitron | ✅ Correct |
| Clerk form labels | Geist Sans | Geist Sans | ✅ Correct |
| BootSequence | `font-mono` | Geist Mono | ✅ Correct |

#### Courses Page
| Element | Current Font | Should Be | Fix |
|---|---|---|---|
| Wordmark (in layout header) | Orbitron | Orbitron | ✅ Correct |
| "Course Catalog" heading | Default sans — `text-3xl font-bold` | **Orbitron** (page title) | Add `font-display` |
| Section headings ("Harvard University") | Default sans — `text-lg font-semibold` | **Orbitron** (section headers) | Add `font-display` |
| Course card titles | Default sans — `text-base font-semibold` | Geist Sans (card body content) | ✅ Correct |
| Course card descriptions | Default sans — `text-sm` | Geist Sans | ✅ Correct |
| Badge text (license, provider) | Default sans — `text-xs` | Geist Sans | ✅ Correct |
| Search input | Default sans | Geist Sans | ✅ Correct |
| "Continue Learning" heading | Default sans | **Orbitron** (section header) | Add `font-display` |

#### Course Detail Page
| Element | Current Font | Should Be | Fix |
|---|---|---|---|
| Course title | Default sans — `text-2xl font-bold` | **Orbitron** (page title) | Add `font-display` |
| "Lectures" heading | Default sans — `text-base font-semibold` | **Orbitron** (section header) | Add `font-display` |
| Lecture titles | Default sans — `text-sm font-medium` | Geist Sans | ✅ Correct |
| Duration timestamps | Default sans — `text-xs` | **Geist Mono** (timestamps) | Add `font-mono` |
| Progress text | Default sans | Geist Sans | ✅ Correct |
| Back link | Default sans — `text-xs` | Geist Sans | ✅ Correct |

### 7.3 Landing Page Typography Reference

| Element | Classes | Font |
|---|---|---|
| Hero headline | `text-5xl–9xl font-bold` (no font-display) | Default sans (Geist Sans) — **Note:** the hero uses sans, not Orbitron |
| Section labels | `text-[11px] font-mono uppercase tracking-[0.2em]` | Geist Mono |
| Section headings | `text-3xl–5xl font-bold` (no font-display) | Default sans (Geist Sans) |
| Value prop titles | `text-lg–xl font-semibold` | Default sans |
| Feature card titles | `text-base–lg font-semibold` | Default sans |
| Footer headings | `text-xs font-mono uppercase tracking-[0.2em]` | Geist Mono |

**Critical finding:** The landing page does NOT use `font-display` (Orbitron) for its headings! Only the `Wordmark` component uses Orbitron. All section headings in the landing use the default `font-sans` (Geist Sans).

**Implication:** Page titles and section headers on the routes should probably also use **Geist Sans** (not Orbitron) to match the landing page. Orbitron is reserved exclusively for the Wordmark brand element.

**Revised recommendation:** Do NOT add `font-display` to route headings. Keep them as `font-sans` (Geist Sans) to match the landing. The only Orbitron usage should be the `Wordmark` component. This keeps the typography system clean and consistent.

### 7.4 Mono Label Pattern

The landing uses a distinctive mono-label pattern for section identifiers:
```
text-[11px] font-mono uppercase tracking-[0.2em] text-accent/60
```

This appears in:
- `FeaturesSection.tsx:167` — "How it works"
- `ValuePropSection.tsx:44` — "What makes Niotebook different"
- `ValuePropSection.tsx:84` — "Built on world-class open courseware"
- `LandingFooter.tsx:164` — Column headings

**Add to routes:**
- Courses: Above "Continue Learning", "Harvard University", each provider group
- Course Detail: Above "Lectures" section
- Sign-in: Above the Clerk form — "Welcome back" or "Sign in"

---

## Appendix A: Files to Create or Modify

### New Files
| File | Purpose |
|---|---|
| `src/ui/shell/Sidebar.tsx` | Collapsible rail sidebar component |
| `src/ui/shell/SidebarItem.tsx` | Individual sidebar nav item |
| `src/ui/shell/SidebarLayout.tsx` | Layout wrapper (sidebar + content) |
| `src/ui/shell/useSidebarState.ts` | localStorage persistence + breakpoint hook |

### Files to Modify
| File | Changes |
|---|---|
| `src/ui/landing/NotebookFrame.tsx` | Move to `src/ui/brand/NotebookFrame.tsx` |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Remove ForceTheme, add NotebookFrame + ThemeToggle, add animations |
| `src/ui/auth/clerkAppearance.ts` | Change `colorPrimary` to accent, update `formButtonPrimary` |
| `src/ui/auth/AuthShell.tsx` | Remove cold gradient, add NotebookFrame wrapping |
| `src/app/courses/page.tsx` | Remove ForceTheme |
| `src/app/courses/layout.tsx` | Replace header with SidebarLayout |
| `src/app/courses/[courseId]/page.tsx` | Remove ForceTheme |
| `src/ui/courses/CoursesPage.tsx` | Wrap in NotebookFrame, add mono labels, fix animation timings, add `font-display` only to Wordmark areas |
| `src/ui/courses/CourseCard.tsx` | Remove `dark:` prefix hover states, simplify hover pattern |
| `src/ui/courses/CourseDetailPage.tsx` | Wrap in NotebookFrame, convert lectures to cards, fix animations, add mono labels |
| `src/ui/courses/ResumeCard.tsx` | Remove `dark:` prefix hover states |

### Files to Delete
| File | Reason |
|---|---|
| `src/ui/ForceTheme.tsx` | No longer used once all routes default to theme-toggle. **Caveat:** check if workspace uses it. If so, keep but remove from these 3 routes only. |

---

## Appendix B: Accessibility Checklist

- [ ] Skip-to-content link on all routes
- [ ] Sidebar: `role="navigation"` + `aria-label="Main navigation"`
- [ ] Sidebar toggle: `aria-expanded` + `aria-controls`
- [ ] ThemeToggle: `role="radiogroup"` + `aria-label` (already implemented)
- [ ] Lecture cards: proper heading hierarchy (h1 → h2 → h3)
- [ ] All motion respects `prefers-reduced-motion` (already handled in globals.css)
- [ ] Focus management: keyboard navigation through sidebar items
- [ ] Color contrast: verify accent text on surface backgrounds meets WCAG AA
