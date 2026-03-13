# DX & Quality Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add niotepad markdown export, expand test coverage for Convex backend + domain layer, and close DX/OSS readiness gaps.

**Architecture:** Three independent workstreams with zero file overlap. Niotepad export is a pure client-side Blob download. Tests follow existing convex-test and Vitest patterns. DX items are standalone config/docs/small components.

**Tech Stack:** TypeScript, React 19, Vitest, convex-test, Bun, Prettier, ESLint 9

---

## Workstream A: Niotepad Export to Markdown

### Task A1: Export domain logic + tests

**Files:**

- Create: `src/domain/niotepadExport.ts`
- Create: `tests/unit/domain/niotepadExport.test.ts`

**Step 1: Write the failing tests**

````typescript
// tests/unit/domain/niotepadExport.test.ts
import { describe, it, expect } from "vitest";
import {
  slugify,
  formatVideoTime,
  buildEntryMarkdown,
  buildPageMarkdown,
  buildAllPagesMarkdown,
} from "@/domain/niotepadExport";
import type { NiotepadEntryData, NiotepadPage } from "@/domain/niotepad";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Lecture 3: Algorithms")).toBe("lecture-3-algorithms");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("foo---bar")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("returns 'notes' for empty string", () => {
    expect(slugify("")).toBe("notes");
  });

  it("handles special characters", () => {
    expect(slugify("CS50's Web (2026)")).toBe("cs50-s-web-2026");
  });
});

describe("formatVideoTime", () => {
  it("formats seconds to MM:SS", () => {
    expect(formatVideoTime(185)).toBe("3:05");
  });

  it("formats zero", () => {
    expect(formatVideoTime(0)).toBe("0:00");
  });

  it("formats hours correctly", () => {
    expect(formatVideoTime(3661)).toBe("61:01");
  });
});

describe("buildEntryMarkdown", () => {
  const baseEntry: NiotepadEntryData = {
    id: "e1",
    source: "manual",
    content: "Binary search requires sorted array.",
    createdAt: 1710000000000,
    updatedAt: 1710000000000,
    videoTimeSec: null,
    pageId: "p1",
    metadata: {},
  };

  it("renders manual entries as-is", () => {
    const md = buildEntryMarkdown(baseEntry);
    expect(md).toBe("Binary search requires sorted array.");
  });

  it("renders video entries with timestamp header", () => {
    const entry: NiotepadEntryData = {
      ...baseEntry,
      source: "video",
      videoTimeSec: 185,
      metadata: { lectureTitle: "Lecture 3" },
    };
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("**3:05**");
    expect(md).toContain("Lecture 3");
    expect(md).toContain("Binary search requires sorted array.");
  });

  it("wraps code entries in fenced code block with language", () => {
    const entry: NiotepadEntryData = {
      ...baseEntry,
      source: "code",
      content: "def search(arr):\n    pass",
      metadata: { language: "python", filePath: "search.py" },
    };
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("```python");
    expect(md).toContain("def search(arr):");
    expect(md).toContain("```");
    expect(md).toContain("*Code — search.py*");
  });

  it("wraps code entries without language in plain fence", () => {
    const entry: NiotepadEntryData = {
      ...baseEntry,
      source: "code",
      content: "some code",
      metadata: {},
    };
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("```\nsome code\n```");
  });

  it("wraps chat entries in plain fenced block", () => {
    const entry: NiotepadEntryData = {
      ...baseEntry,
      source: "chat",
      content: "The complexity is O(log n).",
    };
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("```\nThe complexity is O(log n).\n```");
    expect(md).toContain("*Assistant*");
  });
});

