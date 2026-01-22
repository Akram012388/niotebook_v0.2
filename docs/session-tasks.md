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
- Icons policy: update chat composer send icon to Phosphor and only highlight when input has text. `src/ui/chat/ChatComposer.tsx`
- Error state banners are only partial (defer to end of phase).
  - Code runtime error has an inline banner; video failures show as a small status line inside the player instead of a pane banner; chat errors not surfaced as inline banners. `src/ui/panes/CodePane.tsx`, `src/ui/video/VideoPlayer.tsx`, `src/ui/panes/AiPane.tsx`

## Data correctness re-check (contract)

- Looks compliant: canonical CS50 weeks URLs + slug pages, YouTube ID extracted from discovered URLs (not hardcoded), and prod ingest gated by `NIOTEBOOK_ALLOW_PROD_INGEST=true`. `scripts/ingestCs50x2026.ts`, `convex/ingest.ts`

## Control center redesign (next)

### Implementation sequence (atomic, testable milestones)

1. Ingest: fix lecture titles (root cause of “This is CS50”)

- Change: update `scripts/ingestCs50x2026.ts` title parsing to use `og:title` (or `<main>`’s `<h1>`) instead of the sidebar `<h1>`, and normalize:
  - `Week N <topic> - CS50x 2026` → store `<topic>` as `lesson.title` (e.g., Scratch, C, Arrays, …)
  - `Artificial Intelligence - CS50x 2026` → store `Artificial Intelligence`
- Commit: `fix(ingest): extract lecture titles from main content`
- Manual check: re-run ingest once; verify UI now shows distinct lesson titles.

2. Drawer refactor (prep for redesign, preserve behavior)

- Change: extract the drawer UI from `src/ui/shell/TopNav.tsx` into a dedicated component (e.g., `src/ui/shell/ControlCenterDrawer.tsx`) while keeping:
  - open/close, overlay, animation timings, focus trap, Esc close, focus return
- Commit: `refactor(ui): extract control center drawer`
- Manual check: drawer still opens/closes/animates; focus trap still works.

3. Drawer layout redesign skeleton

- Change: replace selects/sections with the new navigation structure:
  - Top content tabs: Lectures (default) + Courses
  - Middle content area (scrollable)
  - Bottom toggles: User + Settings that replace the middle area; tapping again returns to content ("toggle back")
- Commit: `feat(ui): add control center navigation layout`
- Manual check: tabs switch views; bottom toggles show placeholders; toggling back returns to previous content tab.

4. Lectures view: search + list + auto-close on select

- Change:
  - Add small search input at top of Lectures
  - List rows: Lecture <id> + lesson.title (topic), with hover/selected micro-interactions
  - Clicking a lecture: updates lessonId and auto-closes the drawer
- Commit: `feat(ui): add lectures list with search and quick select`
- Manual check: search filters; selecting lecture updates main view and closes drawer.

5. Courses view: list + auto-select first lecture + return to Lectures

- Change:
  - List courses as rows with title + short description + small meta (license/source)
  - Clicking a course sets it active, auto-selects its first lecture, and switches you back to Lectures (drawer stays open)
- Commit: `feat(ui): add courses list to control center`
- Manual check: selecting a course updates the active course + lecture list; first lecture auto-selected; then pick a different lecture.

6. Settings/User panels

- Change:
  - Settings: theme toggle + existing actions (share/feedback) + space for future
  - User: placeholder panel (consistent empty state)
- Commit: `feat(ui): add settings and user panels to control center`
- Manual check: bottom toggles work; theme changes; toggling back restores content.

7. Contract update to match new drawer UX

- Change: update `docs/ui-ux-contract.md` Control Center section to describe tabs, lists, search, auto-close-on-lecture-select, and bottom toggles.
- Commit: `docs: update control center drawer spec`
