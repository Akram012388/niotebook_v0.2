# Help Tool — Implementation Spec (v3: Guided Tour)

## Overview

A minimal guided tour that walks new users through workspace controls one at a time. Clicking `?` in TopNav starts a step-by-step spotlight sequence: each step dims the workspace, highlights one element, and shows a tooltip with the tool name and keyboard shortcut. Clicking the highlighted element activates it and advances to the next step.

**Design reference**: Figma's onboarding — subtle, contextual, minimal footprint.

**Philosophy**: Radically simple. No modal. No search. No list. One element at a time.

---

## 1. Trigger

### Icon Button

- **Location**: TopNav right-side icon group (existing `?` button)
- **Behavior**: Click starts the tour from step 1 (or resumes if tour was interrupted)
- **Active state**: `border-accent bg-accent text-white` while tour is running
- **Accessibility**: `aria-label="Start workspace tour"` / `"Stop tour"`, `aria-pressed={isActive}`

### Keyboard Shortcut

- **Binding**: `Cmd+/` (macOS) / `Ctrl+/` (Windows/Linux)
- **Behavior**: Toggle — starts tour if inactive, ends tour if active
- **Scope**: Global (provider-level keydown listener)

---

## 2. Tour Steps

Each step has a target element, a display name, and an optional keyboard shortcut.

```typescript
interface TourStep {
  id: string;
  name: string;
  shortcut?: string;
  targetSelector: string;
}
```

### Step Order (nav controls first, then panes)

| # | Step | Shortcut | Target Selector |
|---|------|----------|-----------------|
| 1 | Layout Presets | `⌘1-3` | `[data-help-target="layout"]` |
| 2 | Control Center | — | `[data-help-target="control"]` |
| 3 | Video Player | `Space` | `[data-help-target="video"]` |
| 4 | Code Editor | `⌘S` | `[data-help-target="editor"]` |
| 5 | Terminal | `` ⌘` `` | `[data-help-target="terminal"]` |
| 6 | AI Chat (Nio) | `⌘K` | `[data-help-target="chat"]` |
| 7 | File Tree | — | `[data-help-target="filetree"]` |
| 8 | Niotepad | `⌘J` | `[data-help-target="niotepad"]` |

> **8 steps total.** Help itself is excluded (self-referential). Order prioritizes navigation controls the user needs to orient themselves, then the content panes they'll interact with.

---

## 3. Spotlight

Each tour step dims the entire workspace and elevates the target element above the dim layer.

### Dim Overlay

- **Method**: Full-screen fixed overlay (`position: fixed; inset: 0`) rendered via portal
- **Color (light)**: `rgba(0, 0, 0, 0.5)`
- **Color (dark)**: `rgba(0, 0, 0, 0.6)`
- **Z-index**: `60`
- **Transition**: `opacity 200ms ease`
- **No blur** — simple opacity dim only (keeps it lightweight)

### Target Elevation

- Target element receives `data-help-spotlight` attribute
- CSS rule: `[data-help-spotlight] { position: relative; z-index: 70; }`
- Target is visually "punched through" the dim overlay — fully visible, everything else dimmed
- No glow animation, no terracotta ring — the contrast against the dim is sufficient

### Click Behavior

- **Click the target element**: Activates the tool (native click) AND advances to the next tour step
- **Click anywhere else (the dim overlay)**: Ends the tour immediately
- **Esc key**: Ends the tour immediately

---

## 4. Tooltip

A small tooltip anchored to the highlighted element, showing the tool name and shortcut.

### Content

```
┌─────────────────────────┐
│  Layout Presets    ⌘1-3 │
│         ● ● ○ ○ ○ ○ ○ ○│
└─────────────────────────┘
```

- **Line 1**: Tool name (left) + keyboard shortcut (right, monospace)
- **Line 2**: Progress dots

### Positioning

- **Anchor**: Below the target element, horizontally centered, with 8px gap
- **Fallback**: If below would overflow the viewport, position above instead
- **Calculation**: Use `getBoundingClientRect()` on the target element to compute position
- **Z-index**: `71` (above both dim overlay and target element)

### Styling

- **Background**: `var(--surface)` (adapts to theme)
- **Border**: `1px solid var(--border)`
- **Border radius**: `8px`
- **Padding**: `8px 12px`
- **Shadow**: `0 4px 12px rgba(0, 0, 0, 0.15)`
- **Font**: Tool name in `text-sm font-medium`, shortcut in `text-xs font-mono text-muted`
- **Max width**: `240px`
- **Pointer events**: `none` (tooltip is not interactive — user clicks the target, not the tooltip)
- **Transition**: `opacity 150ms ease, transform 150ms ease` (fade + slight slide on step change)

### Progress Dots

- **Style**: Small circles (`6px` diameter), inline after the label row
- **Active step**: Filled (`var(--foreground)`)
- **Completed steps**: Filled (`var(--foreground)`)
- **Upcoming steps**: Hollow (`border: 1.5px solid var(--text-muted)`, transparent fill)
- **Gap**: `4px` between dots
- **Alignment**: Right-aligned within the tooltip, below the name/shortcut line

---

## 5. Tour Lifecycle

### Start

1. User clicks `?` or presses `Cmd+/`
2. Tour state: `{ isActive: true, step: 0 }`
3. Dim overlay fades in (200ms)
4. First target element receives `data-help-spotlight`
5. Tooltip appears anchored to target

### Advance

1. User clicks the highlighted target element
2. Native click fires on the target (activates the tool)
3. `step` increments to `step + 1`
4. Previous target loses `data-help-spotlight`
5. New target receives `data-help-spotlight`
6. Tooltip repositions to new target (150ms transition)

### End

Tour ends when any of these occur:
- User completes the last step (clicks step 8's target)
- User clicks the dim overlay (anywhere outside the target)
- User presses `Esc`
- User presses `Cmd+/` again

On end:
1. `data-help-spotlight` removed from current target
2. Dim overlay fades out (150ms)
3. Tour state resets: `{ isActive: false, step: 0 }`
4. Focus returns to the `?` button

### Edge Cases

- **Target not found**: If `querySelector` returns null for a step's selector (e.g., pane not mounted in current layout), skip that step automatically
- **Window resize**: Recalculate tooltip position on resize (debounced)
- **Rapid clicks**: Debounce step advancement (100ms) to prevent skipping steps

---

## 6. File Structure

```
src/ui/help/
├── HelpProvider.tsx     # Context: isActive, step, start(), advance(), end()
├── HelpTour.tsx         # Renders dim overlay + tooltip (portal to body)
└── tourSteps.ts         # Static TourStep[] array
```

### Files to Delete (from v2)

- `HelpModal.tsx` (307 lines) — no modal
- `HelpRow.tsx` (93 lines) — no rows
- `HelpSearch.tsx` (122 lines) — no search
- `useHelpSpotlight.ts` (120 lines) — replaced by simpler dim + z-index approach
- `helpEntries.ts` (117 lines) — replaced by `tourSteps.ts` (much smaller)

### CSS to Delete (from globals.css)

- All `--help-*` CSS custom properties (lines ~247-259)
- `@keyframes help-spotlight-glow` (lines ~261-271)
- `[data-help-spotlight]` styles (lines ~273-286)
- `[data-help-spotlight-active]` blur styles
- `.help-scroll` scrollbar styles (lines ~289-301)

### CSS to Add (globals.css)

```css
[data-help-spotlight] {
  position: relative;
  z-index: 70;
}
```

That's it. One rule.

---

## 7. State Shape

```typescript
interface HelpTourState {
  isActive: boolean;
  step: number;        // 0-indexed into tourSteps[]
}

