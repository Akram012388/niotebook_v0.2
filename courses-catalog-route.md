# Course Catalog Route — `/courses`

## Problem

After sign-in, users land directly on `/workspace` with no context about *what* they're working on. There's no course selection step, and returning users have no quick way to resume where they left off or browse alternatives.

## Solution

Introduce a `/courses` route as an intermediary between auth and workspace. This route serves as both a course catalog and a session resume surface — always shown, Apple TV+ style.

---

## Design Reference: Apple TV+ (Primary) + Netflix (Secondary)

We're pivoting toward **Apple TV+** as the primary UX reference over Netflix. Apple TV+ delivers a more premium, modern feel — cleaner typography, generous whitespace, cinematic hero billboard, and a refined dark theme that feels high-end rather than cluttered. Netflix's horizontal row pattern is retained for content browsing, but the overall visual identity leans Apple TV+.

### What We Steal from Apple TV+

1. **Hero Billboard with Auto-Advance** — The dominant feature at the top. A large, cinematic auto-sliding carousel showcasing featured/recommended courses. Each slide fills ~60-70% of the viewport height with a stylized course thumbnail or YouTube thumbnail as background. Overlaid: course title (large, bold typography), institution tag, brief tagline, and a prominent "Start Learning" CTA button + a secondary "+" (add to list / bookmark) button. Pagination dots at the bottom. Auto-advances every 6-8 seconds with smooth crossfade transitions. Pauses on hover/touch.

