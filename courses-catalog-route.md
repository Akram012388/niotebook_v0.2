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
- Returning users: catalog with a prominent "Resume" card at the top + full catalog below

---

## Resume Card

A highlighted card at the top of the catalog for users with an existing session. Displays granular resume state:

| State | Source | Persistence |
|---|---|---|
| Video timestamp | `frames.videoTimeSec` | Already persisted via `convex/resume.ts → upsertFrame` |
| Editor code + terminal output | `codeSnapshots.code` | Code already persisted via `upsertCodeSnapshot`; terminal output needs new field |
| Chat history | `chatMessages` by `threadId` | Already persisted in Convex |
| Course → Lesson context | `lessonId` query param + `frames.lessonId` | Already tracked |

### Resume Card Display

```
🔄 Continue: [Course Title]
   Lecture [N]: [Lesson Title] — ▶ MM:SS / Total
   Last active: [relative time]
```

The video timestamp shown on the card gives the user instant recognition of where they were.

### What's Already in Place

The codebase already tracks most resume state:
- **`frames` table** — stores `userId`, `lessonId`, `videoTimeSec`, `threadId`, `codeHash`, `updatedAt` (indexed by `userId + lessonId`)
- **`codeSnapshots` table** — stores `userId`, `lessonId`, `language`, `code`, `codeHash`, `updatedAt` (indexed by `userId + lessonId + language`)
- **`chatThreads` + `chatMessages`** — full chat history per user per lesson
- **`lessonCompletions`** — tracks completion status per lesson
- **`convex/resume.ts`** — `getLatestFrame` and `upsertFrame` queries/mutations already exist

### What's Missing for Resume

1. **Terminal output** — not currently persisted. Need a new field on `codeSnapshots` or a sibling table.
2. **"Last active session" query** — need a query that finds the user's most recent `frame` across all lessons (currently `getLatestFrame` is scoped to a single `lessonId`). New query: `getLastActiveFrame` — sort all user frames by `updatedAt` desc, take first.
3. **Course title resolution** — resume card needs course title, which requires joining `frames → lessons → courses`.

---

## Course Catalog Cards

Below the resume card, display all available courses as minimal, expandable cards.

### Collapsed State
- Course title
- Brief description (from `courses.description`)
- Number of lectures
- Progress indicator (if user has started — derived from `lessonCompletions`)

### Expanded State
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
- **AuthGate** (`/workspace`): no changes needed, already handles auth
- **Post-auth redirect**: Change Clerk's `fallbackRedirectUrl` from `/workspace` to `/courses`
- **Resume card click**: navigates to `/workspace?lessonId=<lessonId>`
- **Course card lecture click**: navigates to `/workspace?lessonId=<lessonId>`
- **`/workspace` without `lessonId`**: should redirect to `/courses` (safety net)

### Existing Routing Context
- Workspace currently reads `lessonId` from query string: `useSearchParams().get("lessonId")`
- `WorkspaceGrid` and `TopNav` use `router.replace` with `pathname` to update `lessonId` param (fixed in latest main — was hardcoded to `/`)
- Lesson switching within workspace updates the query param via `TopNav.handleLessonChange`

---

## Access Model

All course content is **free to browse and view**. No paywall on the catalog or course content itself. Paywalls apply only to:
- Excessive AI assistant usage (rate-limited in `rateLimits` table)
- Enhanced code editor features (TBD)

This means the catalog is fully open — no locked cards, no "upgrade to access" friction.

---

## Schema Changes Required

1. **Terminal output on `codeSnapshots`** (optional new field):
   ```
   terminalOutput: v.optional(v.string())
   ```

2. **No new tables needed** — all other data already exists.

---

## New Convex Queries Needed

1. **`getLastActiveFrame`** — returns the user's most recently updated frame across all lessons, joined with lesson + course data for the resume card display.

2. **`getCourseProgress`** — returns completion counts per course for a user (aggregate `lessonCompletions` grouped by course).

---

## Component Breakdown

```
src/app/courses/page.tsx          — Route entry, wraps in AuthGate
src/ui/courses/CourseCatalog.tsx  — Main catalog layout
src/ui/courses/ResumeCard.tsx     — Highlighted resume session card
src/ui/courses/CourseCard.tsx     — Individual course card (collapsed/expanded)
src/ui/courses/LessonList.tsx     — Expanded lecture list within a course card
```

---

## Open Questions

1. **Multiple active sessions?** — If a user has started multiple courses, do we show multiple resume cards or just the most recent one? Recommendation: most recent one as primary, with a subtle "Other active courses" section if applicable.
2. **Empty state** — What does the catalog look like with zero courses? (Shouldn't happen in prod, but worth a design.)
3. **Mobile layout** — Cards stack vertically, resume card stays on top. Anything else?
