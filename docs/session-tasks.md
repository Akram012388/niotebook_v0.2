# UI/UX Contract Deep-Dive (Strict) — Findings

## Blocking issues (contract violations / acceptance blockers)

- ~~Drawer focus trap is missing (explicit contract).~~ (completed)
- ~~Course selection auto-select-first-lesson is broken (explicit contract) and course switching is effectively pinned when a lesson is selected.~~ (completed)
- ~~1-col pane switching does not match the contract text.~~ (completed)
- ~~Keyboard shortcuts leak into the drawer context.~~ (completed)
- ~~Focus ring “always visible” is not guaranteed for all controls.~~ (completed; chat input intentionally has no outline)

## Non-blocking issues (polish gaps vs strict contract)

- ~~Drawer motion timing is not implemented.~~ (completed)
- ~~Layout toggle is not “icon buttons with tooltips” per contract.~~ (completed)
- ~~Hover/active highlight consistency is partial.~~ (completed)
- ~~Spacing scale (8/12/16) not strictly adhered everywhere.~~ (completed; drawer spacing intentionally compact)
- ~~Icons policy: update chat composer send icon to Phosphor and only highlight when input has text.~~ (completed)
- Error state banners are only partial (pending; defer to end of phase).
  - Code runtime error has an inline banner; video failures show as a small status line inside the player instead of a pane banner; chat errors not surfaced as inline banners. `src/ui/panes/CodePane.tsx`, `src/ui/video/VideoPlayer.tsx`, `src/ui/panes/AiPane.tsx`

## Data correctness re-check (contract)

- Looks compliant: canonical CS50 weeks URLs + slug pages, YouTube ID extracted from discovered URLs (not hardcoded), and prod ingest gated by `NIOTEBOOK_ALLOW_PROD_INGEST=true`. `scripts/ingestCs50x2026.ts`, `convex/ingest.ts`

## Control center redesign

- Completed: drawer refactor, tabs, lectures list + search, courses list, settings/user panels, share/feedback cards, contract updates.
