# Course Catalog Route — `/courses`

## Problem

After sign-in, users land directly on `/workspace` with no context about *what* they're working on. There's no course selection step, and returning users have no quick way to resume where they left off or browse alternatives.

## Solution

Introduce a `/courses` route as an intermediary between auth and workspace. This route serves as both a course catalog and a session resume surface — always shown, Netflix-style.

---

## Auth Flow (Updated)

```
Landing (/) → Sign In (/sign-in) → Course Catalog (/courses) → Workspace (/workspace?lessonId=...)
```

- First-time users: catalog with course cards
- Returning users: catalog with resume row at top + full catalog below

---

## Page Layout — Netflix Model

The catalog follows the Netflix UX pattern: horizontal scrollable rows, grouped by context.

### Top → Bottom Order

1. **Search bar** — premium, prominent, always visible at the top
2. **Resume row** — horizontal carousel of courses the user has started, ordered by most recently active (left = most recent, right = oldest). Only shown if user has active sessions.
3. **Institution/creator rows** — one row per course provider (e.g. "Harvard CS50", "MIT OpenCourseWare"), each a horizontal carousel of that provider's courses

### Search Bar

- Prominent, high-quality search input at the top of the page
- Searches across course titles, descriptions, lesson titles
- Real-time filtering as user types
- Clean, minimal design — think Netflix/Spotify search, not a basic input field

### Resume Row — "Continue Learning"

A horizontal carousel of course cards the user has previously engaged with, sorted by `frames.updatedAt` descending (most recent first, like phone recent calls or WhatsApp message ordering).

Each resume card shows:

```
[Course Thumbnail/Icon]
[Course Title]
Lecture [N]: [Lesson Title]
▶ MM:SS / Total
Last active: [relative time]
```

- Click → `/workspace?lessonId=<lessonId>` (straight into where they left off)
- Video timestamp displayed on the card for instant recognition
- Horizontal scroll: drag on desktop, swipe on mobile

### Institution Rows — "Harvard CS50", "MIT OCW", etc.

Each course provider/institution/creator gets its own labeled row. Courses within each row are horizontally scrollable.

```
── Harvard CS50 ──────────────────────────────────
[CS50x 2026] [CS50P] [CS50W] [CS50AI] [CS50 SQL] →

── MIT OpenCourseWare ────────────────────────────
[6.006] [6.042] [6.824] →
```

This requires a **grouping field on courses** — see Schema Changes below.

---

## Resume State — What We Track

| State | Source | Persistence |
|---|---|---|
| Video timestamp | `frames.videoTimeSec` | Already persisted via `convex/resume.ts → upsertFrame` |
| Editor code + terminal output | `codeSnapshots.code` | Code already persisted via `upsertCodeSnapshot`; terminal output needs new field |
| Chat history | `chatMessages` by `threadId` | Already persisted in Convex |
| Course → Lesson context | `lessonId` query param + `frames.lessonId` | Already tracked |

### What's Already in Place

- **`frames` table** — stores `userId`, `lessonId`, `videoTimeSec`, `threadId`, `codeHash`, `updatedAt` (indexed by `userId + lessonId`)
- **`codeSnapshots` table** — stores `userId`, `lessonId`, `language`, `code`, `codeHash`, `updatedAt` (indexed by `userId + lessonId + language`)
- **`chatThreads` + `chatMessages`** — full chat history per user per lesson
- **`lessonCompletions`** — tracks completion status per lesson
- **`convex/resume.ts`** — `getLatestFrame` and `upsertFrame` queries/mutations already exist

### What's Missing for Resume

1. **Terminal output** — not currently persisted. Need a new field on `codeSnapshots` or a sibling table.
2. **"All active sessions" query** — need a query that finds all of a user's frames sorted by `updatedAt` desc (currently `getLatestFrame` is scoped to a single `lessonId`). New query: `getActiveFrames` — return all user frames ordered by `updatedAt` desc, joined with lesson + course data.
3. **Course title resolution** — resume cards need course title, which requires joining `frames → lessons → courses`.

---

## Course Cards

Used in both the resume row and institution rows.

### Default State (in institution rows)
- Course title
- Brief description (from `courses.description`)
- Number of lectures
- Progress indicator (if user has started — derived from `lessonCompletions`)
- Institution/creator label