describe("buildPageMarkdown", () => {
  it("builds a complete page with header and entries", () => {
    const page: NiotepadPage = {
      id: "p1",
      lessonId: "l1",
      title: "Lecture 3: Algorithms",
      lectureNumber: 3,
      entries: [
        {
          id: "e1",
          source: "manual",
          content: "Note one",
          createdAt: 1710000000000,
          updatedAt: 1710000000000,
          videoTimeSec: null,
          pageId: "p1",
          metadata: {},
        },
        {
          id: "e2",
          source: "manual",
          content: "Note two",
          createdAt: 1710000001000,
          updatedAt: 1710000001000,
          videoTimeSec: null,
          pageId: "p1",
          metadata: {},
        },
      ],
      createdAt: 1710000000000,
    };
    const md = buildPageMarkdown(page);
    expect(md).toContain("# Lecture 3: Algorithms");
    expect(md).toContain("Exported from Niotebook");
    expect(md).toContain("Note one");
    expect(md).toContain("Note two");
    expect(md).toContain("---");
  });

  it("handles empty page", () => {
    const page: NiotepadPage = {
      id: "p1",
      lessonId: "l1",
      title: "Empty",
      lectureNumber: null,
      entries: [],
      createdAt: 1710000000000,
    };
    const md = buildPageMarkdown(page);
    expect(md).toContain("# Empty");
    expect(md).toContain("No entries yet.");
  });
});

describe("buildAllPagesMarkdown", () => {
  it("combines multiple pages with h2 headers", () => {
    const pages: NiotepadPage[] = [
      {
        id: "p1",
        lessonId: "l1",
        title: "Lecture 1",
        lectureNumber: 1,
        entries: [
          {
            id: "e1",
            source: "manual",
            content: "First note",
            createdAt: 1710000000000,
            updatedAt: 1710000000000,
            videoTimeSec: null,
            pageId: "p1",
            metadata: {},
          },
        ],
        createdAt: 1710000000000,
      },
      {
        id: "p2",
        lessonId: "l2",
        title: "Lecture 2",
        lectureNumber: 2,
        entries: [],
        createdAt: 1710000001000,
      },
    ];
    const md = buildAllPagesMarkdown(pages, "CS50x");
    expect(md).toContain("# CS50x — All Notes");
    expect(md).toContain("## Lecture 1");
    expect(md).toContain("## Lecture 2");
    expect(md).toContain("First note");
  });
});
````

**Step 2: Run tests to verify they fail**

Run: `bunx vitest run tests/unit/domain/niotepadExport.test.ts`
Expected: FAIL — module `@/domain/niotepadExport` does not exist.

**Step 3: Write the implementation**

````typescript
// src/domain/niotepadExport.ts
import type { NiotepadEntryData, NiotepadPage } from "./niotepad";

const slugify = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "notes";
};

const formatVideoTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const buildEntryMarkdown = (entry: NiotepadEntryData): string => {
  switch (entry.source) {
    case "video": {
      const time =
        entry.videoTimeSec !== null ? formatVideoTime(entry.videoTimeSec) : "";
      const title = entry.metadata.lectureTitle ?? "";
      const header =
        time && title ? `**${time}** — ${title}` : time ? `**${time}**` : title;
      return header ? `${header}\n\n${entry.content}` : entry.content;
    }
    case "code": {
      const lang = entry.metadata.language ?? "";
      const fence = lang ? `\`\`\`${lang}` : "```";
      const fileName = entry.metadata.filePath?.split("/").pop();
      const attribution = fileName ? `\n\n*Code — ${fileName}*` : "";
      return `${fence}\n${entry.content}\n\`\`\`${attribution}`;
    }
    case "chat": {
      return `\`\`\`\n${entry.content}\n\`\`\`\n\n*Assistant*`;
    }
    case "manual":
    default:
      return entry.content;
  }
};

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const buildPageMarkdown = (page: NiotepadPage): string => {
  const lines: string[] = [];
  lines.push(`# ${page.title}`);
  lines.push("");
  lines.push(`> Exported from Niotebook — ${todayIso()}`);
  lines.push("");

  if (page.entries.length === 0) {
    lines.push("No entries yet.");
    return lines.join("\n");
  }

  for (const entry of page.entries) {
    lines.push("---");
    lines.push("");
    lines.push(buildEntryMarkdown(entry));
    lines.push("");
  }

  return lines.join("\n");
};