interface HelpContext {
  isActive: boolean;
  step: number;
  totalSteps: number;
  start: () => void;
  advance: () => void;
  end: () => void;
}
```

Provider holds the state. `HelpTour` reads it and renders conditionally. TopNav's `?` button calls `start()` / `end()`.

---

## 8. Accessibility

- **Esc**: Ends tour immediately
- **Focus**: Target element receives focus on each step
- **`aria-live="polite"`**: Announces step name on each transition ("Step 3 of 8: Video Player")
- **Reduced motion**: Skip fade transitions, instant show/hide
- **Focus restore**: On tour end, focus returns to `?` button
- **Screen reader**: Dim overlay has `aria-hidden="true"`, tooltip has `role="tooltip"`

---

## 9. Behavior Rules

1. **No persistence** — tour always starts from step 1 (no "resume where you left off")
2. **Cmd+/ toggles** — start if inactive, end if active
3. **Independent lifecycle** — tour is not tied to niotepad, drawer, or any other panel state
4. **Single instance** — only one spotlight at a time (inherent in step-based model)
5. **Skip missing targets** — if a target element isn't in the DOM, skip to the next step
6. **No portal for target** — target stays in place in the DOM, only z-index is changed
7. **Tooltip is non-interactive** — pointer-events: none; user clicks the target itself

---

## 10. Integration Changes

### TopNav.tsx

- `?` button calls `start()` instead of toggling a modal
- Active state styling when `isActive === true`

### AppShell.tsx

- `HelpProvider` stays (already wrapping the app)
- `HelpTour` rendered inside provider (replaces lazy-loaded HelpModal)

### data-help-target Attributes

All existing `data-help-target` attributes on workspace panes and nav controls are reused as-is. No migration needed — the tour's `targetSelector` values match the existing attributes.

### Workspace Pane Components

No changes. The `data-help-target` attributes already exist on:
- `AiPane.tsx` → `data-help-target="chat"`
- `CodePane.tsx` → `data-help-target="editor"`, `data-help-target="terminal"`
- `VideoPane.tsx` → `data-help-target="video"`
- `FileTreeSidebar.tsx` → `data-help-target="filetree"`
- `NiotepadPill.tsx` → `data-help-target="niotepad"`
- `TopNav.tsx` → `data-help-target="layout"`, `data-help-target="control"`

---

## Complexity Comparison

| Metric | v2 (current) | v3 (this spec) |
|--------|-------------|----------------|
| Files | 6 | 3 |
| Total lines (est.) | ~880 | ~150-200 |
| Dependencies | Framer Motion, createPortal | createPortal only |
| CSS rules | ~40 lines of custom properties + keyframes + selectors | 1 rule (3 lines) |
| State | isOpen, search query, active row, spotlight target, blur state | isActive, step number |
| Concepts | Modal, search, rows, keyboard nav, spotlight, blur, glow, focus trap | Dim overlay, tooltip, step counter |
