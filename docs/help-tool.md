# Help Tool — Implementation Spec

## Overview

A workspace help overlay that surfaces all tools, functions, and keybindings in a polished, searchable interface. Triggered by a `?` icon in the TopNav and `Cmd+/` shortcut.

---

## 1. Trigger

### Icon Button

- **Location**: TopNav right-side icon group, immediately after the NiotepadPill
- **Icon**: `Question` from `@phosphor-icons/react` (weight: bold, size: 16)
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
- **Dimensions**: `560px` wide × `640px` tall (max-height: `calc(100vh - 96px)`)
- **Responsive**: On viewports < 600px wide, use `calc(100vw - 32px)` width
- **Border radius**: `16px`
- **Z-index**: Above niotepad (niotepad is a floating panel; help is a modal with backdrop)

### Backdrop

- **Style**: Warm-tinted semi-transparent overlay
- **Color (light)**: `rgba(120, 90, 60, 0.12)` — warm brown at low opacity
- **Color (dark)**: `rgba(20, 16, 12, 0.40)` — warm charcoal
- **Click to dismiss**: Yes
- **Blur**: None (keep workspace visible through warm tint)

### Warm Tone Styling

Reuse the niotepad CSS custom property family for consistency:

```
--help-panel-bg:      var(--niotepad-panel-bg)       /* #f7f0e4 light / #272119 dark */
--help-header-bg:     var(--niotepad-header-bg)       /* #f2eadb light / #2e271f dark */
--help-text-muted:    var(--niotepad-text-muted)       /* #8c7e6e light / #a89888 dark */
--help-text-subtle:   var(--niotepad-text-subtle)      /* #b3a594 light / #786a5c dark */
--help-border:        var(--niotepad-panel-border)
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
┌──────────────────────────────────────────────┐
│  Header: "Help" title            [×] close   │
├──────────────────────────────────────────────┤
│  [ 🔍 Search tools and shortcuts...       ]  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  Icon   │  │  Icon   │  │  Icon   │     │
│  │  Name   │  │  Name   │  │  Name   │     │
│  │  Desc   │  │  Desc   │  │  Desc   │     │
│  │  ⌘K     │  │  ⌘J     │  │  ⌘1     │     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  ...    │  │  ...    │  │  ...    │     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                              │
│  (scrollable if needed)                      │
└──────────────────────────────────────────────┘
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
- **Behavior**: Real-time filtering — fuzzy match on card name, description, and shortcut text
- **Autofocus**: Yes, on panel open
- **Clear**: `Esc` clears search text (if search has content); second `Esc` closes panel

### Card Grid

- **Layout**: CSS Grid — `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))` with `gap: 12px`
- **Padding**: `16px`
- **Scroll**: Vertical overflow with warm-toned scrollbar (reuse `--niotepad-scrollbar`)
- **Empty state**: When search yields no results — "No matching tools" in muted text, centered

---

## 4. Card Design

Each card represents one workspace tool or function.

### Structure

```
┌───────────────────────┐
│      ◎ Icon (24px)    │  ← Phosphor icon, centered
│                       │
│     Tool Name         │  ← font-medium text-sm
│   Short description   │  ← text-xs text-muted, 1-2 lines
│                       │
│     ┌──────────┐      │
│     │  ⌘ K     │      │  ← shortcut badge (if any)
│     └──────────┘      │
└───────────────────────┘
```

### Styling

- **Background**: `color-mix(in srgb, var(--help-panel-bg) 80%, white 20%)` (slightly lighter than panel bg)
- **Border**: `1px solid var(--help-border)` at 50% opacity
- **Border radius**: `12px`
- **Padding**: `16px 12px`
- **Text alignment**: Center
- **Hover**: Lift effect — `translateY(-1px)` + subtle shadow increase + border opacity to 100%
- **Cursor**: `pointer`
- **Transition**: `all 150ms ease`

### Shortcut Badge

- **Background**: `color-mix(in srgb, var(--help-border) 30%, transparent)`
- **Border radius**: `6px`
- **Padding**: `2px 8px`
- **Font**: `text-[11px] font-mono tracking-wide`
- **Color**: `var(--help-text-muted)`
- **Multiple shortcuts**: Stack vertically with `gap: 4px`

---

## 5. Help Entries — Data Model

```typescript
interface HelpEntry {
  id: string;
  name: string;
  description: string;
  icon: PhosphorIconComponent;
  shortcuts?: Shortcut[];
  /** CSS selector or ref callback to locate the target element for pulse */
  targetSelector?: string;
  /** Category for potential future filtering */
  category: 'editor' | 'terminal' | 'video' | 'chat' | 'niotepad' | 'layout' | 'filetree' | 'control';
}