const buildAllPagesMarkdown = (
  pages: NiotepadPage[],
  courseTitle?: string,
): string => {
  const lines: string[] = [];
  const heading = courseTitle ? `${courseTitle} — All Notes` : "All Notes";
  lines.push(`# ${heading}`);
  lines.push("");
  lines.push(`> Exported from Niotebook — ${todayIso()}`);
  lines.push("");

  for (const page of pages) {
    lines.push(`## ${page.title}`);
    lines.push("");
    if (page.entries.length === 0) {
      lines.push("No entries yet.");
      lines.push("");
      continue;
    }
    for (const entry of page.entries) {
      lines.push("---");
      lines.push("");
      lines.push(buildEntryMarkdown(entry));
      lines.push("");
    }
  }

  return lines.join("\n");
};

export {
  buildAllPagesMarkdown,
  buildEntryMarkdown,
  buildPageMarkdown,
  formatVideoTime,
  slugify,
  todayIso,
};
````

**Step 4: Run tests to verify they pass**

Run: `bunx vitest run tests/unit/domain/niotepadExport.test.ts`
Expected: PASS — all tests green.

**Step 5: Run lint + typecheck**

Run: `bun run typecheck && bun run lint`

**Step 6: Commit**

```bash
git add src/domain/niotepadExport.ts tests/unit/domain/niotepadExport.test.ts
git commit -m "feat(domain): add niotepad markdown export builder with tests"
```

---

### Task A2: Download utility

**Files:**

- Create: `src/infra/niotepad/downloadFile.ts`

**Step 1: Write the utility**

```typescript
// src/infra/niotepad/downloadFile.ts
const downloadMarkdownFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export { downloadMarkdownFile };
```

**Step 2: Run typecheck**

Run: `bun run typecheck`

**Step 3: Commit**

```bash
git add src/infra/niotepad/downloadFile.ts
git commit -m "feat(infra): add markdown file download utility"
```

---

### Task A3: Export dropdown in NiotepadDragHandle

**Files:**

- Modify: `src/ui/niotepad/NiotepadDragHandle.tsx`
- Modify: `src/ui/niotepad/NiotepadPanel.tsx` (pass export callbacks)
- Read: `src/infra/niotepad/useNiotepadStore.ts` (for store access pattern)

**Step 1: Update NiotepadDragHandle with export dropdown**

Add a small download icon button that toggles a dropdown with two options. Use `DownloadSimple` from `@phosphor-icons/react`. Add a `useRef` + `useEffect` for click-outside dismiss.

Props to add to `NiotepadDragHandleProps`:

- `onExportPage: () => void`
- `onExportAll: () => void`

The dropdown should:

- Appear below the download icon (absolute positioned)
- Have two items: "Export Page" and "Export All"
- Dismiss on click-outside or item selection
- Use niotepad CSS variables for styling consistency

**Step 2: Wire export callbacks in NiotepadPanel**

In `NiotepadPanel.tsx`, import the store, export functions, and download utility. Create two handlers:

- `handleExportPage`: gets active page from store → `buildPageMarkdown(page)` → `downloadMarkdownFile(content, filename)` with `niotepad-{slugify(page.title)}-{todayIso()}.md`
- `handleExportAll`: gets all pages from store → `buildAllPagesMarkdown(pages, courseTitle)` → `downloadMarkdownFile(content, filename)` with `niotepad-all-{slugify(courseTitle)}-{todayIso()}.md`

Pass both to `NiotepadDragHandle`.

**Step 3: Run typecheck + lint**

Run: `bun run typecheck && bun run lint`

**Step 4: Format**

Run: `bun run format`

**Step 5: Commit**