### Expanded State (on click/tap)
- Full lecture list (from `lessons` table, ordered by `order`)
- Per-lecture: title, duration, completion checkmark if applicable
- Click any lecture → navigate to `/workspace?lessonId=<id>`

### Data Source

- `convex/content.ts → getCourses` — already returns all courses
- `convex/content.ts → getLessonsByCourse` — already returns lessons per course
- `convex/lessonCompletions` — already tracks completion per user per lesson

---

## Routing Changes

### New Route
- `src/app/courses/page.tsx` — the catalog page

### Redirect Logic
- **Post-auth redirect**: Change Clerk's `fallbackRedirectUrl` from `/workspace` to `/courses`
- **Resume card click**: navigates to `/workspace?lessonId=<lessonId>`
- **Course card lecture click**: navigates to `/workspace?lessonId=<lessonId>`
- **`/workspace` without `lessonId`**: should redirect to `/courses` (safety net)

### Existing Routing Context
- Workspace currently reads `lessonId` from query string: `useSearchParams().get("lessonId")`
- `WorkspaceGrid` and `TopNav` use `router.replace` with `pathname` to update `lessonId` param
- Lesson switching within workspace updates the query param via `TopNav.handleLessonChange`

---

## Access Model

All course content is **free to browse and view**. No paywall on the catalog or course content itself. Paywalls apply only to:
- Excessive AI assistant usage (rate-limited in `rateLimits` table)
- Enhanced code editor features (TBD)

The catalog is fully open — no locked cards, no "upgrade to access" friction.

---

## Schema Changes Required

1. **Terminal output on `codeSnapshots`** (optional new field):
   ```
   terminalOutput: v.optional(v.string())
   ```

2. **Institution/creator grouping on `courses`** (new fields):
   ```
   institution: v.optional(v.string()),       // e.g. "Harvard", "MIT"
   creator: v.optional(v.string()),           // e.g. "David J. Malan"
   thumbnailUrl: v.optional(v.string()),      // course card image
   ```
   Institution is the primary grouping key for catalog rows. Optional so existing courses don't break — but should be populated for all seeded courses.

3. **No new tables needed** — all other data already exists.

---

## New Convex Queries Needed

1. **`getActiveFrames`** — returns all of a user's frames sorted by `updatedAt` desc, joined with lesson title, course title, and lesson duration. Powers the resume row.

2. **`getCourseProgress`** — returns completion counts per course for a user (aggregate `lessonCompletions` grouped by course).

3. **`getCoursesGroupedByInstitution`** — returns courses grouped by `institution` field, with lesson counts per course. Powers the institution rows.

4. **`searchCourses`** — text search across course titles, descriptions, and lesson titles. Powers the search bar.

---

## Component Breakdown

```
src/app/courses/page.tsx                — Route entry, wraps in AuthGate
src/ui/courses/CourseCatalog.tsx        — Main catalog layout (search + rows)
src/ui/courses/CatalogSearch.tsx        — Search bar component
src/ui/courses/ResumeRow.tsx            — "Continue Learning" horizontal carousel
src/ui/courses/InstitutionRow.tsx       — Per-institution horizontal carousel
src/ui/courses/CourseCard.tsx           — Individual course card (used in all rows)
src/ui/courses/CourseDetail.tsx         — Expanded view with lecture list
src/ui/courses/HorizontalCarousel.tsx   — Shared horizontal scroll/swipe container
```

---

## Alpha Launch Plan

Seeded courses for alpha:
- **CS50x 2026** (already ingested — the gold standard)
- CS50P (Introduction to Programming with Python)
- CS50W (Web Programming with Python and JavaScript)
- CS50AI (Introduction to Artificial Intelligence with Python)
- CS50 SQL (Introduction to Databases with SQL)

All Harvard/CS50, so the initial catalog will have one institution row with multiple courses. Additional institutions added post-alpha.

---

## Design Principles

1. **Steal from Netflix** — horizontal rows, smooth scrolling, visual cards, minimal text
2. **Recency ordering** — most recent activity always surfaces first (resume row)
3. **One click to resume** — returning users should be back in their workspace in a single click
4. **Search is first-class** — prominent, fast, always accessible
5. **Mobile-first responsive** — cards stack vertically on mobile, carousels become swipeable, resume row stays on top