interface Shortcut {
  /** Display label, e.g., "⌘K" */
  label: string;
  /** Description of what the shortcut does (if tool has multiple) */
  action?: string;
}
```

### Entries (Initial Set)

| Tool | Icon | Shortcuts | Target Selector | Description |
|------|------|-----------|-----------------|-------------|
| AI Chat (Nio) | `ChatCircleDots` | `⌘K` | `[data-help-target="chat"]` | Ask Nio about the lesson, code, or transcript |
| Code Editor | `Code` | `⌘S` (run) | `[data-help-target="editor"]` | Write and execute code in multiple languages |
| Terminal | `Terminal` | `` ⌘` `` (focus) | `[data-help-target="terminal"]` | View code output and interact with the shell |
| Video Player | `PlayCircle` | `Space` (play/pause), `←/→` (seek) | `[data-help-target="video"]` | Watch the lesson video with synced transcript |
| Niotepad | `Notepad` | `⌘J` | `[data-help-target="niotepad"]` | Your personal notebook — capture notes, code, and insights |
| Layout Presets | `Layout` | `⌘1` / `⌘2` / `⌘3` | `[data-help-target="layout"]` | Switch between workspace arrangements |
| File Tree | `FolderOpen` | — | `[data-help-target="filetree"]` | Browse and manage project files |
| Control Center | `SidebarSimple` | — | `[data-help-target="control"]` | Navigate courses and lessons |
| Help | `Question` | `⌘/` | — | You are here — workspace guide and shortcuts |

> **Note**: `targetSelector` uses `data-help-target` attributes added to workspace elements. Cards without a `targetSelector` (like Help itself) won't trigger the pulse effect.

---

## 6. Interactive Highlight — Ring Pulse

When a user clicks a help card:

### Sequence

1. Close the help modal (exit animation plays)
2. Wait for exit animation to complete (~200ms)
3. Locate the target element via `targetSelector`
4. If the target tool needs to be activated first (e.g., opening the chat pane), activate it
5. Apply the ring pulse animation to the target element
6. Ring pulses 2-3 times, then fades out

### Ring Pulse CSS

```css
@keyframes help-ring-pulse {
  0% {
    box-shadow: 0 0 0 0 var(--accent);
    opacity: 1;
  }
  70% {
    box-shadow: 0 0 0 8px var(--accent);
    opacity: 0;
  }
  100% {
    box-shadow: 0 0 0 8px var(--accent);
    opacity: 0;
  }
}

[data-help-pulse] {
  position: relative;
}

[data-help-pulse]::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid var(--accent);
  animation: help-ring-pulse 0.8s ease-out 3;
  pointer-events: none;
}
```

### Implementation

- Use a shared callback (e.g., via context or a lightweight event emitter) to trigger the pulse
- Add `data-help-pulse` attribute to the target element temporarily
- Remove the attribute after animation completes (2.4s for 3 cycles)
- Use `requestAnimationFrame` + `setTimeout` for cleanup — no leftover DOM artifacts

---

## 7. File Structure

```
src/ui/help/
├── HelpModal.tsx           # Modal shell — backdrop, animation, layout
├── HelpCard.tsx            # Individual card component
├── HelpSearch.tsx          # Search input with filtering logic
├── HelpProvider.tsx        # Context provider — isOpen state, Cmd+/ listener, pulse trigger
├── helpEntries.ts          # Static HelpEntry[] data array
└── useHelpPulse.ts         # Hook to apply ring pulse to target elements
```

### Integration Points

- **TopNav.tsx**: Add `HelpButton` (the `?` icon) to the right-side icon group, after NiotepadPill
- **AppShell (or workspace layout)**: Wrap with `HelpProvider` and render `HelpModal` via portal
- **Target elements**: Add `data-help-target="<id>"` attributes to workspace panes/tools
- **globals.css**: Add `--help-*` CSS custom properties and `help-ring-pulse` keyframes

---

## 8. Accessibility

- **Focus trap**: Tab cycles within modal when open
- **Esc**: Closes modal (search clear first if search has content)
- **`role="dialog"`** + `aria-modal="true"` + `aria-labelledby` pointing to header title
- **Cards**: `role="button"` + `tabIndex={0}` + Enter/Space to activate
- **Search**: `role="searchbox"` with `aria-label="Search help entries"`
- **Reduced motion**: All animations disabled, instant show/hide
- **Focus restore**: On close, focus returns to the `?` button in TopNav

---

## 9. Behavior Rules

1. **Independent lifecycle** — help modal is not tied to niotepad or drawer open/close state
2. **Backdrop click** dismisses the modal
3. **Cmd+/** toggles — if open, closes; if closed, opens
4. **Search is ephemeral** — cleared on every open (not persisted)
5. **No drag** — unlike niotepad, this is a fixed centered modal (no repositioning)
6. **Scroll position** resets on open
7. **Portal rendering** — render to `document.body` via `createPortal` (same as niotepad)

---

## 10. Future Extensions (Out of Scope for v1)

- Category filter tabs above the card grid
- "What's New" section highlighting recently added features
- Onboarding mode — first-time users get a guided walkthrough
- Card badges showing feature maturity (beta, new)
- Context-aware help — cards relevant to the current active pane surface first