```bash
git add src/ui/niotepad/NiotepadDragHandle.tsx src/ui/niotepad/NiotepadPanel.tsx
git commit -m "feat(niotepad): add export dropdown for page and all-pages markdown download"
```

---

## Workstream B: Test Coverage Expansion

### Task B1: Domain tests — content, lesson-completions, niotepad types

**Files:**

- Create: `tests/unit/domain/content.test.ts`
- Create: `tests/unit/domain/lesson-completions.test.ts`
- Create: `tests/unit/domain/niotepad.test.ts`

**Step 1: Write tests**

```typescript
// tests/unit/domain/content.test.ts
import { describe, it, expect } from "vitest";
import { orderCoursesByTitle, selectLessonsByCourse } from "@/domain/content";
import type { CourseSummary, LessonSummary } from "@/domain/content";
import type { CourseId, LessonId } from "@/domain/ids";

const makeCourse = (title: string, id = "c1"): CourseSummary => ({
  id: id as CourseId,
  sourcePlaylistId: "pl1",
  title,
  license: "MIT",
  sourceUrl: "https://example.com",
});

const makeLesson = (
  order: number,
  courseId: string,
  id = `l${order}`,
): LessonSummary => ({
  id: id as LessonId,
  courseId: courseId as CourseId,
  videoId: `v${order}`,
  title: `Lesson ${order}`,
  durationSec: 300,
  order,
});

describe("orderCoursesByTitle", () => {
  it("sorts courses alphabetically by title", () => {
    const courses = [
      makeCourse("Zebra", "c3"),
      makeCourse("Apple", "c1"),
      makeCourse("Mango", "c2"),
    ];
    const sorted = orderCoursesByTitle(courses);
    expect(sorted.map((c) => c.title)).toEqual(["Apple", "Mango", "Zebra"]);
  });

  it("does not mutate original array", () => {
    const courses = [makeCourse("B"), makeCourse("A")];
    orderCoursesByTitle(courses);
    expect(courses[0].title).toBe("B");
  });

  it("handles empty array", () => {
    expect(orderCoursesByTitle([])).toEqual([]);
  });
});

describe("selectLessonsByCourse", () => {
  it("filters and sorts lessons by course and order", () => {
    const lessons = [
      makeLesson(3, "c1"),
      makeLesson(1, "c2"),
      makeLesson(1, "c1"),
      makeLesson(2, "c1"),
    ];
    const result = selectLessonsByCourse(lessons, "c1" as CourseId);
    expect(result).toHaveLength(3);
    expect(result.map((l) => l.order)).toEqual([1, 2, 3]);
  });

  it("returns empty array for non-matching courseId", () => {
    const lessons = [makeLesson(1, "c1")];
    expect(selectLessonsByCourse(lessons, "c99" as CourseId)).toEqual([]);
  });
});
```

```typescript
// tests/unit/domain/lesson-completions.test.ts
import { describe, it, expect } from "vitest";
import {
  resolveLessonCompletionSummary,
  toLessonCompletionSummary,
} from "@/domain/lesson-completions";
import type {
  LessonCompletionRecord,
  LessonCompletionUpsertInput,
} from "@/domain/lesson-completions";
import type { LessonCompletionId, LessonId, UserId } from "@/domain/ids";

describe("resolveLessonCompletionSummary", () => {
  it("builds summary from id, input, and timestamp", () => {
    const input: LessonCompletionUpsertInput = {
      userId: "u1" as UserId,
      lessonId: "l1" as LessonId,
      completionMethod: "video",
      completionPct: 95,
    };
    const summary = resolveLessonCompletionSummary(
      "lc1" as LessonCompletionId,
      input,
      1710000000000,
    );
    expect(summary.id).toBe("lc1");
    expect(summary.userId).toBe("u1");
    expect(summary.lessonId).toBe("l1");
    expect(summary.completionMethod).toBe("video");
    expect(summary.completionPct).toBe(95);
    expect(summary.completedAt).toBe(1710000000000);
  });

  it("handles undefined completionPct", () => {
    const input: LessonCompletionUpsertInput = {
      userId: "u1" as UserId,
      lessonId: "l1" as LessonId,
      completionMethod: "code",
    };
    const summary = resolveLessonCompletionSummary(
      "lc2" as LessonCompletionId,
      input,
      1710000000000,
    );
    expect(summary.completionPct).toBeUndefined();
  });
});

describe("toLessonCompletionSummary", () => {
  it("maps record to summary", () => {
    const record: LessonCompletionRecord = {
      _id: "lc1" as LessonCompletionId,
      userId: "u1" as UserId,
      lessonId: "l1" as LessonId,
      completionMethod: "video",
      completionPct: 100,
      completedAt: 1710000000000,
    };
    const summary = toLessonCompletionSummary(record);
    expect(summary.id).toBe("lc1");
    expect(summary.completedAt).toBe(1710000000000);
  });
});
```

