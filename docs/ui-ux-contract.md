# UI/UX Contract (v0.2)

Status: ACTIVE (binding for builders)
Owner: Akram
Scope: UI structure + interaction behavior (not visual polish)

## Goals

- Minimal, hacker/IDE feel with tight density and sharp geometry.
- Interface feels alive via iconography, hover/active/focus states, and subtle motion.
- Default workflow: Sign in → courses route (carousel) → course detail → workspace (2-col Video | Chat).
- Courses route acts as the user's library: Apple TV+/Netflix-style carousel with resume, CS50 library, and coming-soon rows.
- Course/lecture selection also available in workspace right-side drawer for quick switching.

## Non-goals (for now)

- No chapters/timestamp list UI.
- No transcript UI (transcripts are for AI context only).
- No UI redesign churn mid-implementation; follow this contract.

## Global Layout Modes (desktop)

- Presets:
  - 1-col: 100%
  - 2-col: 60/40 (default after Start)
  - 3-col: 40/30/30
- 1-col behavior:
  - Remembers last focused pane (Video/Code).
  - User can switch panes via:
    - Tabs inside the pane
    - Keyboard shortcuts

## Scrolling (critical)

- Workspace is fixed-viewport (no page scroll).
- Only pane interiors scroll.
- 1-col and 2-col must behave like 3-col (fixed viewport).

## Top Navigation

- Top-left: `niotebook` (all lowercase), no extra text.
- Top-right (always visible):
  - Layout toggle (1/2/3) as icon buttons with aria-labels.
  - Drawer icon (Icon A): panel/sidebar style, ChatGPT-like behavior.
- Avoid text-button clutter in TopNav. Start may remain text if needed.

## Right Drawer (Control Center)

- Opens from TopNav-right icon, slides right -> left.
- Width: 360px.
- Structure: single-column sections.
- Overlay: dim background; click outside closes.
- Motion: 180ms ease-out slide + 120ms overlay fade.
- Keyboard:
  - Esc closes.
  - Focus trapped while open.

### Drawer contents (everything except layout toggle)

- Top tabs: Lectures (default) + Courses.
- Lectures view:
  - Search input.
  - Lecture list rows (Lecture N + title).
  - Selecting a lecture auto-closes the drawer.
- Courses view:
  - Course list rows (title + description + meta).
  - Selecting a course switches to Lectures and auto-selects its first lecture.
- Bottom toggles: User + Settings (toggle replaces content; tap again returns to content).
- Settings view:
  - Theme toggle.
  - Share + Feedback actions (inline cards).
- User view: placeholder panel.

### Selection behavior

- Selecting a course auto-selects the first lecture in that course.

## Pane Composition (desktop)

### 2-col default (60/40)

- Left: Video + compact info strip (license/source/lecture title).
- Right: Chat.

### Pane headers

- Keep pane headers visible for context and actions.

## Visual Language (locked)

- Icons: outline, Phosphor.
- Density: tight.
- Separation: borders-first.
- Radius: sharp.
- Hover/active: subtle highlight + cursor pointer for clickables.
- Focus ring: visible on focus except chat input (intentionally no outline).
- Error states: inline banner inside pane (deferred; finalize at end of phase).
- Spacing scale: 8/12/16. Control center may use tighter spacing to fit content density.
- Typography: keep current sans/mono pairing; no font change required.

Color policy:

- Warm terracotta accent (`--accent: #c15f3c` light / `#da7756` dark) — adopted in Redesign v2.
- Background: `#f4f3ee` (light) / `#1c1917` (dark). Full token system in `src/app/globals.css`.
- Alive feel comes from accent color, contrast, borders, motion, typography, and iconography.

## Keyboard Shortcuts (minimum set)

- `1` / `2` / `3`: switch layout preset (1-col/2-col/3-col).
- `V` / `C`: focus/switch Video / Code (in 1-col mode).
- `Esc`: closes right drawer.

## Video + Data Correctness Contract (P12 dependency)

- Do NOT hardcode YouTube IDs.
- CS50x 2026 canonical source:
  - https://cs50.harvard.edu/x/weeks/
  - https://cs50.harvard.edu/x/weeks/<slug>/ for slug in {0..10, ai}
- From each lecture page, discover:
  - YouTube lecture URL -> extract video ID
  - Official SRT URL -> ingest into transcriptSegments
  - Transcript TXT URL -> metadata only
- Avoid demo links; prefer the lecture "Video -> YouTube" entry.
- Production ingest blocked by default unless `NIOTEBOOK_ALLOW_PROD_INGEST=true`.

## Courses Route (`/courses`)

- Card grid layout, accessible on all viewports. (Note: `CourseCarousel.tsx` was removed during the SiteNav refactor; the carousel approach was replaced by a simpler card grid.)
- Mobile/tablet: browse-only (course cards, descriptions, progress). No video playback, no workspace access.
- Desktop: browse + "Enter Workspace" / "Resume" buttons.
- Rows:
  1. **Continue Learning** (returning users): resume card with course, lecture, timestamp, progress bar.
  2. **Harvard CS50 Library**: horizontal scroll row of course cards (CS50x, CS50P, CS50AI, CS50W, CS50SQL).
  3. **Coming Soon**: greyed-out hardcoded cards (MIT, Stanford, Google, Meta, etc.).
- Course cards: minimalist, title, provider badge, lecture count, progress bar. Hover: scale + shadow.
- Click card → `/courses/[courseId]` detail page.

## Course Detail Page (`/courses/[courseId]`)

- Course header: title, description, provider, license, source URL.
- Progress bar: X/Y lectures completed.
- Lecture list: ordered, title, duration, completion status (checkmark or empty).
- "Resume" button at top → last active lecture + timestamp.
- Per-lecture "Start" → `/workspace?lessonId=X`.

## Sign-In Page

- Clerk card left-aligned (existing).
- Right side: terminal boot sequence animation (monospace, typing effect).
- Lines: `> initializing learning environment...`, `> loading CS50 runtime...`, `> ready.`

## Chat Pane — Learning Pulse Context Strip

- Header strip showing: `Lecture N · MM:SS · filename (modified)`.
- Updates in real-time as video plays and code changes.
- Subtle, non-intrusive; communicates AI context transparency.

## Viewport Policy

- `/` (landing), `/sign-in`, `/sign-up`, `/courses`: all viewports. Mobile browse-only on courses (no video).
- `/workspace`: desktop only (≥1024px). Mobile/tablet shows friendly message.
- `/admin`: desktop only.

## Acceptance Checklist (Phase 3 UX Stabilization)

Must pass in local dev + Vercel preview + Vercel prod:

- Layout toggle changes columns immediately and persists.
- Default Start loads 2-col (Video+Info | Chat).
- Right drawer opens/closes with overlay and focus trap; lecture selection works.
- Video loads and plays a real CS50 lecture (no "video unavailable").
- No player reinitialization/jank due to persistence updates.
- Hover/focus states present and consistent.
- Courses route carousel renders correctly on desktop and mobile.
- Course detail page shows progress and lecture list.
- Sign-in page boot sequence animation renders alongside Clerk card.
- Learning Pulse context strip visible in chat pane header.
- Share and feedback actions in control center are functional.
- Admin console accessible only to admin role.
