# Workspace Polish Plan

Goal: deliver a flat, premium workspace canvas with no layout gaps, square pane frames, and default-min widths for file tree + terminal in 1-pane and 2-pane layouts, without altering runtime logic or internal pane content behavior.

## Task 1: Full-bleed workspace canvas

- Remove workspace padding and max-width so content is flush under the header and to the bottom edge.
- Keep the header layout intact; add a thin divider line between header and workspace.
- Target: `src/ui/shell/AppShell.tsx`.

Acceptance:

- No top/bottom padding between the header and workspace.
- Workspace fills the viewport below the header.
- Header remains unchanged aside from the divider line.

## Task 2: Gapless layouts with hairline dividers

- Remove all `gap-4` spacing between panes in single, split, and triple layouts.
- Add 1px hairline dividers between panes for a minimalist grid feel.
- Maintain internal pane padding; only remove gaps between pane containers.
- Target: `src/ui/layout/WorkspaceGrid.tsx`, `src/ui/layout/LayoutGrid.tsx`.

Acceptance:

- Panes are flush with each other (no visible gaps).
- A subtle 1px divider separates panes.
- No layout spacing appears above, below, or around panes.

## Task 3: Flat, square pane containers

- Remove rounded corners on outer pane containers.
- Remove outer borders to avoid double seams; rely on shared dividers instead.
- Do not change internal pane spacing, headers, or content styles.
- Target: `src/ui/panes/CodePane.tsx`, `src/ui/panes/AiPane.tsx`, `src/ui/panes/VideoPane.tsx`.

Acceptance:

- Pane edges are straight and square.
- Internal pane styling remains intact.
- Only the layout dividers define separation between panes.

## Task 4: Default file tree + terminal width to minimum on load

- Apply minimum-width defaults on initial workspace load, for 1-pane and 2-pane layouts only.
- Use the existing min widths already defined in code.
- Add a once-per-load reset guard (session-based) so manual user resizing is preserved afterward.
- Apply to:
  - File tree split: `src/ui/code/EditorArea.tsx` (file tree sidebar)
  - Terminal split: `src/ui/panes/CodePane.tsx` (editor vs terminal)
  - Split logic: `src/ui/code/useSplitPane.ts` or `src/ui/code/SplitPane.tsx`

Acceptance:

- On first load, file tree and terminal default to their minimum widths.
- Switching to 1-pane or 2-pane respects the min width default on load.
- 3-pane behavior remains unchanged.

## Task 5: Desktop-only workspace overlay

- For viewports below `lg` (<1024px), show a blocking overlay in the workspace route.
- Overlay copy: "niotebook is best experinced on desktop".
- The overlay hides the workspace content underneath without changing routing logic.
- Landing, signin, and signup pages remain unchanged.
- Target: `src/ui/layout/WorkspaceShell.tsx`.

Acceptance:

- Workspace is not accessible on mobile viewports.
- Overlay is visible on small screens and absent on desktop.

## Commit Strategy

- Commit each task as an atomic change set.
- Commit order: Task 1, Task 2, Task 3, Task 4, Task 5.
- Use concise commit messages focused on intent.