```typescript
// tests/unit/domain/niotepad.test.ts
import { describe, it, expect } from "vitest";
import type {
  NiotepadEntryData,
  NiotepadPage,
  NiotepadSnapshot,
} from "@/domain/niotepad";

// Type guard tests — verifying the types compile correctly with valid data.
// These tests validate the shape of domain types used throughout the niotepad subsystem.

const makeEntry = (
  overrides?: Partial<NiotepadEntryData>,
): NiotepadEntryData => ({
  id: "e1",
  source: "manual",
  content: "test",
  createdAt: 1710000000000,
  updatedAt: 1710000000000,
  videoTimeSec: null,
  pageId: "p1",
  metadata: {},
  ...overrides,
});

const makePage = (overrides?: Partial<NiotepadPage>): NiotepadPage => ({
  id: "p1",
  lessonId: "l1",
  title: "Test Page",
  lectureNumber: 1,
  entries: [],
  createdAt: 1710000000000,
  ...overrides,
});

describe("NiotepadEntryData", () => {
  it("accepts all valid source types", () => {
    const sources = ["manual", "code", "chat", "video"] as const;
    for (const source of sources) {
      const entry = makeEntry({ source });
      expect(entry.source).toBe(source);
    }
  });

  it("allows null videoTimeSec for manual entries", () => {
    const entry = makeEntry({ videoTimeSec: null });
    expect(entry.videoTimeSec).toBeNull();
  });

  it("allows numeric videoTimeSec for video entries", () => {
    const entry = makeEntry({ source: "video", videoTimeSec: 185 });
    expect(entry.videoTimeSec).toBe(185);
  });

  it("supports all metadata fields", () => {
    const entry = makeEntry({
      source: "code",
      metadata: {
        filePath: "src/main.py",
        language: "python",
        codeHash: "abc123",
        lectureTitle: "Lecture 3",
        lectureNumber: 3,
      },
    });
    expect(entry.metadata.filePath).toBe("src/main.py");
    expect(entry.metadata.language).toBe("python");
    expect(entry.metadata.lectureNumber).toBe(3);
  });
});

describe("NiotepadPage", () => {
  it("allows null lectureNumber for general pages", () => {
    const page = makePage({ lectureNumber: null, title: "General Notes" });
    expect(page.lectureNumber).toBeNull();
  });

  it("holds entries in order", () => {
    const entries = [
      makeEntry({ id: "e1", createdAt: 100 }),
      makeEntry({ id: "e2", createdAt: 200 }),
    ];
    const page = makePage({ entries });
    expect(page.entries).toHaveLength(2);
    expect(page.entries[0].id).toBe("e1");
  });
});

describe("NiotepadSnapshot", () => {
  it("wraps pages with version", () => {
    const snapshot: NiotepadSnapshot = {
      pages: [makePage()],
      version: 1,
    };
    expect(snapshot.version).toBe(1);
    expect(snapshot.pages).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `bunx vitest run tests/unit/domain/content.test.ts tests/unit/domain/lesson-completions.test.ts tests/unit/domain/niotepad.test.ts`
Expected: PASS

**Step 3: Format + lint + typecheck**

Run: `bun run format && bun run typecheck && bun run lint`

**Step 4: Commit**

```bash
git add tests/unit/domain/content.test.ts tests/unit/domain/lesson-completions.test.ts tests/unit/domain/niotepad.test.ts
git commit -m "test(domain): add tests for content, lesson-completions, and niotepad types"
```

---

### Task B2: Convex tests — users, content, transcripts

**Files:**

- Create: `tests/convex/users.test.ts`
- Create: `tests/convex/content.test.ts`
- Create: `tests/convex/transcripts.test.ts`

**Step 1: Write tests**

Follow the exact pattern from `tests/convex/chat.test.ts`: `makeTestEnv()` → seed fixture → `.withIdentity()` → `.mutation()`/`.query()` → assert.

Key test cases per file:

**users.test.ts** (~8 cases):

- `upsertUser` creates a new user when none exists
- `upsertUser` is idempotent (returns same userId on repeat)
- `upsertUser` assigns admin role when email matches NIOTEBOOK_ADMIN_EMAILS
- `me` returns role for authenticated user
- `me` returns null for unauthenticated
- `listAll` requires admin (throws for regular user)
- `listAll` returns all users for admin
- `updateRole` changes user role

**content.test.ts** (~7 cases):

- `getCourses` returns all courses sorted by title
- `getCourses` returns empty array when no courses exist
- `getLessonsByCourse` returns lessons filtered and sorted by order
- `getLesson` returns lesson by ID
- `getLesson` returns null for non-existent ID
- `getCourseByCourseId` returns course by ID
- `getLessonCountsByCourse` returns correct counts

**transcripts.test.ts** (~4 cases):

- `getTranscriptWindow` returns segments within time range
- `getTranscriptWindow` returns empty for non-existent lesson
- `getTranscriptWindow` respects start/end bounds
- `getTranscriptWindow` applies TRANSCRIPT_START_PAD_SEC

Each test needs its own `makeTestEnv()` call for isolation. Seed courses + lessons + users + transcriptSegments as needed.

**Step 2: Run tests**

Run: `bunx vitest run tests/convex/users.test.ts tests/convex/content.test.ts tests/convex/transcripts.test.ts`
Expected: PASS

**Step 3: Format + lint**

Run: `bun run format && bun run lint`

**Step 4: Commit**

```bash
git add tests/convex/users.test.ts tests/convex/content.test.ts tests/convex/transcripts.test.ts
git commit -m "test(convex): add tests for users, content, and transcripts modules"
```

---

### Task B3: Convex tests — lessonCompletions, events, analytics

**Files:**

- Create: `tests/convex/lessonCompletions.test.ts`
- Create: `tests/convex/events.test.ts`
- Create: `tests/convex/analytics.test.ts`

**Step 1: Write tests**

**lessonCompletions.test.ts** (~7 cases):

- `setLessonCompleted` creates new completion record
- `setLessonCompleted` updates existing record (idempotent)
- `setLessonCompleted` requires authentication (throws without identity)
- `markComplete` creates completion with 100% and method "video"
- `markComplete` returns existing if already completed
- `getCompletionsByCourse` returns completions for authenticated user
- `getCompletionCountsByCourses` returns counts per course

**events.test.ts** (~5 cases):

- `logEvent` creates event record
- `logEvent` requires authentication
- `logEvent` validates event type
- `logEvent` rate limits (fires ConvexError after exceeding limit)
- `logEventInternal` validates userId and metadata

**analytics.test.ts** (~5 cases):

- `getActiveUsers` returns unique user count within time window
- `getActiveUsers` requires admin
- `getSessionCount` returns unique sessions
- `getDailyActiveUsers` returns daily point series
- Analytics queries return 0/empty for no data

**Step 2: Run tests**

Run: `bunx vitest run tests/convex/lessonCompletions.test.ts tests/convex/events.test.ts tests/convex/analytics.test.ts`
Expected: PASS

**Step 3: Format + lint**

Run: `bun run format && bun run lint`

**Step 4: Commit**

```bash
git add tests/convex/lessonCompletions.test.ts tests/convex/events.test.ts tests/convex/analytics.test.ts
git commit -m "test(convex): add tests for lessonCompletions, events, and analytics"
```

---

### Task B4: Run full test suite

**Step 1: Run all tests**

Run: `bun run test`
Expected: ALL PASS, 0 failures

**Step 2: Run full verification**

Run: `bun run typecheck && bun run lint && bun run check:any && bun run check:unknown`
Expected: ALL PASS

---

## Workstream C: DX & OSS Readiness

### Task C1: SECURITY.md + Dependabot

**Files:**

- Create: `SECURITY.md`
- Create: `.github/dependabot.yml`

**Step 1: Write SECURITY.md**

```markdown
# Security Policy

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Email [niotebook@gmail.com](mailto:niotebook@gmail.com) with:

