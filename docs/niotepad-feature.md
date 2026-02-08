# Niotepad Experimental -- Feature Plan

> **Branch:** `feat/niotepad-experimental`
> **Base:** `main` @ `cf17f9c`
> **Author:** Architect Agent
> **Created:** 2026-02-08
> **Status:** Draft -- Pending Review

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Architecture](#2-architecture)
3. [Visual Design Specification](#3-visual-design-specification)
4. [Component Breakdown](#4-component-breakdown)
5. [Interaction Design](#5-interaction-design)
6. [State Management](#6-state-management)
7. [Entry Types & Data Model](#7-entry-types--data-model)
8. [Push Mechanics](#8-push-mechanics)
9. [Page Navigation](#9-page-navigation)
10. [Search & Filter](#10-search--filter)
11. [Animation Specification](#11-animation-specification)
12. [Accessibility](#12-accessibility)
13. [Performance](#13-performance)
14. [Implementation Phases](#14-implementation-phases)
15. [File Manifest](#15-file-manifest)
16. [Risk Assessment](#16-risk-assessment)
17. [Open Questions](#17-open-questions)

---

## 1. Overview & Philosophy

### The Pitch

Niotepad Experimental is a **floating glassmorphic panel** that overlays the workspace
without disturbing the sacred single/dual/triple layout grid. It is styled as a
**modern minimal ruled notebook page** -- warm cream tint, subtle ruled lines,
binder dots carried over from the landing page's `NotebookFrame` component --
and serves as a bidirectional learning catalog.

It is not "another AI notes sidebar." It is the creative showpiece feature that
transforms niotebook from a competent AI learning IDE into a *carefully crafted
learning experience*.

### Guiding Principle

> *"Simplicity is the ultimate sophistication."* -- Leonardo da Vinci

Every decision in this plan prioritizes restraint over feature creep. The panel
must feel like picking up a beautiful notebook -- inviting, tactile, effortless.
No chrome, no visual noise, no modal interruption. Spring physics, not linear
easing. Glass, not plastic.

### What Makes This Novel

1. **Floating overlay, not a pane.** Unlike the prior `feat/niotepad` approach (which
   added a fourth pane type to the workspace grid), this panel hovers over the
   workspace like Apple's Quick Note -- preserving the user's layout while offering
   a scratch surface.

2. **Bidirectional push from every workspace pane.** Code selections, chat responses,
   and video bookmarks all flow into the niotepad with source-typed entries. Video
   bookmarks carry AI-generated summaries.

3. **Per-lecture pages with page navigation.** The notebook is organized into
   lecture-scoped pages. Users flip between them like sections of a physical
   notebook, and each page scrolls infinitely.

4. **Premium interaction model.** Spring animations, glassmorphism, draggable +
   resizable panel, gesture-based dismiss, focus trapping, keyboard shortcuts --
   every interaction detail is specified to produce a 60fps, Apple-grade experience.

### What This Must NOT Do

- Disturb the workspace layout grid (`LayoutGrid`, `WorkspaceGrid`)
- Block interaction with the underlying panes when dismissed
- Feel like "just another AI notes feature"
- Look cheap, cluttered, or bloated
- Require a separate route

### Relationship to `feat/niotepad`

The `feat/niotepad` branch (not merged to main) implemented niotepad as a **fourth
pane type** inside the workspace grid. That approach:

- Modified `WorkspaceGrid.tsx` extensively (~217 added lines)
- Added `N` to pane switchers (A/C/N, V/C/N)
- Required complex single-instance constraints
- Competed for grid column space

This plan **supersedes** that approach entirely. We will however **reuse** the
following proven artifacts from `feat/niotepad`:

| Artifact | Reuse? | Notes |
|----------|--------|-------|
| `src/domain/niotepad.ts` | Yes, extend | Add page concept, richer metadata |
| `src/infra/niotepad/useNiotepadStore.ts` | Yes, rewrite | Add pages, search, panel state |
| `src/infra/niotepad/indexedDbNiotepad.ts` | Yes, extend | Store pages, not flat entries |
| `src/ui/panes/NiotepadEntry.tsx` | Partial | Extract entry rendering, adapt for floating panel |
| `src/ui/panes/NiotepadPane.tsx` | No | Replaced by floating panel architecture |
| `src/ui/chat/useSelectionPush.ts` | Yes, as-is | Chat selection push hook |
| `src/ui/shared/PushToNiotepad.tsx` | Partial | Push button component, adapt |
| Binder geometry constants | Yes | From `NotebookFrame.tsx` |

---

## 2. Architecture

### 2.1 Component Tree

```
AppShell (src/ui/shell/AppShell.tsx)
  |-- TopNav
  |     |-- ... existing controls ...
  |     |-- NiotepadPill               <-- NEW: "N" pill trigger in TopNav
  |
  |-- WorkspaceShell
  |     |-- WorkspaceGrid              <-- UNCHANGED
  |           |-- VideoPane
  |           |-- CodePane
  |           |-- AiPane
  |
  |-- NiotepadPortal                   <-- NEW: React portal to document.body
        |-- NiotepadBackdrop           <-- NEW: click-outside dismiss layer
        |-- NiotepadPanel              <-- NEW: the glassmorphic floating panel
              |-- NiotepadDragHandle   <-- NEW: top bar for dragging
              |-- NiotepadPageNav      <-- NEW: page tabs / navigation
              |-- NiotepadSearch       <-- NEW: search bar (collapsible)
              |-- NiotepadScrollArea   <-- NEW: virtualized scrollable area
              |     |-- NiotepadRuledPaper  <-- NEW: ruled paper background
              |     |-- NiotepadEntry[]     <-- NEW: individual entries
              |     |-- NiotepadComposer    <-- NEW: inline composer textarea
              |
              |-- NiotepadResizeHandle <-- NEW: bottom-right resize grip
```

### 2.2 Mount Strategy

The panel renders via a **React portal** attached to `document.body`, outside the
workspace DOM tree. This guarantees:

- No CSS `overflow: hidden` clipping from workspace containers
- No disruption to the LayoutGrid or WorkspaceGrid components
- Independent z-index stacking
- Clean mount/unmount lifecycle

The portal is conditionally rendered from `AppShell`, which already wraps the
entire workspace page.

### 2.3 Data Flow

```
                                    +-------------------+
                                    |   NiotepadStore   |
                                    |   (Zustand)       |
                                    +--------+----------+
                                             |
                          +------------------+-------------------+
                          |                  |                   |
                    +-----------+    +-------------+     +-------------+
                    | IndexedDB |    | Panel State |     | Entry CRUD  |
                    | (persist) |    | (open/pos)  |     | (add/edit)  |
                    +-----------+    +------+------+     +------+------+
                                           |                    |
          +----------+----------+----------+----------+         |
          |          |          |          |           |         |
     +----+---+ +---+----+ +--+-----+ +--+-------+   |    +----+----+
     |TopNav  | |Keyboard| |Gesture | |LocalStore|   |    |Push Hooks|
     |N Pill  | |Cmd+J   | |Corner  | |(pos/size)|   |    +-+--+--+-+
     +--------+ +--------+ +--------+ +----------+   |      |  |  |
                                                      |      |  |  |
                                    +-----------------+------+--+--+-----+
                                    |                 |         |        |
                              +-----+-----+    +-----+---+ +---+----+ +-+------+
                              |NiotepadPanel|  |CodePane  | |AiPane  | |VideoPane|
                              +------------+   +----------+ +--------+ +---------+
```

### 2.4 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mount strategy | Portal to `document.body` | Avoids workspace layout disruption |
| Panel behavior | Floating overlay, not a pane | Preserves sacred layout modes |
| State management | Single Zustand store | Richer than context; needs CRUD, pagination, panel state |
| Persistence | IndexedDB for entries, localStorage for panel geometry | Same patterns as VFS store and layout preset |
| Animation library | Framer Motion (already `^12.29.2` in deps) | Spring physics, drag, layout animations |
| Shortcut key | `Cmd/Ctrl+J` (not `Cmd+N`) | `Cmd+N` is a browser-reserved shortcut and cannot be overridden |
| Ruled lines | `repeating-linear-gradient` on scroll container | CSS-only, scrolls with content via `background-attachment: local` |
| Glassmorphism | `backdrop-filter: blur(12px)` + semi-transparent bg | Proven pattern, 95%+ browser support |
| Entry rendering | Inline rich text with markdown | Consistent with chat messages (`nio-markdown` class) |
| Page model | Per-lecture pages, auto-created on first push | Maps naturally to the lesson-scoped workspace |

---

## 3. Visual Design Specification

### 3.1 Panel Container -- Glassmorphism Recipe

```css
.niotepad-panel {
  /* --- Glass effect --- */
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  backdrop-filter: blur(12px) saturate(1.3);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-xl); /* 16px */

  /* --- Elevation (multi-layer shadow for depth) --- */
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--foreground) 4%, transparent),
    0 2px 4px -1px color-mix(in srgb, var(--foreground) 6%, transparent),
    0 8px 16px -4px color-mix(in srgb, var(--foreground) 8%, transparent),
    0 24px 48px -8px color-mix(in srgb, var(--foreground) 10%, transparent);

  /* --- @supports fallback for no backdrop-filter --- */
  @supports not (backdrop-filter: blur(1px)) {
    background: var(--surface);
    opacity: 0.97;
  }
}
```

**Dark theme adjustments** (automatically via CSS custom properties):
- `var(--surface)` shifts from `#faf9f7` to `#252220`
- `var(--border)` shifts from `#ddd8d0` to `#3a3531`
- Shadow opacities increase (dark theme shadows are already darker in tokens)
- Glass alpha stays at 78% -- dark content behind it produces naturally darker glass

### 3.2 Panel Dimensions & Position

```
Default:
  width:    440px
  height:   560px
  position: bottom-right corner, 24px inset from viewport edges

Minimum:
  width:    320px
  height:   360px

Maximum:
  width:    640px
  height:   min(85vh, 800px)

Stored in localStorage key: "niotebook.niotepad.geometry"
Value: JSON { x, y, width, height }
```

### 3.3 Ruled Paper Background

The scrollable content area uses ruled lines that align to the text `line-height`:

```css
.niotepad-ruled-paper {
  /* Line spacing matches text line-height: 24px */
  --ruled-line-spacing: 24px;
  --ruled-line-color: color-mix(in srgb, var(--foreground) 6%, transparent);
  --ruled-margin-color: color-mix(in srgb, var(--accent) 15%, transparent);
  --paper-tint: color-mix(in srgb, #fdf6e3 4%, var(--surface));

  background-color: var(--paper-tint);
  background-image:
    /* Horizontal ruled lines */
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent calc(var(--ruled-line-spacing) - 1px),
      var(--ruled-line-color) calc(var(--ruled-line-spacing) - 1px),
      var(--ruled-line-color) var(--ruled-line-spacing)
    ),
    /* Left margin line (subtle accent) */
    linear-gradient(
      to right,
      transparent 47px,
      var(--ruled-margin-color) 47px,
      var(--ruled-margin-color) 48px,
      transparent 48px
    );
  background-attachment: local;
  background-position: 0 0;
}
```

**Dark theme paper tint:**
```css
[data-theme="dark"] .niotepad-ruled-paper {
  --paper-tint: color-mix(in srgb, #2a2520 8%, var(--surface));
  --ruled-line-color: color-mix(in srgb, var(--foreground) 5%, transparent);
  --ruled-margin-color: color-mix(in srgb, var(--accent) 12%, transparent);
}
```

### 3.4 Binder Dots

Adapted from `NotebookFrame.tsx` geometry (`src/ui/shared/NotebookFrame.tsx:19-23`):

```
Constants (reuse from NotebookFrame):
  RAIL_W      = 2px    (width of each vertical rail line)
  RAIL_GAP    = 2px    (gap between the two rails)
  HOLE_D      = 6px    (diameter of punch-holes)
  HOLE_SPACING = 12px  (vertical repeat distance)

Panel-specific:
  BINDER_LEFT = 12px   (inset from panel left edge -- tighter than NotebookFrame's 20px)
```

Implementation: Two absolute-positioned `<div>` rails with a CSS-masked overlay strip
(same radial-gradient mask technique as `NotebookFrame.tsx:39-46`).

### 3.5 Color Tokens (New)

Add to `globals.css` under `:root`:

```css
:root {
  /* --- Niotepad --- */
  --niotepad-paper: color-mix(in srgb, #fdf6e3 4%, var(--surface));
  --niotepad-ruled: color-mix(in srgb, var(--foreground) 6%, transparent);
  --niotepad-margin: color-mix(in srgb, var(--accent) 15%, transparent);
  --niotepad-glass-bg: color-mix(in srgb, var(--surface) 78%, transparent);
  --niotepad-glass-border: color-mix(in srgb, var(--border) 60%, transparent);
}

[data-theme="dark"] {
  --niotepad-paper: color-mix(in srgb, #2a2520 8%, var(--surface));
  --niotepad-ruled: color-mix(in srgb, var(--foreground) 5%, transparent);
  --niotepad-margin: color-mix(in srgb, var(--accent) 12%, transparent);
  --niotepad-glass-bg: color-mix(in srgb, var(--surface) 72%, transparent);
  --niotepad-glass-border: color-mix(in srgb, var(--border) 50%, transparent);
}
```

### 3.6 Typography Within the Panel

```
Header (drag handle bar):
  font-size: 13px
  font-weight: 600
  font-family: var(--font-body)  (Geist Sans)
  color: var(--foreground)

Page tabs:
  font-size: 11px
  font-weight: 500
  letter-spacing: 0.02em
  text-transform: none
  color: var(--text-muted), active: var(--foreground)

Entry text:
  font-size: 14px
  line-height: 24px   (matches ruled line spacing)
  font-family: var(--font-body)
  color: var(--foreground)

Code within entries:
  font-family: var(--font-code)  (Geist Mono)
  font-size: 13px
  line-height: 20px

Composer placeholder:
  font-size: 14px
  color: var(--text-subtle)

Search input:
  font-size: 13px
  font-family: var(--font-body)
```

### 3.7 Grain Texture (Optional Enhancement)

A barely-perceptible SVG noise filter overlaid on the paper for tactile warmth:

```css
.niotepad-grain::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  mix-blend-mode: multiply;
  z-index: 0;
}
```

This is purely decorative. Mark as optional -- implement only if performance
budget allows (test on lower-end devices first).

---

## 4. Component Breakdown

### 4.1 NiotepadProvider

```
File: src/ui/niotepad/NiotepadProvider.tsx
Type: Client component ("use client")
Purpose: Wraps AppShell children to provide keyboard shortcut listener
         and render the portal conditionally.

Props: { children: ReactNode }

Responsibilities:
  - Listen for Cmd/Ctrl+J keydown to toggle panel
  - Render <NiotepadPortal /> when store.isOpen is true
  - Pass lessonId from URL searchParams to the store
```

### 4.2 NiotepadPortal

```
File: src/ui/niotepad/NiotepadPortal.tsx
Type: Client component ("use client")
Purpose: Creates a React portal to document.body for the panel + backdrop.

Props: none (reads from NiotepadStore)

Responsibilities:
  - createPortal to document.body
  - Render NiotepadBackdrop + NiotepadPanel inside portal
  - AnimatePresence wrapper for mount/unmount animations
```

### 4.3 NiotepadBackdrop

```
File: src/ui/niotepad/NiotepadBackdrop.tsx
Type: Client component ("use client")
Purpose: Semi-transparent backdrop for click-outside dismiss.

Props: { onDismiss: () => void }

Responsibilities:
  - Full-viewport fixed overlay at z-index 49
  - background: transparent (no darkening -- the panel floats without dimming)
  - onClick calls onDismiss
  - Framer Motion fade-in/out animation (opacity 0 -> 1, 120ms)
```

### 4.4 NiotepadPanel

```
File: src/ui/niotepad/NiotepadPanel.tsx
Type: Client component ("use client")
Purpose: The main glassmorphic floating panel.

Props: none (reads from NiotepadStore)

Responsibilities:
  - Glassmorphism styling (backdrop-filter, borders, shadows)
  - Framer Motion spring animation for open/close
  - Drag via drag prop on motion.div (constrained to viewport)
  - Position/size from store, persisted to localStorage
  - Contains: DragHandle, PageNav, Search, ScrollArea, ResizeHandle
  - Focus trap when mounted
  - z-index: 50
```

### 4.5 NiotepadDragHandle

```
File: src/ui/niotepad/NiotepadDragHandle.tsx
Type: Client component
Purpose: Top bar of the panel -- displays title, entry count, close button.
         Also serves as the drag handle (pointer events initiate drag).

Props: {
  pageTitle: string;
  entryCount: number;
  onClose: () => void;
}

Responsibilities:
  - Render panel title: "Niotepad" (left-aligned)
  - Render page title as subtitle (e.g., "Lecture 3: Algorithms")
  - Entry count badge: "(12)" in text-muted
  - Close button: X icon, top-right
  - Export button: download icon
  - Drag handle visual indicator: 6 centered dots (grip pattern)
  - cursor: grab (cursor: grabbing on active drag)

Visual:
  +-------------------------------------------------------+
  |  :: Niotepad                    Lecture 3  (12)   [X]  |
  +-------------------------------------------------------+
```

### 4.6 NiotepadPageNav

```
File: src/ui/niotepad/NiotepadPageNav.tsx
Type: Client component
Purpose: Horizontal tab bar for switching between lecture pages.

Props: {
  pages: NiotepadPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
}

Responsibilities:
  - Render horizontal scrollable tab strip
  - Each tab: lecture number or title (truncated)
  - Active tab: underline accent indicator
  - "All" tab for cross-page view
  - Overflow: horizontal scroll with fade edges

Visual:
  +-------------------------------------------------------+
  |  All  |  L1  |  L2  |  L3*  |  L4  |  ...   [search] |
  +-------------------------------------------------------+
  (* = active, underlined with accent)
```

### 4.7 NiotepadSearch

```
File: src/ui/niotepad/NiotepadSearch.tsx
Type: Client component
Purpose: Collapsible search bar with filter chips.

Props: {
  query: string;
  onQueryChange: (query: string) => void;
  activeFilters: NiotepadEntrySource[];
  onFilterToggle: (source: NiotepadEntrySource) => void;
}

Responsibilities:
  - Search icon button that expands into input field
  - Debounced search (200ms) on query change
  - Filter chips: All | Code | Chat | Video | Manual
  - Clear button when query is non-empty
  - Collapse back to icon when query is empty and user clicks away
```

### 4.8 NiotepadScrollArea

```
File: src/ui/niotepad/NiotepadScrollArea.tsx
Type: Client component
Purpose: Scrollable container with ruled paper background and binder dots.

Props: {
  children: ReactNode;
  onPaperClick: () => void;
}

Responsibilities:
  - Ruled paper CSS background (repeating-linear-gradient)
  - background-attachment: local (scrolls with content)
  - Binder dots on left edge (absolute positioned)
  - overflow-y: auto with custom scrollbar styling
  - Click handler on paper area to focus composer
  - Auto-scroll to bottom on new entries
```

### 4.9 NiotepadEntry

```
File: src/ui/niotepad/NiotepadEntry.tsx
Type: Client component (memo)
Purpose: Renders a single niotepad entry.

Props: {
  entry: NiotepadEntryData;
  onSeek?: (timestampSec: number) => void;
  onStartEdit: (id: string) => void;
}

Responsibilities:
  - Render entry content via ReactMarkdown (nio-markdown class)
  - Video entries: clickable "Lecture Title -- MM:SS" header + summary body
  - Code entries: syntax-highlighted code block
  - Click-to-edit: switches to inline textarea
  - Swipe-to-delete: horizontal drag gesture reveals delete strip
  - Entry text sits on ruled lines (line-height: 24px alignment)
  - No source badges, no hover action buttons -- pure notepad aesthetic

Variants by source:
  manual  -> plain text, rendered with markdown
  code    -> content wrapped in markdown code fences, syntax highlighted
  video   -> header link + AI summary text
  chat    -> plain text (user-selected excerpt from chat)
```

### 4.10 NiotepadComposer

```
File: src/ui/niotepad/NiotepadComposer.tsx
Type: Client component
Purpose: Always-visible textarea at the bottom of the scroll area.

Props: {
  onSubmit: (content: string) => void;
  ref: React.Ref<HTMLTextAreaElement>;
  entryCount: number;
}

Responsibilities:
  - Borderless textarea that blends with ruled paper
  - Placeholder: "Write a note..." (only when page has zero entries)
  - Enter = submit, Shift+Enter = newline
  - Auto-resize height based on content
  - Large min-height (240px) so the paper feel extends below content
```

### 4.11 NiotepadResizeHandle

```
File: src/ui/niotepad/NiotepadResizeHandle.tsx
Type: Client component
Purpose: Bottom-right corner grip for resizing the panel.

Props: {
  onResize: (deltaX: number, deltaY: number) => void;
}

Responsibilities:
  - Visual: 3-line diagonal grip icon in bottom-right corner
  - Pointer events: track pointermove delta, call onResize
  - cursor: nwse-resize
  - Constrain to min/max dimensions
```

### 4.12 NiotepadPill

```
File: src/ui/niotepad/NiotepadPill.tsx
Type: Client component
Purpose: "N" pill button in TopNav to toggle the niotepad panel.

Props: {
  hasUnread: boolean;
  onClick: () => void;
}

Responsibilities:
  - Render "N" character in a pill-shaped button
  - Match visual style of existing LayoutPresetToggle buttons
  - Unread dot indicator when entries pushed while panel was closed
  - Active state when panel is open

Visual:
  [ N ] (rounded-full, h-7 w-7, matches layout toggle sizing)
  [ N. ] (with small accent dot when hasUnread is true)
```

---

## 5. Interaction Design

### 5.1 Opening the Panel

| Trigger | Description |
|---------|-------------|
| `Cmd/Ctrl+J` | Global keyboard shortcut. `J` for "journal." Does not conflict with any browser shortcut. Fires `togglePanel()` on the store. |
| Click N pill | Click the N pill button in TopNav. Fires `togglePanel()`. |
| Corner gesture | **Deferred to v2.** Swipe from bottom-right corner of viewport. |

**Open animation:**

```
Initial state:  scale(0.92), opacity(0), y(+12px)
Final state:    scale(1), opacity(1), y(0)
Transition:     type: "spring", stiffness: 400, damping: 28, mass: 0.8
Duration:       ~300ms (spring settles)
```

### 5.2 Closing the Panel

| Trigger | Description |
|---------|-------------|
| ESC key | Only when panel has focus (focus trap active). Fires `closePanel()`. |
| Click outside | Click on `NiotepadBackdrop`. Fires `closePanel()`. |
| Click X button | Close button in `NiotepadDragHandle`. Fires `closePanel()`. |
| `Cmd/Ctrl+J` | Toggle -- closes if open. |
| Drag-to-dismiss | **Deferred to v2.** Fling panel downward past threshold. |

**Close animation:**

```
Final state:    scale(0.95), opacity(0), y(+8px)
Transition:     type: "spring", stiffness: 500, damping: 30, mass: 0.6
Duration:       ~200ms (faster than open -- feels snappier)
```

### 5.3 Writing a Note (Manual Entry)

1. User opens panel via any trigger
2. Focus is trapped inside panel
3. User clicks anywhere on the ruled paper below existing entries
4. Focus jumps to the `NiotepadComposer` textarea
5. User types their note
6. **Enter** submits the note as a new entry
7. **Shift+Enter** inserts a newline (for multi-line notes)
8. Entry appears at the bottom of the list with a subtle fade-in animation
9. Scroll area auto-scrolls to show the new entry

### 5.4 Editing an Entry

1. User clicks on any rendered entry text
2. Entry switches to inline edit mode: textarea replaces rendered markdown
3. Textarea auto-focuses with cursor at end of content
4. **Enter** saves the edit
5. **Esc** cancels the edit (restores original content)
6. **Blur** (click away) saves the edit
7. Entry re-renders with updated content

### 5.5 Deleting an Entry (Swipe-to-Delete)

**Touch devices:**
1. User swipe-lefts on an entry
2. Entry slides left, revealing a red delete strip behind it
3. If swipe exceeds 80px threshold, entry is deleted on release
4. If swipe does not exceed threshold, entry snaps back

**Desktop (mouse drag):**
1. User holds pointer down on entry and drags left
2. Same reveal/threshold behavior as touch
3. cursor changes to `grabbing` during drag

**Animation:**
```
Swipe reveal:  translateX tracks pointer, spring back on release
Delete:        height collapses to 0, opacity fades, 200ms spring
Threshold:     80px horizontal displacement
```

**Fallback delete:** Each entry also has a small X button that appears on hover
in the top-right corner (for accessibility and discoverability).

### 5.6 Dragging the Panel

1. User grabs the `NiotepadDragHandle` (top bar)
2. Panel follows pointer with `drag` prop on Framer Motion `motion.div`
3. Drag is constrained to viewport edges (16px padding from viewport)
4. On release, panel snaps to the nearest edge if within 24px of edge
5. Final position persisted to localStorage

```
dragConstraints: ref to viewport container
dragElastic: 0.05  (very slight rubber-band feel at edges)
dragMomentum: false (panel stops where you release -- no fling)
```

### 5.7 Resizing the Panel

1. User grabs the `NiotepadResizeHandle` (bottom-right corner grip)
2. Panel width/height change with pointer movement
3. Constrained to min 320x360, max 640x800
4. Ruled lines and content reflow live during resize
5. Final dimensions persisted to localStorage

### 5.8 Keyboard Shortcuts (Complete Map)

| Shortcut | Context | Action |
|----------|---------|--------|
| `Cmd/Ctrl+J` | Global (workspace) | Toggle niotepad panel open/close |
| `Esc` | Panel has focus | Close panel |
| `Enter` | Composer focused | Submit entry |
| `Shift+Enter` | Composer focused | Newline in composer |
| `Enter` | Editing entry | Save edit |
| `Esc` | Editing entry | Cancel edit |
| `Cmd/Ctrl+Shift+N` | Code/Chat/Video pane | Push selection to niotepad |
| `Tab` | Panel has focus | Cycle through focusable elements |
| `Shift+Tab` | Panel has focus | Reverse cycle |
| `Cmd/Ctrl+F` | Panel has focus | Focus search input |
| `ArrowLeft` | Page nav focused | Previous page |
| `ArrowRight` | Page nav focused | Next page |

**Note on `Cmd+N`:** This shortcut is reserved by all major browsers (opens new
window) and **cannot** be overridden by web applications. We use `Cmd+J` instead,
which is available in Chrome, Firefox, and Safari without conflict.

### 5.9 Push-to-Niotepad Interactions

Documented in detail in [Section 8: Push Mechanics](#8-push-mechanics).

---

## 6. State Management

### 6.1 Store Schema

```typescript
// File: src/infra/niotepad/useNiotepadStore.ts

import { create } from "zustand";

type NiotepadPanelState = {
  /** Whether the floating panel is visible. */
  isOpen: boolean;

  /** Panel geometry (persisted to localStorage). */
  geometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Active page ID (lecture-scoped). Null = "All" view. */
  activePageId: string | null;

  /** Search query (ephemeral -- not persisted). */
  searchQuery: string;

  /** Active source filters. Empty array = show all. */
  sourceFilters: NiotepadEntrySource[];

  /** Whether the search bar is expanded. */
  isSearchExpanded: boolean;

  /** Badge state: true when entries were pushed while panel was closed. */
  hasUnread: boolean;
};

type NiotepadDataState = {
  /** All pages (one per lecture + a "manual" page for unsorted notes). */
  pages: NiotepadPage[];

  /** Whether data has been loaded from IndexedDB. */
  isLoaded: boolean;

  /** Currently editing entry ID, or null. */
  editingEntryId: string | null;
};

type NiotepadActions = {
  // Panel
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  updateGeometry: (partial: Partial<NiotepadPanelState["geometry"]>) => void;

  // Pages
  setActivePage: (pageId: string | null) => void;
  createPage: (lectureId: string, lectureTitle: string) => string;
  getOrCreatePage: (lectureId: string, lectureTitle: string) => string;

  // Entries
  addEntry: (params: AddEntryParams) => string;
  updateEntry: (id: string, updates: Partial<Pick<NiotepadEntryData, "content">>) => void;
  deleteEntry: (id: string) => void;

  // Search
  setSearchQuery: (query: string) => void;
  toggleSourceFilter: (source: NiotepadEntrySource) => void;
  toggleSearchExpanded: () => void;

  // Edit mode
  setEditingEntry: (id: string | null) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  clearPage: (pageId: string) => void;

  // Badge
  markRead: () => void;
};
```

### 6.2 Derived Selectors

```typescript
// Computed views -- not stored, derived from state

/** All entries for the active page, filtered by search query and source filters. */
function selectFilteredEntries(state: NiotepadStore): NiotepadEntryData[] {
  const page = state.activePageId
    ? state.pages.find(p => p.id === state.activePageId)
    : null;

  // "All" view: flatten all pages
  const entries = page
    ? page.entries
    : state.pages.flatMap(p => p.entries);

  // Apply source filter
  const filtered = state.sourceFilters.length > 0
    ? entries.filter(e => state.sourceFilters.includes(e.source))
    : entries;

  // Apply search query
  if (!state.searchQuery.trim()) return filtered;

  const query = state.searchQuery.trim().toLowerCase();
  return filtered.filter(e =>
    e.content.toLowerCase().includes(query) ||
    e.metadata.lectureTitle?.toLowerCase().includes(query)
  );
}

/** Total entry count across all pages (for badge display). */
function selectTotalEntryCount(state: NiotepadStore): number {
  return state.pages.reduce((sum, p) => sum + p.entries.length, 0);
}

/** Entry count for the active page. */
function selectActivePageEntryCount(state: NiotepadStore): number {
  if (!state.activePageId) return selectTotalEntryCount(state);
  const page = state.pages.find(p => p.id === state.activePageId);
  return page?.entries.length ?? 0;
}
```

### 6.3 Persistence Strategy

**Entry data** (pages + entries):
- Stored in IndexedDB database `niotebook-niotepad`, object store `notebooks`
- Key: fixed string `"notebook-v1"` (single notebook per user for now)
- Value: JSON-serialized `{ pages: NiotepadPage[], version: 1 }`
- Auto-save: 500ms debounce after any mutation (same as `feat/niotepad`)

**Panel geometry** (position + size):
- Stored in `localStorage` key `"niotebook.niotepad.geometry"`
- Value: JSON `{ x, y, width, height }`
- Written on drag-end and resize-end (not during drag -- too frequent)

**Panel open state:**
- **Not persisted.** Panel starts closed on each page load.
- Rationale: An auto-opening panel on workspace load would be disorienting.

**Unread badge:**
- Stored in `localStorage` key `"niotebook.niotepad.unread"`
- Value: `"true"` or absent
- Cleared when panel is opened

---

## 7. Entry Types & Data Model

### 7.1 Core Types

```typescript
// File: src/domain/niotepad.ts

/** Sources from which entries can be pushed. */
type NiotepadEntrySource = "manual" | "code" | "chat" | "video";

/** Metadata attached to each entry depending on source. */
type NiotepadEntryMetadata = {
  /** Chat message ID if pushed from AiPane. */
  chatMessageId?: string;

  /** File path if pushed from CodePane. */
  filePath?: string;

  /** Programming language if pushed from CodePane. */
  language?: string;

  /** Transcript time range if from video bookmark. */
  transcriptRange?: [startSec: number, endSec: number];

  /** Code snapshot hash at capture time. */
  codeHash?: string;

  /** Lecture title at push time (self-contained for offline rendering). */
  lectureTitle?: string;

  /** Lecture number at push time. */
  lectureNumber?: number | null;
};

/** A single niotepad entry. */
type NiotepadEntryData = {
  /** Unique ID (nanoid). */
  id: string;

  /** How this entry was created. */
  source: NiotepadEntrySource;

  /** Markdown content. Always editable. */
  content: string;

  /** Unix ms -- when the entry was first created. */
  createdAt: number;

  /** Unix ms -- last edit time. */
  updatedAt: number;

  /** Video position at capture time (null for manual entries). */
  videoTimeSec: number | null;

  /** The page (lecture) this entry belongs to. */
  pageId: string;

  /** Source-specific metadata. */
  metadata: NiotepadEntryMetadata;
};

/** A page in the notebook, scoped to a lecture. */
type NiotepadPage = {
  /** Unique page ID (nanoid). */
  id: string;

  /** The lessonId this page is scoped to. */
  lessonId: string;

  /** Human-readable label (e.g., "Lecture 3: Algorithms"). */
  title: string;

  /** Lecture number for ordering. Null for "General" page. */
  lectureNumber: number | null;

  /** Entries on this page, ordered chronologically. */
  entries: NiotepadEntryData[];

  /** Unix ms -- when this page was created. */
  createdAt: number;
};

/** Top-level persistence snapshot. */
type NiotepadSnapshot = {
  pages: NiotepadPage[];
  version: 1;
};
```

### 7.2 AddEntryParams

```typescript
/** Parameters for creating a new entry (ID and timestamps are auto-generated). */
type AddEntryParams = {
  source: NiotepadEntrySource;
  content: string;
  pageId: string;
  videoTimeSec: number | null;
  metadata: NiotepadEntryMetadata;
};
```

### 7.3 Entry Content Formats by Source

| Source | Content Format | Example |
|--------|---------------|---------|
| `manual` | Raw text or markdown | `"Remember: Big-O is about worst case"` |
| `code` | Markdown code fence with language tag | ````\`\`\`python\nfor i in range(10):\n    print(i)\n\`\`\```` |
| `chat` | Plain text (user-selected excerpt) | `"The key insight is that merge sort divides..."` |
| `video` | AI-generated 1-2 sentence summary | `"Professor Malan introduces hash tables as a data structure..."` |

---

## 8. Push Mechanics

### 8.1 Push from CodePane

**Trigger:** User selects code in the editor and presses `Cmd/Ctrl+Shift+N`,
or clicks a "Push to N" button that appears in the editor toolbar on selection.

**Flow:**

```
1. User selects code in CodeMirror editor
2. Selection detected via CodeMirror's view.state.selection
3. Push action triggered (keyboard shortcut or button)
4. Selected text extracted
5. Wrapped in markdown code fence: ```{language}\n{code}\n```
6. Entry created:
   {
     source: "code",
     content: "```python\nfor i in range(10):\n    print(i)\n```",
     pageId: currentPageId,           // auto-resolved from active lessonId
     videoTimeSec: currentVideoTime,   // snapshot of current video position
     metadata: {
       filePath: activeFilePath,       // e.g., "/project/main.py"
       language: activeLanguage,       // e.g., "python"
       codeHash: codeSnapshot?.codeHash
     }
   }
7. If panel is closed, set hasUnread = true (badge appears on N pill)
8. If panel is open, scroll to new entry with highlight pulse
```

**Integration point:** `src/ui/panes/CodePane.tsx` -- add push handler that reads
from `useEditorStore` and `useFileSystemStore`.

### 8.2 Push from AiPane (Chat)

**Trigger:** User selects text within a chat message, then clicks the floating
"Push to N" tooltip or presses `Cmd/Ctrl+Shift+N`.

**Flow:**

```
1. User selects text in a ChatMessage component
2. useSelectionPush hook detects selection within chat container
3. Floating tooltip appears near selection end
4. User clicks tooltip or presses shortcut
5. Selected text extracted via window.getSelection().toString()
6. Entry created:
   {
     source: "chat",
     content: selectedText,
     pageId: currentPageId,
     videoTimeSec: currentVideoTime,
     metadata: {
       chatMessageId: parentMessage.id
     }
   }
7. Badge/scroll behavior as above
8. Tooltip shows brief checkmark confirmation, then hides
9. Browser selection is cleared
```

**Integration point:** Reuse `src/ui/chat/useSelectionPush.ts` from `feat/niotepad`
with minimal adaptation (update store import path).

### 8.3 Push from VideoPane

**Trigger:** User clicks a "pin" or "bookmark" icon in the VideoPane header area.

**Flow:**

```
1. User clicks pin/bookmark button in VideoPane header
2. Current video timestamp captured
3. Entry created immediately with placeholder:
   {
     source: "video",
     content: "Summarizing...",
     pageId: currentPageId,
     videoTimeSec: currentTimeSec,
     metadata: {
       lectureTitle: "Lecture 3: Algorithms",
       lectureNumber: 3,
       transcriptRange: [currentTimeSec - 15, currentTimeSec + 15]
     }
   }
4. Async API call: POST /api/nio/summarize
   Body: { lessonId, timeSec: currentTimeSec }
5. Server fetches +-15s transcript window, sends to Gemini Flash
6. Returns 1-2 sentence summary
7. Entry updated: content = AI summary text
8. Fallback if AI fails: content = "Video moment bookmarked"
```

**Integration point:** `src/ui/panes/VideoPane.tsx` -- add pin button in header,
reuse `/api/nio/summarize` route from `feat/niotepad`.

### 8.4 Push Notification (Badge)

When an entry is pushed and the panel is **closed**:

1. `hasUnread` flag set to `true` in store
2. Persisted to `localStorage("niotebook.niotepad.unread")`
3. `NiotepadPill` renders a small accent-colored dot indicator
4. On next `openPanel()`, `markRead()` is called, flag cleared

---

## 9. Page Navigation

### 9.1 Page Model

Each page corresponds to a **lecture (lesson)**. Pages are auto-created when:

1. The user writes a manual note while a specific lesson is active
2. A push action occurs from any pane for a specific lesson
3. The user navigates to a new lesson and interacts with niotepad

```
Page creation: getOrCreatePage(lessonId, lectureTitle)
  - Checks if a page with this lessonId already exists
  - If yes, returns existing page ID
  - If no, creates new page with title derived from lesson metadata
```

### 9.2 Page Tab UI

The `NiotepadPageNav` renders as a horizontal tab strip below the drag handle:

```
+---+------+------+------+------+------+---+
| < | All  |  L1  | *L3* |  L5  |  L7  | > |
+---+------+------+------+------+------+---+
```

- **"All" tab:** Shows entries from all pages in chronological order
- **Lecture tabs:** Ordered by `lectureNumber` (ascending)
- **Active tab:** Accent underline indicator + bold text
- **Overflow:** Left/right scroll arrows appear when tabs exceed container width
- **Tab content:** Abbreviated lecture label (e.g., "L3" for "Lecture 3")
- **Tooltip on hover:** Full lecture title

### 9.3 Page Switching Behavior

1. Click a page tab -> `setActivePage(pageId)` fires
2. Scroll area shows entries for that page only
3. Composer focus moves to the active page's context
4. Search query is preserved across page switches (filters within new page)
5. Animation: content fades out (80ms) and fades in (120ms) with slight y-shift

### 9.4 "All" View

When `activePageId` is `null`:
- Entries from all pages are shown in chronological order
- Each entry displays a subtle page/lecture label above it
- Composer submits to the page matching the current workspace lesson
- Search operates across all pages

---

## 10. Search & Filter

### 10.1 Search Algorithm

```typescript
function searchEntries(
  entries: NiotepadEntryData[],
  query: string,
): NiotepadEntryData[] {
  if (!query.trim()) return entries;

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return entries.filter(entry => {
    const searchable = [
      entry.content,
      entry.metadata.lectureTitle ?? "",
      entry.metadata.filePath ?? "",
      entry.metadata.language ?? "",
    ].join(" ").toLowerCase();

    // All terms must match (AND logic)
    return terms.every(term => searchable.includes(term));
  });
}
```

- **Debounce:** 200ms after last keystroke before filtering
- **Highlight:** Matching text segments are highlighted with `<mark>` tags
  (accent background at 20% opacity)
- **No results:** Show centered message "No notes match your search"

### 10.2 Filter Categories

| Filter | Matches | Chip Label |
|--------|---------|------------|
| (none) | All entries | "All" |
| `code` | `source === "code"` | "Code" |
| `chat` | `source === "chat"` | "Chat" |
| `video` | `source === "video"` | "Video" |
| `manual` | `source === "manual"` | "Notes" |

- Filters are toggleable chips below the search input
- Multiple filters can be active simultaneously (OR logic between filters)
- Active filter chips use accent background, inactive use surface-muted

### 10.3 Search UI Placement

The search icon sits at the right end of the page nav bar. Clicking it expands
the search input, which pushes the page tabs to collapse if needed:

```
Collapsed:  [All] [L1] [L3*] [L5] [L7]  [magnifier]
Expanded:   [All] [L3*]  [____search query____] [x]
            [All] [Code] [Chat] [Video] [Notes]     <-- filter chips row
```

---

## 11. Animation Specification

### 11.1 Panel Open

```typescript
const panelOpenAnimation = {
  initial: { scale: 0.92, opacity: 0, y: 12 },
  animate: { scale: 1, opacity: 1, y: 0 },
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 28,
    mass: 0.8,
  },
};
```

### 11.2 Panel Close

```typescript
const panelCloseAnimation = {
  exit: { scale: 0.95, opacity: 0, y: 8 },
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 30,
    mass: 0.6,
  },
};
```

### 11.3 Entry Appear

```typescript
const entryAppearAnimation = {
  initial: { opacity: 0, y: 8, height: 0 },
  animate: { opacity: 1, y: 0, height: "auto" },
  transition: {
    type: "spring",
    stiffness: 350,
    damping: 25,
    mass: 0.5,
    // Stagger: height animates first, then opacity+y
    opacity: { delay: 0.05 },
    y: { delay: 0.05 },
  },
};
```

### 11.4 Entry Delete (Swipe)

```typescript
const entryDeleteAnimation = {
  // During swipe: translateX follows pointer
  drag: "x",
  dragConstraints: { left: -120, right: 0 },
  dragElastic: 0.2,

  // On release past threshold:
  exit: {
    x: -300,
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      opacity: { duration: 0.15 },
      height: { delay: 0.1, duration: 0.2 },
    },
  },
};
```

### 11.5 Page Switch

```typescript
const pageSwitchAnimation = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.15, ease: "easeInOut" },
};
```

### 11.6 Search Expand/Collapse

```typescript
const searchExpandAnimation = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "100%", opacity: 1 },
  exit: { width: 0, opacity: 0 },
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 30,
  },
};
```

### 11.7 Push Highlight Pulse

When a new entry appears (via push from another pane):

```typescript
const pushHighlightAnimation = {
  initial: { backgroundColor: "var(--accent-muted)" },
  animate: { backgroundColor: "transparent" },
  transition: { duration: 1.5, ease: "easeOut" },
};
```

### 11.8 Reduced Motion

All animations must respect `prefers-reduced-motion`:

```typescript
// Framer Motion handles this automatically with:
const shouldReduceMotion = useReducedMotion();

// If true, all transitions become instant (duration: 0)
// Spring animations become simple opacity fades
```

---

## 12. Accessibility

### 12.1 ARIA Roles & Attributes

```html
<!-- Portal backdrop -->
<div role="presentation" aria-hidden="true" />

<!-- Panel container -->
<aside
  role="dialog"
  aria-modal="true"
  aria-label="Niotepad -- personal notes"
  aria-describedby="niotepad-description"
>
  <p id="niotepad-description" class="sr-only">
    A floating notebook for capturing notes from video lectures,
    code exercises, and AI chat conversations.
  </p>
  ...
</aside>

<!-- Page navigation -->
<nav aria-label="Notebook pages">
  <div role="tablist" aria-label="Lecture pages">
    <button role="tab" aria-selected="true" aria-controls="page-panel-l3">
      Lecture 3
    </button>
    ...
  </div>
</nav>

<!-- Scroll area (page content) -->
<div role="tabpanel" id="page-panel-l3" aria-label="Lecture 3 notes">
  ...
</div>

<!-- Individual entries -->
<article aria-label="Note entry">
  <div role="button" tabindex="0" aria-label="Click to edit this note">
    {rendered content}
  </div>
</article>

<!-- Search -->
<search>
  <input
    type="search"
    aria-label="Search notes"
    aria-describedby="search-results-count"
  />
  <p id="search-results-count" class="sr-only" aria-live="polite">
    {count} results found
  </p>
</search>

<!-- Composer -->
<textarea
  aria-label="Write a new note"
  aria-describedby="composer-instructions"
/>
<p id="composer-instructions" class="sr-only">
  Press Enter to save your note. Press Shift+Enter for a new line.
</p>
```

### 12.2 Focus Management

**On open:**
1. Store the currently focused element (`document.activeElement`)
2. Move focus to the first focusable element inside the panel (search or composer)
3. Activate focus trap: Tab/Shift+Tab cycle within panel

**On close:**
1. Restore focus to the previously focused element
2. Deactivate focus trap

**Focus trap implementation:** Manual implementation matching the pattern in
`src/ui/shell/TopNav.tsx:200-236` (the ControlCenterDrawer focus trap). Query
focusable elements, intercept Tab at boundaries.

### 12.3 Keyboard Navigation Map

```
Tab order within panel:
  1. Close button (X)
  2. Export button
  3. Page tabs (left to right)
  4. Search toggle button
  5. Search input (if expanded)
  6. Filter chips (if search expanded)
  7. Entry list (each entry is a tab stop)
  8. Composer textarea
  -> wraps back to 1
```

### 12.4 Screen Reader Considerations

- New entries announce via `aria-live="polite"` region
- Search result count announces via `aria-live="polite"`
- Page switches announce via `aria-live="polite"`: "Showing Lecture 3 notes"
- Delete actions announce: "Note deleted"
- Push confirmations: screen reader announce "Note added to niotepad"

### 12.5 Color Contrast

All text within the panel must meet WCAG 2.1 AA:
- Normal text (14px): minimum 4.5:1 contrast ratio
- Large text (18px+): minimum 3:1 contrast ratio
- The glassmorphism background must be opaque enough to maintain contrast
- Glass opacity of 78% with `var(--surface)` base ensures sufficient contrast

---

## 13. Performance

### 13.1 Render Optimization

**Memoization strategy:**

```
NiotepadPanel          -- memo: no (root, reads store)
  NiotepadDragHandle   -- memo: yes (only re-renders on title/count change)
  NiotepadPageNav      -- memo: yes (only re-renders on pages/activePageId change)
  NiotepadSearch       -- memo: yes (only re-renders on query/filters change)
  NiotepadScrollArea   -- memo: no (children change frequently)
    NiotepadEntry[]    -- memo: yes, keyed by entry.id + entry.updatedAt
    NiotepadComposer   -- memo: no (controlled textarea, renders on every keystroke)
  NiotepadResizeHandle -- memo: yes (static, only pointer events)
```

### 13.2 Virtualization

For long entry lists (>50 entries per page), use a windowed rendering approach:

- **Threshold:** If a page has fewer than 50 entries, render all entries normally
- **If above threshold:** Implement a simple "render only visible + 10 above/below"
  approach using `IntersectionObserver`
- **No external dependency:** Avoid pulling in `react-virtuoso` or `tanstack-virtual`
  for this feature. A lightweight custom solution is sufficient given the
  fixed-height-ish nature of entries (they are variable but bounded).

**Implementation sketch:**

```typescript
function useVisibleEntries(
  entries: NiotepadEntryData[],
  scrollRef: RefObject<HTMLDivElement>,
  bufferCount: number = 10,
): NiotepadEntryData[] {
  // If fewer than 50, return all
  if (entries.length < 50) return entries;

  // Otherwise, use IntersectionObserver to track which entries are near viewport
  // Return entries within visible range + buffer
  // ...
}
```

### 13.3 Lazy Loading

- **ReactMarkdown + plugins:** Dynamically imported (`next/dynamic`) since they
  are only needed when the panel is open
- **Framer Motion:** Already tree-shaken; only `motion`, `AnimatePresence`,
  `useReducedMotion`, `useDragControls` are imported
- **Panel code:** The entire `src/ui/niotepad/` module is lazy-loaded when the
  panel is first opened (not on workspace page load)

```typescript
// In NiotepadProvider.tsx:
const NiotepadPortal = dynamic(
  () => import("./NiotepadPortal"),
  { ssr: false }
);
```

### 13.4 Animation Performance

- All animations use `transform` and `opacity` only (GPU-composited)
- `backdrop-filter: blur(12px)` is applied to a single element (the panel)
- No `backdrop-filter` on entries, scroll area, or children
- Drag movements use Framer Motion's hardware-accelerated transforms
- Resize does NOT animate -- direct style updates via `requestAnimationFrame`

### 13.5 IndexedDB Performance

- Read: single `get` call on panel first open (cached in Zustand store)
- Write: debounced at 500ms, single `put` call for the entire notebook snapshot
- Snapshot size estimate: 100 entries x 500 bytes avg = ~50KB (well within IDB limits)
- No IndexedDB read/write during drag, resize, or scroll

---

## 14. Implementation Phases

### Phase 1: Foundation (Store + Domain + Persistence)

**Goal:** Data layer ready, zero UI.

**Deliverables:**
- `src/domain/niotepad.ts` -- types (page model, entry data, metadata)
- `src/infra/niotepad/useNiotepadStore.ts` -- Zustand store with full CRUD
- `src/infra/niotepad/indexedDbNiotepad.ts` -- IndexedDB persistence
- `src/infra/niotepad/niotepadSelectors.ts` -- derived selectors

**Files created:** 4
**Files modified:** 0
**Tests:** Unit tests for store actions and selectors
**Commit boundary:** `feat(niotepad): add domain types, store, and persistence`

---

### Phase 2: Panel Shell (Portal + Glass + Drag + Resize)

**Goal:** Empty glassmorphic panel that opens, closes, drags, and resizes.

**Deliverables:**
- `src/ui/niotepad/NiotepadProvider.tsx` -- keyboard shortcut + conditional portal
- `src/ui/niotepad/NiotepadPortal.tsx` -- React portal
- `src/ui/niotepad/NiotepadBackdrop.tsx` -- click-outside dismiss
- `src/ui/niotepad/NiotepadPanel.tsx` -- glassmorphism + spring animations
- `src/ui/niotepad/NiotepadDragHandle.tsx` -- top bar with close button
- `src/ui/niotepad/NiotepadResizeHandle.tsx` -- bottom-right resize grip
- `src/ui/niotepad/NiotepadPill.tsx` -- N pill for TopNav
- CSS tokens in `globals.css` -- niotepad-specific custom properties
- Mount `NiotepadProvider` in `AppShell.tsx`
- Add `NiotepadPill` to `TopNav.tsx`

**Files created:** 7
**Files modified:** 3 (`AppShell.tsx`, `TopNav.tsx`, `globals.css`)
**Tests:** Smoke test for panel mount/unmount
**Commit boundary:** `feat(niotepad): add floating glassmorphic panel shell`

---

### Phase 3: Paper + Entries + Composer

**Goal:** Ruled paper background, entry rendering, manual note creation.

**Deliverables:**
- `src/ui/niotepad/NiotepadScrollArea.tsx` -- ruled paper + binder dots
- `src/ui/niotepad/NiotepadEntry.tsx` -- entry rendering (all source types)
- `src/ui/niotepad/NiotepadComposer.tsx` -- inline textarea
- Wire store to panel: entries load from IndexedDB, render on paper
- Click-to-write on paper surface
- Click-to-edit inline (Enter/Esc/Blur)

**Files created:** 3
**Files modified:** 1 (`NiotepadPanel.tsx` -- compose children)
**Tests:** Entry rendering tests, composer submit tests
**Commit boundary:** `feat(niotepad): add ruled paper, entry rendering, and composer`

---

### Phase 4: Swipe-to-Delete

**Goal:** Gesture-based entry deletion.

**Deliverables:**
- Add swipe gesture to `NiotepadEntry.tsx` using Framer Motion drag
- Delete animation (slide out + height collapse)
- Fallback hover X button for non-touch devices
- Haptic feedback hint via CSS (visual feedback only -- no Vibration API)

**Files created:** 0
**Files modified:** 1 (`NiotepadEntry.tsx`)
**Tests:** Swipe threshold test, delete confirmation test
**Commit boundary:** `feat(niotepad): add swipe-to-delete gesture`

---

### Phase 5: Page Navigation

**Goal:** Per-lecture pages with tab navigation.

**Deliverables:**
- `src/ui/niotepad/NiotepadPageNav.tsx` -- horizontal tab bar
- Auto-create pages on entry push (linked to active lessonId)
- "All" view for cross-page browsing
- Page switch animation
- Tab overflow scroll

**Files created:** 1
**Files modified:** 2 (`NiotepadPanel.tsx`, `useNiotepadStore.ts`)
**Tests:** Page creation, page switching, "All" view
**Commit boundary:** `feat(niotepad): add per-lecture page navigation`

---

### Phase 6: Push from Code + Chat + Video

**Goal:** Bidirectional push from all three workspace panes.

**Deliverables:**
- Push from CodePane: selection detection + push handler
- Push from AiPane: reuse `useSelectionPush.ts` + floating tooltip
- Push from VideoPane: pin button + async AI summarization
- Port `/api/nio/summarize` route from `feat/niotepad`
- `NiotepadPill` badge (unread dot)

**Files created:** 1 (`src/app/api/nio/summarize/route.ts`)
**Files modified:** 4 (`CodePane.tsx`, `AiPane.tsx`, `VideoPane.tsx`, `NiotepadPill.tsx`)
**Tests:** Push action tests per source
**Commit boundary:** `feat(niotepad): add bidirectional push from code, chat, and video`

---

### Phase 7: Search & Filter

**Goal:** Find entries by content, filter by source type.

**Deliverables:**
- `src/ui/niotepad/NiotepadSearch.tsx` -- expandable search + filter chips
- Search algorithm with multi-term AND matching
- Match highlighting in entry text
- Result count announcement for screen readers

**Files created:** 1
**Files modified:** 2 (`NiotepadPanel.tsx`, `useNiotepadStore.ts`)
**Tests:** Search algorithm tests, filter combination tests
**Commit boundary:** `feat(niotepad): add search and filter`

---

### Phase 8: Polish & Accessibility

**Goal:** Production-grade accessibility, performance tuning, edge cases.

**Deliverables:**
- Focus trap implementation
- ARIA attributes on all interactive elements
- Screen reader announcements (aria-live regions)
- `prefers-reduced-motion` support verification
- Entry virtualization for long lists (>50 entries)
- Export as Markdown
- Clear page functionality
- Error boundaries around panel

**Files created:** 0
**Files modified:** Multiple (accessibility pass across all niotepad components)
**Tests:** Accessibility audit, keyboard navigation test
**Commit boundary:** `feat(niotepad): accessibility, performance, and polish`

---

### Phase Summary

| Phase | Description | New Files | Modified Files | Estimated Effort |
|-------|-------------|-----------|----------------|------------------|
| 1 | Foundation | 4 | 0 | Small |
| 2 | Panel Shell | 7 | 3 | Medium |
| 3 | Paper + Entries | 3 | 1 | Medium |
| 4 | Swipe-to-Delete | 0 | 1 | Small |
| 5 | Page Navigation | 1 | 2 | Medium |
| 6 | Push Mechanics | 1 | 4 | Large |
| 7 | Search & Filter | 1 | 2 | Medium |
| 8 | Polish | 0 | ~8 | Medium |
| **Total** | | **17** | **~21** | |

---

## 15. File Manifest

### New Files

| File Path | Description |
|-----------|-------------|
| `src/domain/niotepad.ts` | Domain types: entry, page, snapshot, metadata |
| `src/infra/niotepad/useNiotepadStore.ts` | Zustand store: panel state + entry CRUD + persistence |
| `src/infra/niotepad/indexedDbNiotepad.ts` | IndexedDB read/write for notebook snapshots |
| `src/infra/niotepad/niotepadSelectors.ts` | Derived selectors: filtered entries, counts |
| `src/ui/niotepad/NiotepadProvider.tsx` | Keyboard shortcut listener + conditional portal mount |
| `src/ui/niotepad/NiotepadPortal.tsx` | React portal to document.body |
| `src/ui/niotepad/NiotepadBackdrop.tsx` | Click-outside dismiss layer |
| `src/ui/niotepad/NiotepadPanel.tsx` | Main glassmorphic floating panel |
| `src/ui/niotepad/NiotepadDragHandle.tsx` | Top bar: title, grip, close button |
| `src/ui/niotepad/NiotepadResizeHandle.tsx` | Bottom-right resize grip |
| `src/ui/niotepad/NiotepadPill.tsx` | "N" pill trigger for TopNav |
| `src/ui/niotepad/NiotepadPageNav.tsx` | Horizontal page tab bar |
| `src/ui/niotepad/NiotepadSearch.tsx` | Expandable search + filter chips |
| `src/ui/niotepad/NiotepadScrollArea.tsx` | Ruled paper + binder dots scroll container |
| `src/ui/niotepad/NiotepadEntry.tsx` | Individual entry renderer |
| `src/ui/niotepad/NiotepadComposer.tsx` | Inline composer textarea |
| `src/app/api/nio/summarize/route.ts` | Video moment AI summarization endpoint |

### Modified Files

| File Path | Changes |
|-----------|---------|
| `src/ui/shell/AppShell.tsx` | Wrap children with `<NiotepadProvider>` |
| `src/ui/shell/TopNav.tsx` | Add `<NiotepadPill>` to header controls |
| `src/app/globals.css` | Add `--niotepad-*` CSS custom properties |
| `src/ui/panes/CodePane.tsx` | Add push-to-niotepad handler on code selection |
| `src/ui/panes/AiPane.tsx` | Add `useSelectionPush` integration |
| `src/ui/panes/VideoPane.tsx` | Add pin/bookmark button for video push |
| `src/ui/chat/ChatMessage.tsx` | Render selection push tooltip (if not already) |

### Files Explicitly NOT Modified

| File Path | Reason |
|-----------|--------|
| `src/ui/layout/WorkspaceGrid.tsx` | Sacred layout grid -- no niotepad integration |
| `src/ui/layout/LayoutGrid.tsx` | Sacred layout grid -- no changes |
| `src/ui/layout/layoutTypes.ts` | No new layout presets needed |
| `src/ui/layout/LayoutPresetContext.tsx` | No layout state changes |
| `src/ui/layout/LayoutPresetToggle.tsx` | No new toggles (N pill is separate) |

---

## 16. Risk Assessment

### High Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `backdrop-filter` performance on low-end devices | Panel feels sluggish or drops frames | Medium | Detect GPU capability; fall back to solid background (`@supports` query). Limit blur to 12px. Test on 2019-era hardware. |
| Focus trap conflicts with CodeMirror | Keyboard shortcuts in editor stop working when panel is open | Medium | Panel focus trap only activates when panel itself has focus. CodeMirror is in the main DOM tree (outside portal), so Tab will not escape into it. Test extensively with editor open. |
| IndexedDB storage limits on iOS Safari | Data loss after 7 days of inactivity (WebKit eviction) | Low | Display warning in export flow. IndexedDB data is not critical (can be re-captured). Long-term: Convex sync. |
| Z-index conflicts with ControlCenterDrawer | Panel and drawer fight for visibility | Low | ControlCenterDrawer is z-50. Panel is z-50. They should not both be open. Add mutual exclusion: opening drawer closes niotepad, and vice versa. |

### Medium Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Cmd+J conflict with browser "Downloads" shortcut | Firefox uses Cmd+J for Downloads panel | Medium | Firefox intercepts this. Test on Firefox; if blocked, use `Cmd+Shift+J` or `Cmd+.` as fallback. Add settings for custom shortcut in future. |
| Swipe-to-delete accidental triggers | Users accidentally delete entries while scrolling | Medium | Require 80px horizontal threshold. Vertical scroll tolerance: if dy > dx, treat as scroll, not swipe. Add undo toast for 3 seconds after delete. |
| AI summarization latency | Video push entries show "Summarizing..." for too long | Low | Set 8-second timeout. Show progress indicator. Fallback to static bookmark text. |
| Glassmorphism readability in light mode | Text hard to read against bright backgrounds | Low | Glass alpha at 78% with `var(--surface)` base provides strong background. Test with video pane behind panel. Increase alpha if needed. |

### Low Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| nanoid not available as dependency | Build failure | Very Low | nanoid is already in node_modules as transitive dep. If needed, add as direct dependency. |
| ReactMarkdown bundle size | Larger initial chunk | Low | Dynamic import (`next/dynamic`) ensures it loads only when panel opens. |
| Page proliferation | Too many tabs in page nav | Very Low | Courses typically have 10-15 lectures. Tab overflow scroll handles it. |

---

## 17. Open Questions

### Requiring Decision Before Implementation

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **Keyboard shortcut:** `Cmd+J` works in Chrome/Safari but Firefox uses it for Downloads. | A) `Cmd+J` and accept Firefox conflict. B) `Cmd+Shift+J`. C) `Cmd+.` (period). D) Make it configurable. | **B) `Cmd+Shift+J`** -- avoids all known browser conflicts. Or accept `Cmd+J` and note Firefox limitation. |
| 2 | **Mutual exclusion with ControlCenterDrawer:** Should opening one close the other? | A) Yes, mutual exclusion. B) Both can be open simultaneously. | **A) Mutual exclusion.** Two overlays is visually chaotic and confusing. |
| 3 | **Undo on delete:** Should swipe-to-delete show a 3-second undo toast? | A) Yes, with toast. B) No, immediate permanent delete. C) Move to "trash" with periodic cleanup. | **A) Undo toast.** Gestures are error-prone. 3-second window is standard. |
| 4 | **Corner gesture invocation:** Worth implementing in v1? | A) Yes, implement swipe-from-corner. B) Defer to v2. | **B) Defer.** Corner gestures are hard to discover and conflict with OS gestures (macOS Hot Corners, iPad multitasking). Keyboard + pill is sufficient for v1. |
| 5 | **Drag-to-dismiss:** Worth implementing in v1? | A) Yes, fling downward to dismiss. B) Defer to v2. | **B) Defer.** ESC + click-outside + X button provide three dismiss mechanisms already. Fling-to-dismiss is a polish item. |