2. **Dark Theme, Premium Feel** — Deep dark background (#0a0a0a or similar), not pure black. Subtle gradient overlays on hero images (bottom fade to background). High contrast white text. Minimal borders — use shadow and elevation instead. Generous padding and whitespace between rows.

3. **Typography Hierarchy** — Large, bold section titles (like "Continue Learning", institution names). Clean sans-serif. The hero slide title should be dramatically large — think movie poster scale. Subtle metadata text in muted gray.

4. **Card Design** — Rounded corners (12-16px radius). On hover: subtle scale-up (1.03-1.05x) with smooth transition + slight shadow elevation. No harsh borders. Thumbnail-driven — the image IS the card, with a gradient overlay at the bottom for text.

### What We Steal from Netflix

1. **Horizontal Scrolling Rows** — Categorized content rows with horizontal scroll. Each row has a label ("Continue Learning", "Harvard CS50", etc.). Scroll via drag, arrow buttons on hover (desktop), or swipe (mobile).

2. **"Continue Watching" Pattern** — The resume row concept. Most recent first, horizontal scroll. Progress indicators visible on cards.

3. **Hover Expand** — On desktop, hovering a card in a row can slightly expand it and show additional metadata (lesson count, progress bar, description snippet). Not a full modal — just an enriched card state.

4. **Algorithmic Row Ordering** — Rows ordered by relevance. Resume row always first (if applicable), then featured/recommended, then institution rows.

### What We Do NOT Copy

- Netflix's cluttered new TV UI with oversized focused items (too much screen real estate per card)
- Auto-playing video trailers on hover (distracting for a learning platform)
- Netflix's aggressive "match %" score (not relevant for education)

---

## Auth Flow (Updated)

```
Landing (/) → Sign In (/sign-in) → Course Catalog (/courses) → Workspace (/workspace?lessonId=...)
```

- First-time users: hero billboard + catalog rows
- Returning users: hero billboard + resume row + catalog rows

---

## Page Layout — Top to Bottom

### 1. Search Bar (Persistent Top)

- Fixed or sticky at the top of the page
- Premium design: large, centered, with subtle glass-morphism or frosted background effect
- Placeholder: "Search courses, lectures, topics..."
- Searches across: course titles, descriptions, lesson titles, institution names
- Real-time filtering as user types — results replace the catalog rows with a filtered grid/list
- Keyboard shortcut: `/` or `Cmd+K` to focus search (power user pattern)
- When active, overlay dims the catalog beneath (Apple TV+ search pattern)
- Clear button + escape to dismiss

### 2. Hero Billboard (Auto-Sliding Carousel)

The crown jewel of the page. A large cinematic auto-advancing carousel taking up the top ~60-70% of the viewport.

**Per Slide:**
- **Background:** Full-bleed course thumbnail or stylized YouTube thumbnail. Apply a cinematic gradient overlay (transparent top → dark bottom) so text is always readable.
- **Content overlay (bottom-left):**
  - Institution badge/tag (e.g. "Harvard CS50") — small, muted
  - Course title — large, bold, cinematic typography
  - One-line tagline/description
  - CTA: "Start Learning" button (primary, prominent) + "+" bookmark button (secondary, circular)
- **Pagination:** Dot indicators at bottom-center. Active dot is wider/highlighted (Apple TV+ style).
- **Behavior:**
  - Auto-advances every 6-8 seconds
  - Smooth crossfade or slide transition (not jarring snap)
  - Pauses on hover (desktop) or touch (mobile)
  - Manual navigation via dots, swipe, or subtle edge arrows
  - Loops infinitely
- **Content source:** Curated/featured courses. At alpha launch, rotate through the CS50 courses.

**Implementation:** Use **Embla Carousel** — lightweight, dependency-free, excellent React support, built-in auto-play plugin, great swipe physics. shadcn/ui's carousel component is built on Embla too, so it's a proven choice. No need for heavy libraries like Swiper.

**Accessibility:**
- Pause auto-advance when user interacts
- `aria-live="polite"` on slide content for screen readers
- Keyboard navigable (arrow keys)
- Respect `prefers-reduced-motion` — disable auto-advance

### 3. Resume Row — "Continue Learning"

Only shown if the user has active sessions (frames in DB).

- Horizontal carousel of course cards, sorted by `frames.updatedAt` descending
- Most recent on the left, oldest on the right (WhatsApp/recent calls ordering)
- Each card shows:
  - Course thumbnail
  - Course title
  - Current lesson: "Lecture [N]: [Title]"
  - Video timestamp: "▶ MM:SS / Total"
  - Relative time: "Last active: 2h ago"
  - Progress bar (thin, at bottom of card — % of course completed based on `lessonCompletions`)
- Click → `/workspace?lessonId=<lessonId>` (instant resume)
- Row label: "Continue Learning" with a ">" chevron (optional "See All" link if many courses)

### 4. Institution Rows — Grouped by Provider

One row per institution/creator. Each row is a horizontal carousel.

```
── Harvard CS50 ──────────────────────────────────
[CS50x 2026] [CS50P] [CS50W] [CS50AI] [CS50 SQL] →
```

**Per Course Card (in institution rows):**
- Course thumbnail (16:9 aspect ratio, rounded corners)
- Course title overlay (bottom, over gradient)
- Lesson count badge (e.g. "24 lectures")
- Progress indicator if user has started (thin bar or ring)
- On hover (desktop): slight scale-up + additional metadata overlay (description snippet, duration, "Continue" or "Start" CTA)

**Row ordering:** Institutions with courses the user has engaged with appear first. Within an institution, started courses appear before unstarted ones.

**Expand behavior:** Clicking a course card either:
- Opens an expanded detail panel (inline, pushing content down — Netflix style), OR
- Navigates to a course detail section/modal with full lecture list

Recommendation: **Inline expansion** (Netflix-style) — click a card, it expands below the row showing the full lecture list with per-lecture details (title, duration, completion status). Click a lecture → `/workspace?lessonId=<id>`. Click elsewhere or press escape to collapse.

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
2. **"All active sessions" query** — need a query that finds all of a user's frames sorted by `updatedAt` desc, joined with lesson + course data. New query: `getActiveFrames`.
3. **Course title resolution** — resume cards need course title, which requires joining `frames → lessons → courses`.

---

## Course Cards — Design Spec

### Thumbnail Strategy
- Primary: YouTube thumbnail from the course's first lesson (already have `videoId` per lesson — construct URL: `https://img.youtube.com/vi/{videoId}/maxresdefault.jpg`)
- Fallback: Styled placeholder with course title + institution branding
- Aspect ratio: **16:9** for hero billboard, **16:9 or 2:3** for row cards (2:3 gives a more Apple TV+ poster feel — decide during implementation)

### Card States
1. **Default** — Thumbnail + title overlay + subtle gradient
2. **Hover** (desktop) — Scale 1.03-1.05x, elevated shadow, metadata overlay appears (description, lesson count, CTA)
3. **Active/Playing** — Progress bar visible, "Continue" label instead of "Start"
4. **Focused** (keyboard navigation) — Visible focus ring, same enrichment as hover

### Card Interactions
- **Click** → Expand inline (institution rows) or navigate to workspace (resume row)
- **Hover** → Enriched metadata overlay (desktop only)
- **Touch** → Tap to expand/navigate (mobile — no hover state)

### Animations
- Scale transitions: `transform: scale(1.04)` with `transition: transform 200ms ease-out`
- Shadow elevation on hover: `box-shadow` transition
- Carousel scroll: Embla's native physics-based drag/swipe
- Hero billboard: crossfade with `opacity` transition (400-600ms)
- Inline expand: `max-height` + `opacity` animation (300ms ease)
- All animations respect `prefers-reduced-motion`

---

## Color Palette & Theme

The catalog page uses a **cinematic dark theme** regardless of the app's overall theme setting. This is the "lobby" — it should feel premium and immersive.

- **Background:** `#0a0a0a` (near-black, not pure black)
- **Surface:** `#141414` (card backgrounds, elevated surfaces)
- **Surface hover:** `#1a1a1a`
- **Text primary:** `#ffffff`
- **Text secondary:** `#a0a0a0`
- **Text muted:** `#6b6b6b`
- **Accent/CTA:** Brand color (TBD) — used for "Start Learning" buttons, progress bars
- **Gradient overlay on thumbnails:** `linear-gradient(to top, #0a0a0a 0%, transparent 60%)`

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
   thumbnailUrl: v.optional(v.string()),      // course card hero image (override auto-generated YouTube thumbnail)
   featured: v.optional(v.boolean()),         // whether to include in hero billboard rotation
   tagline: v.optional(v.string()),           // one-liner for hero billboard overlay
   ```

3. **No new tables needed** — all other data already exists.

---

## New Dependencies

- **`embla-carousel-react`** — lightweight carousel engine (~3KB gzipped)
- **`embla-carousel-autoplay`** — auto-advance plugin for hero billboard

No other new dependencies. Animations via CSS transitions (no framer-motion needed for this scope).

---

## New Convex Queries Needed

1. **`getActiveFrames`** — returns all of a user's frames sorted by `updatedAt` desc, joined with lesson title, lesson duration, course title, and course institution. Powers the resume row.

2. **`getCourseProgress`** — returns completion counts per course for a user (aggregate `lessonCompletions` grouped by course). Powers progress bars on cards.

3. **`getCoursesGroupedByInstitution`** — returns courses grouped by `institution` field, with lesson counts per course. Powers the institution rows.

4. **`getFeaturedCourses`** — returns courses where `featured === true`, with thumbnail URLs and taglines. Powers the hero billboard.

5. **`searchCourses`** — text search across course titles, descriptions, lesson titles, and institution names. Powers the search bar.

---

## Component Breakdown

```
src/app/courses/page.tsx                  — Route entry, wraps in AuthGate
src/ui/courses/CourseCatalog.tsx          — Main catalog layout (orchestrates all sections)
src/ui/courses/CatalogSearch.tsx          — Premium search bar with overlay results
src/ui/courses/HeroBillboard.tsx          — Auto-sliding hero carousel (Apple TV+ style)
src/ui/courses/HeroBillboardSlide.tsx     — Individual hero slide with thumbnail + overlay
src/ui/courses/ResumeRow.tsx              — "Continue Learning" horizontal carousel
src/ui/courses/InstitutionRow.tsx         — Per-institution horizontal carousel with label
src/ui/courses/CourseCard.tsx             — Individual course card (thumbnail + overlay + hover)
src/ui/courses/CourseCardExpanded.tsx     — Inline expanded view with lecture list
src/ui/courses/LessonListItem.tsx         — Single lesson row in expanded view
src/ui/courses/HorizontalCarousel.tsx     — Shared Embla-based horizontal scroll container
src/ui/courses/ProgressBar.tsx            — Thin course progress indicator
```

---

## Alpha Launch Plan

Seeded courses for alpha:
- **CS50x 2026** (already ingested — the gold standard)
- CS50P (Introduction to Programming with Python)
- CS50W (Web Programming with Python and JavaScript)
- CS50AI (Introduction to Artificial Intelligence with Python)
- CS50 SQL (Introduction to Databases with SQL)

All Harvard/CS50, so the initial catalog will have one institution row ("Harvard CS50") with multiple courses. The hero billboard will rotate through all 5 with stylized thumbnails. Additional institutions added post-alpha.

---

## Performance Considerations

1. **Image optimization** — Use Next.js `<Image>` with `priority` for hero billboard first slide, `loading="lazy"` for everything below the fold. YouTube thumbnails are external — configure `next.config.js` `images.remotePatterns` for `img.youtube.com`.

2. **Carousel virtualization** — For rows with many courses, only render visible cards + 1-2 offscreen. Embla handles this natively with its plugin system.

3. **Query efficiency** — `getActiveFrames` and `getCourseProgress` should be single round-trip queries, not N+1. Join data server-side in Convex.

4. **Skeleton loading** — Show skeleton cards (shimmer/pulse) while data loads. Hero billboard shows a dark placeholder. Never show a blank page.

5. **Prefetching** — When user hovers a course card, prefetch the lesson list for that course (if using inline expand). Convex's reactive queries handle this naturally.

---

## Design Principles

1. **Apple TV+ premium** — Cinematic, spacious, dark, elegant. Every pixel should feel intentional.
2. **Recency ordering** — Most recent activity always surfaces first.
3. **One click to resume** — Returning users back in workspace in a single click.
4. **Search is first-class** — Prominent, fast, always accessible.
5. **Content-forward** — Thumbnails and imagery do the heavy lifting, not text.
6. **Mobile-first responsive** — Carousels become swipeable, hero billboard becomes full-width swipe, cards stack where needed.
7. **Accessibility** — Keyboard navigable, screen reader friendly, reduced motion support, sufficient contrast ratios.