- Description of the vulnerability
- Steps to reproduce or proof of concept
- Affected components (API, auth, frontend, etc.)

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Security Posture

- **TypeScript strict mode** with `no-any` enforcement in backend and tests
- **BYOK encryption:** API keys encrypted with AES-256-GCM at rest
- **Rate limiting:** AI requests rate-limited per user
- **Prompt injection defense:** User input neutralized before model calls
- **COOP/COEP headers:** Code execution sandbox uses cross-origin isolation

## Known Issues

See [docs/OSS_PRODUCTION_READINESS_AUDIT.md](docs/OSS_PRODUCTION_READINESS_AUDIT.md) for the full audit findings and remediation status.
```

**Step 2: Write .github/dependabot.yml**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    groups:
      dev-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "patch"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 3
```

**Step 3: Format + commit**

```bash
bun run format
git add SECURITY.md .github/dependabot.yml
git commit -m "chore(oss): add SECURITY.md and Dependabot config"
```

---

### Task C2: Custom error classes

**Files:**

- Create: `src/domain/errors.ts`
- Modify: `src/app/api/nio/route.ts` (use custom error classes)

**Step 1: Write error classes**

```typescript
// src/domain/errors.ts

class NioError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "NioError";
    this.code = code;
  }
}

class AuthError extends NioError {
  constructor(message: string) {
    super("AUTH_REQUIRED", message);
    this.name = "AuthError";
  }
}

class RateLimitError extends NioError {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super("RATE_LIMITED", message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

class ValidationError extends NioError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
    this.name = "ValidationError";
  }
}

export { AuthError, NioError, RateLimitError, ValidationError };
```

