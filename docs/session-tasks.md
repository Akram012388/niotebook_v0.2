# UI/UX Contract Deep-Dive (Strict) — Findings

## Blocking issues (contract violations / acceptance blockers)

- Drawer focus trap is missing (explicit contract). You can tab into the page behind the drawer; no aria-modal/focus locking semantics. `src/ui/shell/TopNav.tsx`
- Course selection auto-select-first-lesson is broken (explicit contract) and course switching is effectively pinned when a lesson is selected:
  - `courseId` prefers `lesson.courseId`, so the course `<select>` is controlled by the current lesson.
  - `handleCourseChange()` tries to pick a lesson from `lessonOptions`, but `lessonOptions` is the currently-loaded course’s lessons (stale for the newly selected course), so `updateLesson()` often receives null and does nothing. `src/ui/shell/TopNav.tsx`
- 1-col pane switching does not match the contract text:
  - Contract still says 1-col supports Video/Code/Chat + TopNav segmented control + V/C/A shortcuts in 1-col.
  - Implementation supports only `video|code` in 1-col and no TopNav pane switcher; `A` is not wired for 1-col. `docs/ui-ux-contract.md`, `src/ui/layout/WorkspaceGrid.tsx`, `src/ui/shell/TopNav.tsx`
- Keyboard shortcuts leak into the drawer context:
  - Global `window.keydown` handler blocks only `input`/`textarea`/`contentEditable`, not `<select>`.
  - While focusing a drawer `<select>`, pressing `1/2/3` or `v/c/a` can still change the layout/panes underneath. `src/ui/layout/WorkspaceGrid.tsx`
- Focus ring “always visible” is not guaranteed for all controls:
  - Global `:focus-visible` exists, but `outline-none` on the chat textarea likely overrides it due to CSS specificity, so focus may not be visible there (needs quick manual confirm). `src/app/globals.css`, `src/ui/chat/ChatComposer.tsx`

## Non-blocking issues (polish gaps vs strict contract)

- Drawer motion timing is not implemented (contract asks 180ms slide + 120ms fade). Drawer renders instantly. `src/ui/shell/TopNav.tsx`
- Layout toggle is not “icon buttons with tooltips” per contract:
  - It’s a segmented “1/2/3” control with aria-labels but no explicit tooltip UI (no per-button title). `src/ui/layout/LayoutPresetToggle.tsx`
- Hover/active highlight consistency is partial:
  - Many key buttons/toggles have hover states now, but several drawer controls still lack hover styling (course/lesson `<select>`, theme button, share/feedback/user/settings buttons). `src/ui/shell/TopNav.tsx`
- Spacing scale (8/12/16) not strictly adhered everywhere:
  - Drawer container uses `gap-6` and `py-5` (24/20). `src/ui/shell/TopNav.tsx`
- Error state banners are only partial:
  - Code runtime error has an inline banner; video failures show as a small status line inside the player instead of a pane banner; chat errors not surfaced as inline banners. `src/ui/panes/CodePane.tsx`, `src/ui/video/VideoPlayer.tsx`, `src/ui/panes/AiPane.tsx`
- Icons policy is mostly met (Phosphor in nav), but there are still non-Phosphor glyphs (e.g., send `➜`). `src/ui/chat/ChatComposer.tsx`

## Data correctness re-check (contract)

- Looks compliant: canonical CS50 weeks URLs + slug pages, YouTube ID extracted from discovered URLs (not hardcoded), and prod ingest gated by `NIOTEBOOK_ALLOW_PROD_INGEST=true`. `scripts/ingestCs50x2026.ts`, `convex/ingest.ts`