### Deferred to Post-MVP

| # | Question | Notes |
|---|----------|-------|
| 6 | Convex sync for cross-device persistence | Requires schema addition, auth integration, conflict resolution. Out of scope for v1. |
| 7 | Rich text editing (bold, italic, lists) | Current model: raw text with markdown rendering. Could add toolbar in v2. |
| 8 | Collaborative notes (shared between users) | Requires significant backend work. Not in scope. |
| 9 | Custom niotepad themes/colors | Users pick paper color, line color, etc. Nice-to-have for v2. |
| 10 | Context menu (right-click) on entries | Alternative to hover actions for send-to-chat, insert-to-editor. Deferred until pull actions are redesigned. |

---

## Appendix A: Component Hierarchy Diagram

```
document.body
  |
  +-- #__next (Next.js root)
  |     |
  |     +-- AppShell
  |           |
  |           +-- NiotepadProvider        <-- listens for Cmd+J
  |           |     |
  |           |     +-- TopNav
  |           |     |     +-- NiotepadPill    <-- "N" trigger
  |           |     |     +-- LayoutPresetToggle
  |           |     |     +-- ControlCenterDrawer
  |           |     |
  |           |     +-- WorkspaceShell
  |           |           +-- WorkspaceGrid   <-- UNTOUCHED
  |           |                 +-- VideoPane  (push source)
  |           |                 +-- CodePane   (push source)
  |           |                 +-- AiPane     (push source)
  |
  +-- [Portal: NiotepadPortal]            <-- mounted outside #__next
        |
        +-- NiotepadBackdrop
        |
        +-- NiotepadPanel (motion.aside)
              |
              +-- NiotepadDragHandle
              +-- NiotepadPageNav
              +-- NiotepadSearch (collapsible)
              +-- NiotepadScrollArea
              |     +-- [Binder dots layer]
              |     +-- [Ruled paper background]
              |     +-- NiotepadEntry (x N)
              |     +-- NiotepadComposer
              |
              +-- NiotepadResizeHandle
```