**Step 2: Update route.ts to use custom errors**

In `src/app/api/nio/route.ts`, import error classes and refactor the `POST` handler to throw/catch custom errors instead of building error responses inline. The `buildJsonResponse` calls remain but construct from error properties:

- JSON parse failure → `throw new ValidationError("Invalid JSON payload.")`
- Validation failure → `throw new ValidationError(validation.error)`
- Auth required → `throw new AuthError(message)`
- Rate limited → `throw new RateLimitError("Rate limit exceeded.", retryAfterMs)`
- Service unavailable → `throw new NioError("SERVICE_UNAVAILABLE", "Service temporarily unavailable.")`

Wrap the main logic in try/catch, catch `NioError` subclasses, and build responses from `error.code` + `error.message`.

**Step 3: Run typecheck + lint + test**

Run: `bun run typecheck && bun run lint && bun run test`

**Step 4: Commit**

```bash
git add src/domain/errors.ts src/app/api/nio/route.ts
git commit -m "refactor(domain): add custom error class hierarchy and use in API route"
```

---

### Task C3: React ErrorBoundary

**Files:**

- Create: `src/ui/shared/ErrorBoundary.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Write ErrorBoundary component**

```typescript
// src/ui/shared/ErrorBoundary.tsx
"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "16px",
            fontFamily: "var(--font-body, system-ui)",
            color: "var(--foreground, #1c1917)",
            background: "var(--background, #f4f3ee)",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.6 }}>
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid var(--border, #d6d3d1)",
              background: "var(--surface, #faf9f7)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
```

**Step 2: Wrap layout.tsx children with ErrorBoundary**

In `src/app/layout.tsx`, import `ErrorBoundary` from `@/ui/shared/ErrorBoundary` and wrap the `<Providers>{children}</Providers>` block. Since ErrorBoundary is a client component and layout is server, wrap it inside the `<body>` around the auth/provider tree:

```tsx
// Change from:
<Providers>{children}</Providers>

// To:
<ErrorBoundary>
  <Providers>{children}</Providers>
</ErrorBoundary>
```

Note: `ErrorBoundary` must be a client component (`"use client"`) since it uses class lifecycle methods. Import it dynamically or directly — both work since it's inside `<body>` which is already client-rendered.

**Step 3: Run typecheck + lint**

Run: `bun run typecheck && bun run lint`

**Step 4: Commit**

```bash
git add src/ui/shared/ErrorBoundary.tsx src/app/layout.tsx
git commit -m "feat(ui): add React ErrorBoundary to root layout"
```

---

### Task C4: Package.json scripts + concurrently

**Files:**

- Modify: `package.json`

**Step 1: Install concurrently**

Run: `bun add -d concurrently`

**Step 2: Add scripts to package.json**

Add these scripts (after existing ones):

```json
"setup": "bun install && cp -n .env.example .env.local && echo 'Ready. Edit .env.local then run: bun run dev:all'",
"clean": "rm -rf .next node_modules .turbo",
"dev:all": "npx concurrently -n convex,next -c blue,green \"bun run dev:convex\" \"bun run dev\""
```

**Step 3: Run typecheck + lint**

Run: `bun run typecheck && bun run lint`

**Step 4: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore(dx): add setup, clean, and dev:all scripts with concurrently"
```

---

### Task C5: Troubleshooting guide

**Files:**

- Create: `docs/TROUBLESHOOTING.md`

**Step 1: Write the guide**

Cover these issues:

1. **Port 3000 already in use** — `lsof -ti:3000 | xargs kill -9` or change port with `next dev -p 3001`
2. **Convex deployment not found** — Run `bunx convex dev` and select your deployment when prompted
3. **Bun lockfile mismatch after branch switch** — Run `bun install` to regenerate
4. **`NEXT_PUBLIC_CONVEX_URL` not set** — Copy `.env.example` to `.env.local` and fill in Convex URL
5. **Clerk redirect loop in dev** — Set `NIOTEBOOK_DEV_AUTH_BYPASS=true` and `NIOTEBOOK_ALLOW_DEV_BYPASS_IN_DEV=true` in `.env.local`
6. **E2E tests fail with "no lesson ID"** — Run `bun run e2e:seed` first, or set `NEXT_PUBLIC_DEFAULT_LESSON_ID`
7. **TypeScript errors after pulling** — Run `bun install && bun run typecheck` to ensure deps are current

**Step 2: Format + commit**

```bash
bun run format
git add docs/TROUBLESHOOTING.md
git commit -m "docs: add troubleshooting guide for common setup issues"
```

---

## Final Verification

### Task F1: Full verification pass

**Step 1: Run all checks**

```bash
bun run typecheck && bun run lint && bun run test && bun run check:any && bun run check:unknown
```

Expected: ALL PASS

**Step 2: Review commit log**

Run: `git log --oneline main..HEAD`
Expected: Clean, atomic commits telling a readable story.

**Step 3: Format check**

Run: `bun run format:check`
Expected: All files formatted.
