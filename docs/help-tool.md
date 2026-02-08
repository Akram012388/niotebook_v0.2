# Help Tool — Implementation Spec (v2)

## Overview

A workspace help overlay that surfaces all navigation controls and keybindings in a searchable, Raycast-style vertical list. Selecting an entry activates a spotlight that blurs the workspace and highlights the target control with a terracotta glow. Triggered by the `?` icon in TopNav and `Cmd+/`.

**Design reference**: Raycast — keyboard-first, minimal chrome, dense, fast.

---

## 1. Trigger

### Icon Button

- **Location**: TopNav right-side icon group, immediately after the NiotepadPill
- **Icon**: `?` character in a `rounded-full` button (16×16 flex container, `text-sm font-semibold`)
- **Button styling**: Same as existing TopNav icon buttons — `rounded-full border border-border bg-surface-muted p-2 text-text-muted` with `hover:bg-surface hover:text-foreground`
- **Active state** (when help is open): `border-accent bg-accent text-white` — mirrors NiotepadPill active style
- **Accessibility**: `aria-label="Open help"` / `"Close help"`, `aria-pressed={isOpen}`
- **Tooltip**: `"Help (Cmd+/)"` via title attribute

### Keyboard Shortcut

- **Binding**: `Cmd+/` (macOS) / `Ctrl+/` (Windows/Linux)
- **Behavior**: Toggle — opens if closed, closes if open
- **Scope**: Global (same pattern as niotepad's `Cmd+J` in a provider)
- **Prevent default**: Yes (`e.preventDefault()`)

---

## 2. Panel Presentation

### Modal Overlay

- **Type**: Centered modal with warm-tinted backdrop
- **Width**: `480px` (narrower than v1 — list rows don't need card width)
- **Height**: Auto, fitting content — `max-height: calc(100vh - 96px)`
- **Responsive**: On viewports < 540px wide, use `calc(100vw - 32px)` width
- **Border radius**: `16px`
- **Z-index**: Above niotepad (niotepad is a floating panel; help is a modal with backdrop)

### Backdrop

- **Style**: Warm-tinted semi-transparent overlay
- **Color (light)**: `rgba(120, 90, 60, 0.12)` — warm brown at low opacity
- **Color (dark)**: `rgba(20, 16, 12, 0.40)` — warm charcoal
- **Click to dismiss**: Yes
- **Blur**: None in default state (keep workspace visible through warm tint)

### Warm Tone Styling

Reuse the niotepad CSS custom property family for consistency:

```
--help-panel-bg:      var(--niotepad-panel-bg)       /* #f7f0e4 light / #272119 dark */
--help-header-bg:     var(--niotepad-header-bg)       /* #f2eadb light / #2e271f dark */
--help-text-muted:    var(--niotepad-text-muted)       /* #8c7e6e light / #a89888 dark */
--help-text-subtle:   var(--niotepad-text-subtle)      /* #b3a594 light / #786a5c dark */
--help-border:        var(--niotepad-panel-border)
--help-accent-bar:    var(--accent)                    /* terracotta — left bar on hover */
```

### Shadow

Same 5-layer warm shadow as niotepad panel:

```css
box-shadow:
  0 0 0 1px color-mix(in srgb, var(--help-border) 60%, transparent),
  0 1px 2px 0 rgba(120, 90, 60, 0.08),
  0 4px 8px -2px rgba(120, 90, 60, 0.10),
  0 12px 24px -4px rgba(100, 75, 50, 0.12),
  0 32px 64px -8px rgba(80, 60, 40, 0.14);
```

### Animation (Framer Motion)

- **Enter**: `scale: 0.95 → 1`, `opacity: 0 → 1` — spring `{ stiffness: 400, damping: 28, mass: 0.8 }`
- **Exit**: `scale: 0.97`, `opacity: → 0` — tween `{ duration: 0.15 }`
- **Backdrop**: Fade in/out `{ duration: 0.2 }`
- **Reduced motion**: Instant (no animation) via `prefers-reduced-motion` check

---

## 3. Panel Layout

```
┌────────────────────────────────────────────┐
│  Header: "Help" title           [×] close  │
├────────────────────────────────────────────┤
│  [ 🔍 Search tools and shortcuts...     ]  │
├────────────────────────────────────────────┤
│                                            │
│  ▎ AI Chat (Nio)     Ask Nio about…   ⌘K  │
│    Code Editor       Write and run…   ⌘S  │
│    Terminal          View output…     ⌘`  │
│    Video Player      Watch lesson…  Space  │
│    Niotepad          Capture notes…   ⌘J  │
│    Layout Presets    Switch layout  ⌘1-3  │
│    File Tree         Browse files…        │
│    Control Center    Navigate…            │
│    Help              You are here     ⌘/  │
│                                            │
└────────────────────────────────────────────┘
  ▎ = terracotta left accent bar (hover/focus)
```

### Header

- **Title**: "Help" — `text-sm font-semibold` in `--help-text-muted` color
- **Close button**: `X` icon (Phosphor), same warm muted styling
- **Background**: `var(--help-header-bg)`
- **Border bottom**: `1px solid var(--help-border)`
- **Padding**: `12px 16px`

### Search Bar

- **Placement**: Sticky below header
- **Placeholder**: `"Search tools and shortcuts..."`
- **Styling**: Warm-toned input — `bg-transparent` border-bottom only, matching niotepad search aesthetic
- **Behavior**: Real-time filtering — fuzzy match on entry name, description, and shortcut text
- **Autofocus**: Yes, on panel open
- **Clear**: `Esc` clears search text (if search has content); second `Esc` closes panel
- **Enter**: When a single result remains (or one is focused), triggers spotlight for that entry

### Row List

- **Layout**: Vertical stack (`flex flex-col`), no grid
- **Padding**: `8px 0` (list area), individual rows have `px-16`
- **Scroll**: Vertical overflow with warm-toned scrollbar (reuse `--niotepad-scrollbar`)
- **Empty state**: When search yields no results — "No matching tools" in muted text, centered

---

## 4. Row Design

Each row represents one navigation control in the workspace. No icons — purely text-driven.

### Structure

```
┌────────────────────────────────────────────────┐
│ ▎ Tool Name    Short description       ⌘K     │
└────────────────────────────────────────────────┘
  ↑              ↑                        ↑
  accent bar     thin one-liner           shortcut pill(s)
  (hover only)   (text-muted)             (right-aligned)
```

### Row Anatomy

- **Left accent bar**: 3px wide × full row height, `var(--accent)` (terracotta). Hidden by default, appears on hover/focus. Positioned absolute on the left edge.
- **Title**: `text-sm font-medium` in foreground color. Left-aligned.
- **Description**: `text-xs` in `--help-text-muted`. Truncated to single line (`truncate`). Separated from title by flexible gap.
- **Shortcut pills**: Right-aligned. One or more `font-mono text-[11px]` badges.

### Row Styling

- **Height**: `44px` (fixed, `items-center`)
- **Padding**: `0 16px`
- **Background**: Transparent by default
- **Hover**: Left accent bar fades in (150ms ease). No background change — the bar is the only hover signal.
- **Focus-visible**: Same left accent bar + `ring-2 ring-accent/30 ring-inset`
- **Cursor**: `pointer`
- **Transition**: `all 150ms ease`
- **Border**: None. Rows are separated by whitespace alone (44px height provides natural rhythm).

### Shortcut Badge

- **Background**: `color-mix(in srgb, var(--help-border) 30%, transparent)`
- **Border radius**: `6px`
- **Padding**: `2px 8px`
- **Font**: `text-[11px] font-mono tracking-wide`
- **Color**: `var(--help-text-muted)`
- **Multiple shortcuts**: Inline with `gap: 6px` (horizontal, not stacked)

---

## 5. Help Entries — Data Model

```typescript
interface HelpEntry {
  id: string;
  name: string;
  description: string;
  shortcuts?: Shortcut[];
  /** CSS selector to locate the navigation control for spotlight */
  targetSelector?: string;
  category: 'editor' | 'terminal' | 'video' | 'chat' | 'niotepad' | 'layout' | 'filetree' | 'control';
}

interface Shortcut {
  /** Display label, e.g., "⌘K" */
  label: string;
  /** Description of what the shortcut does (if tool has multiple) */
  action?: string;
}
```

> **Removed from v1**: `icon` field. Rows are text-only — no Phosphor icons.

### Entries

All entries map to **navigation controls** (icons, buttons, pills in TopNav/toolbar) — not content panes. The spotlight highlights the clickable control that provides access to the tool, not the tool's content area.

| Entry | Shortcuts | Target Selector | Description |
|-------|-----------|-----------------|-------------|
| AI Chat (Nio) | `⌘K` | `[data-help-target="chat"]` | Ask Nio about the lesson, code, or transcript |
| Code Editor | `⌘S` (run) | `[data-help-target="editor"]` | Write and execute code in multiple languages |
| Terminal | `` ⌘` `` (focus) | `[data-help-target="terminal"]` | View code output and interact with the shell |
| Video Player | `Space`, `←/→` | `[data-help-target="video"]` | Watch the lesson video with synced transcript |
| Niotepad | `⌘J` | `[data-help-target="niotepad"]` | Your personal notebook — capture notes and insights |
| Layout Presets | `⌘1` / `⌘2` / `⌘3` | `[data-help-target="layout"]` | Switch between workspace arrangements |
| File Tree | — | `[data-help-target="filetree"]` | Browse and manage project files |
| Control Center | — | `[data-help-target="control"]` | Navigate courses and lessons |
| Help | `⌘/` | — | You are here — workspace guide and shortcuts |

> **Target placement rule**: `data-help-target` attributes must be placed on the **navigation icon/button** for each tool (e.g., the NiotepadPill button, the Control Center icon in TopNav), not on content pane `<section>` wrappers. The spotlight glow should ring the small control element, not a large pane. Entries without a `targetSelector` (Help itself) don't trigger spotlight.

---

## 6. Spotlight System

When a user clicks a help row, a **spotlight** activates: the workspace blurs, the help panel blurs, and the target navigation control receives a terracotta outline glow.

### Sequence

1. User clicks a row (or presses Enter on focused row)
2. Workspace + help panel receive a frosted blur overlay (~200-300ms animated transition)
3. Target element (nav icon/button) receives terracotta outline glow
4. Glow pulses once to draw attention, then holds steady
5. **Click the glowing control** → launches that tool (activates the control) and dismisses spotlight + help
6. **Click anywhere else** (or press Esc) → dismisses spotlight only, returns to help list (unblurred)

### Blur Overlay

```css
/* Applied to workspace root and help panel during spotlight */
[data-help-spotlight-active] .workspace-root,
[data-help-spotlight-active] .help-panel {
  filter: blur(6px);
  opacity: 0.7;
  transition: filter 250ms ease-out, opacity 250ms ease-out;
  pointer-events: none;  /* prevent interaction with blurred elements */
}
```

- **Blur radius**: `6px` — enough to defocus but still recognizable
- **Opacity**: `0.7` — keeps spatial context visible
- **Transition**: `250ms ease-out` — smooth, not jarring
- **The glowing target element** is excluded from blur (rendered above the blur layer or in a portal)
- **Reduced motion**: Skip blur animation, instant apply

### Terracotta Glow — Consistent Style

The glow treatment must be **identical** across all control types. The `border-radius` of the glow inherits from the target element's shape:

- **Round icons** (TopNav buttons): Circular glow (`border-radius: 9999px`)
- **Capsule pills** (NiotepadPill, LayoutPresetToggle): Pill-shaped glow (`border-radius: inherit` from the pill — **not** a rectangle)
- **Rectangular elements**: Rounded rect glow with `border-radius: inherit`

```css
@keyframes help-spotlight-glow {
  0% {
    box-shadow: 0 0 0 0 var(--accent), 0 0 0 0 color-mix(in srgb, var(--accent) 30%, transparent);
  }
  50% {
    box-shadow: 0 0 0 4px var(--accent), 0 0 12px 4px color-mix(in srgb, var(--accent) 20%, transparent);
  }
  100% {
    box-shadow: 0 0 0 3px var(--accent), 0 0 8px 2px color-mix(in srgb, var(--accent) 15%, transparent);
  }
}

[data-help-spotlight] {
  position: relative;
  z-index: 70;                    /* above the blur overlay */
  animation: help-spotlight-glow 0.6s ease-out forwards;
  cursor: pointer;                /* clickable to launch */
}
```

- **Inner ring**: 3px solid terracotta (`var(--accent)`)
- **Outer glow**: Soft diffused terracotta aura (12px spread at peak, settles to 8px)
- **Animation**: Single pulse (0.6s) then holds at final state
- **Z-index**: `70` — above the blur overlay (z-60)
- **Shape**: `border-radius: inherit` — automatically matches the target element's shape

### Implementation

- Use a shared state (context or lightweight emitter) to coordinate spotlight
- When spotlight activates:
  1. Set `data-help-spotlight-active` on a common ancestor (e.g., `document.body` or workspace root)
  2. Set `data-help-spotlight` on the target control element
  3. Target element gets `z-index: 70` to float above the blur
- When spotlight dismisses:
  1. Remove both attributes
  2. Blur + glow animate out (reverse transition, 150ms)
- **Click handler on target**: Call the control's native action (toggle pane, open drawer, etc.) then dismiss spotlight + close help
- **Click handler on backdrop/elsewhere**: Dismiss spotlight only, restore help panel to unblurred state
- Use `requestAnimationFrame` for cleanup — no leftover DOM artifacts

---

## 7. File Structure

```
src/ui/help/
├── HelpModal.tsx           # Modal shell — backdrop, animation, row list layout
├── HelpRow.tsx             # Individual row component (replaces HelpCard.tsx)
├── HelpSearch.tsx          # Search input with filtering logic
├── HelpProvider.tsx        # Context provider — isOpen, spotlight state, Cmd+/ listener
├── helpEntries.ts          # Static HelpEntry[] data array (no icons)
└── useHelpSpotlight.ts     # Hook to manage blur + glow spotlight (replaces useHelpPulse.ts)
```

### Files to Remove

- `HelpCard.tsx` — replaced by `HelpRow.tsx`
- `useHelpPulse.ts` — replaced by `useHelpSpotlight.ts`

### Integration Points

- **TopNav.tsx**: `?` icon already integrated. Ensure `data-help-target` attributes are on the nav **buttons** (not content pane sections).
- **AppShell**: Already wrapped with `HelpProvider`.
- **Target elements**: Move `data-help-target` attributes from pane `<section>` wrappers to their corresponding **nav icons/buttons**. Add to any controls not yet tagged.
- **globals.css**: Replace `help-ring-pulse` keyframes with `help-spotlight-glow`. Add blur overlay styles.

### data-help-target Migration

| Entry | Current Target | New Target |
|-------|---------------|------------|
| chat | AiPane `<section>` | Nav icon/button that opens AI chat |
| editor | CodePane `<section>` | Nav icon/button that opens editor |
| terminal | CodePane `<div>` (terminal) | Nav icon/button that focuses terminal |
| video | VideoPane `<section>` | Nav icon/button that opens video |
| niotepad | NiotepadPill `<button>` | (already correct) |
| layout | TopNav `<span>` wrapper | LayoutPresetToggle pill container (already correct) |
| filetree | FileTreeSidebar `<div>` | Nav icon/button that toggles file tree |
| control | TopNav `<button>` | (already correct) |
| help | TopNav `<button>` | (no spotlight — self-referential) |

> For entries where no dedicated nav icon exists yet (chat, editor, terminal, video, filetree), the implementation must either: (a) add nav icons for these tools, or (b) target the closest relevant control (e.g., the layout preset pill that makes the pane visible). Decision deferred to implementation.

---

## 8. Accessibility

- **Focus trap**: Tab cycles within modal when open (spotlight mode traps focus on target + dismiss)
- **Esc**: In help list mode — clears search first, then closes modal. In spotlight mode — dismisses spotlight, returns to list.
- **`role="dialog"`** + `aria-modal="true"` + `aria-labelledby` pointing to header title
- **Rows**: `role="button"` + `tabIndex={0}` + Enter/Space to activate spotlight
- **Arrow keys**: Up/Down navigate between rows (active row gets left accent bar)
- **Search**: `role="searchbox"` with `aria-label="Search help entries"`
- **Reduced motion**: All animations disabled — no blur transition, no glow pulse, instant show/hide
- **Focus restore**: On close, focus returns to the `?` button in TopNav
- **Spotlight announce**: When spotlight activates, use `aria-live="polite"` to announce the target control name

---

## 9. Behavior Rules

1. **Independent lifecycle** — help modal is not tied to niotepad or drawer open/close state
2. **Backdrop click** dismisses the modal (in list mode) or dismisses spotlight (in spotlight mode)
3. **Cmd+/** toggles — if open, closes (including dismissing any active spotlight); if closed, opens
4. **Search is ephemeral** — cleared on every open (not persisted)
5. **No drag** — unlike niotepad, this is a fixed centered modal (no repositioning)
6. **Scroll position** resets on open
7. **Portal rendering** — render to `document.body` via `createPortal`
8. **Spotlight is single** — only one control highlighted at a time; clicking another row replaces the current spotlight
9. **Spotlight + launch** — clicking the glowing control activates it and closes help entirely
10. **Glow consistency** — terracotta outline glow must follow the target element's `border-radius` (round for circles, capsule for pills). Never use a rectangular glow on a non-rectangular element.

---

## 10. Migration from v1

### What Changes

| Aspect | v1 (current) | v2 (this spec) |
|--------|-------------|----------------|
| Layout | 3×3 card grid | Vertical stacked list |
| Row content | Icon + title + description + badge | Title + thin one-liner + badge (no icon) |
| Hover | Card lift (`translateY(-1px)`) | Left terracotta accent bar |
| On click | Close modal → ring pulse on pane | Blur workspace → glow on nav control |
| Highlight target | Content pane sections | Navigation icons/buttons |
| Highlight style | `::after` box-shadow pulse (3 cycles) | `box-shadow` glow (single pulse, holds) |
| Background effect | None (modal closes) | Frosted blur on workspace + panel |
| Panel during highlight | Closed | Open but blurred |
| Click highlighted element | N/A (modal was closed) | Launches the tool + closes help |
| Modal width | 560px | 480px |
| Modal height | 640px fixed | Auto (content-driven, max-height capped) |

### What Stays the Same

- Trigger: `?` button + `Cmd+/`
- Search bar with real-time filtering
- Warm tone CSS variables (reuse niotepad family)
- 5-layer warm shadow on modal
- Spring enter / tween exit animation
- Focus trap and Esc behavior
- Portal rendering to `document.body`
- `HelpProvider` context pattern
- `helpEntries.ts` data array (minus `icon` field)

---

## 11. Future Extensions (Out of Scope for v2)

- Context-aware ordering — entries relevant to current active pane surface first
- "What's New" badge on recently added entries
- Keyboard shortcut cheat sheet mode (expand all shortcuts inline)
- Animated walkthrough mode (multi-step guided tour)