## Appendix B: State Flow Diagram

```
+----------+     Cmd+J / Click Pill      +-----------+
| Panel    | --------------------------> | Panel     |
| Closed   |                             | Open      |
+----+-----+ <------------------------- +-----+-----+
     |         ESC / Click Outside / X         |
     |                                         |
     |  Push from Code/Chat/Video              |  Write / Edit / Delete
     |  (while closed)                         |  (while open)
     v                                         v
+----------+                            +-----------+
| hasUnread|                             | Entry     |
| = true   |                             | CRUD      |
| (badge)  |                             | (store)   |
+----------+                            +-----+-----+
                                               |
                                               | debounce 500ms
                                               v
                                        +-----------+
                                        | IndexedDB |
                                        | persist   |
                                        +-----------+
```

## Appendix C: Z-Index Map

```
Layer                           z-index    Notes
-------------------------------------------------------
Workspace grid                  auto       Normal flow
nio-pattern::before             1          Background grid overlay
AppShell                        2          Relative z-2 (existing)
NiotepadBackdrop                49         Below panel, above workspace
NiotepadPanel                   50         Same level as ControlCenterDrawer
ControlCenterDrawer             50         Existing -- mutual exclusion with niotepad
```

## Appendix D: localStorage Keys

| Key | Value Type | Purpose |
|-----|-----------|---------|
| `niotebook.niotepad.geometry` | `{ x, y, width, height }` | Panel position and size |
| `niotebook.niotepad.unread` | `"true"` or absent | Unread badge state |

**Note:** Entry data is stored in IndexedDB, not localStorage. Panel open/close
state is NOT persisted (panel starts closed).

## Appendix E: CSS Custom Properties Summary

```css
/* Added to globals.css :root */
--niotepad-paper        /* Warm-tinted paper background */
--niotepad-ruled        /* Ruled line color */
--niotepad-margin       /* Left margin line color */
--niotepad-glass-bg     /* Glass panel background */
--niotepad-glass-border /* Glass panel border */

/* Dark theme overrides in [data-theme="dark"] */
/* Same properties with adjusted values */
```

---

*End of plan. This document should provide sufficient detail for a senior
engineer to implement the complete Niotepad Experimental feature without
ambiguity. All CSS values, TypeScript interfaces, animation configs, and
component boundaries are specified.*
