import { describe, it, expect, vi, afterEach } from "vitest";
import type { NiotepadEntryData, NiotepadPage } from "@/domain/niotepad";
import {
  slugify,
  formatVideoTime,
  buildEntryMarkdown,
  buildPageMarkdown,
  buildAllPagesMarkdown,
  todayIso,
} from "@/domain/niotepadExport";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeEntry(
  overrides: Partial<NiotepadEntryData> = {},
): NiotepadEntryData {
  return {
    id: "entry-1",
    source: "manual",
    content: "Hello world",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    videoTimeSec: null,
    pageId: "page-1",
    metadata: {},
    ...overrides,
  };
}

function makePage(overrides: Partial<NiotepadPage> = {}): NiotepadPage {
  return {
    id: "page-1",
    lessonId: "lesson-1",
    title: "Lecture 3: Arrays",
    lectureNumber: 3,
    entries: [],
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  slugify                                                           */
/* ------------------------------------------------------------------ */

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Lecture 3 Arrays")).toBe("lecture-3-arrays");
  });

  it("replaces non-alphanumeric characters with hyphens", () => {
    expect(slugify("CS50x: Week 5 — Pointers")).toBe("cs50x-week-5-pointers");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("Hello---World")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Hello  ")).toBe("hello");
  });

  it('returns "notes" for an empty string', () => {
    expect(slugify("")).toBe("notes");
  });

  it('returns "notes" for a whitespace-only string', () => {
    expect(slugify("   ")).toBe("notes");
  });

  it("handles already clean input", () => {
    expect(slugify("hello-world")).toBe("hello-world");
  });
});

/* ------------------------------------------------------------------ */
/*  formatVideoTime                                                   */
/* ------------------------------------------------------------------ */

describe("formatVideoTime", () => {
  it("formats 0 seconds as 0:00", () => {
    expect(formatVideoTime(0)).toBe("0:00");
  });

  it("formats seconds under a minute with leading zero", () => {
    expect(formatVideoTime(5)).toBe("0:05");
  });

  it("formats exact minutes", () => {
    expect(formatVideoTime(60)).toBe("1:00");
  });

  it("formats 185 seconds as 3:05", () => {
    expect(formatVideoTime(185)).toBe("3:05");
  });

  it("formats large values correctly", () => {
    expect(formatVideoTime(3661)).toBe("61:01");
  });

  it("floors fractional seconds", () => {
    expect(formatVideoTime(65.9)).toBe("1:05");
  });
});

/* ------------------------------------------------------------------ */
/*  buildEntryMarkdown                                                */
/* ------------------------------------------------------------------ */

describe("buildEntryMarkdown", () => {
  it("renders manual entries as raw content", () => {
    const entry = makeEntry({
      source: "manual",
      content: "Some **bold** note",
    });
    expect(buildEntryMarkdown(entry)).toBe("Some **bold** note");
  });

  it("renders video entries with timestamp and lecture title header", () => {
    const entry = makeEntry({
      source: "video",
      content: "Key concept explained here",
      videoTimeSec: 185,
      metadata: { lectureTitle: "Arrays" },
    });
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("**3:05**");
    expect(md).toContain("Arrays");
    expect(md).toContain("Key concept explained here");
  });

  it("renders video entries without videoTimeSec gracefully", () => {
    const entry = makeEntry({
      source: "video",
      content: "A note",
      videoTimeSec: null,
      metadata: { lectureTitle: "Pointers" },
    });
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("Pointers");
    expect(md).toContain("A note");
  });

  it("renders code entries as fenced code block with language", () => {
    const entry = makeEntry({
      source: "code",
      content: 'print("hello")',
      metadata: { language: "python", filePath: "main.py" },
    });
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("```python");
    expect(md).toContain('print("hello")');
    expect(md).toContain("```");
    expect(md).toContain("*Code — main.py*");
  });

  it("renders code entries without language or filePath", () => {
    const entry = makeEntry({
      source: "code",
      content: "x = 1",
      metadata: {},
    });
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("```");
    expect(md).toContain("x = 1");
    expect(md).not.toContain("*Code —");
  });

  it("renders chat entries as fenced block with Assistant attribution", () => {
    const entry = makeEntry({
      source: "chat",
      content: "This is a helpful explanation",
      metadata: { chatMessageId: "msg-42" },
    });
    const md = buildEntryMarkdown(entry);
    expect(md).toContain("```");
    expect(md).toContain("This is a helpful explanation");
    expect(md).toContain("*Assistant*");
  });
});

/* ------------------------------------------------------------------ */
/*  buildPageMarkdown                                                 */
/* ------------------------------------------------------------------ */

describe("buildPageMarkdown", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders header and export date", () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-03-14T00:00:00.000Z",
    );

    const page = makePage({ title: "Lecture 3: Arrays", entries: [] });
    const md = buildPageMarkdown(page);
    expect(md).toContain("# Lecture 3: Arrays");
    expect(md).toContain("> Exported from Niotebook");
    expect(md).toContain("2026-03-14");
  });

  it('renders "No entries yet." for an empty page', () => {
    const page = makePage({ entries: [] });
    const md = buildPageMarkdown(page);
    expect(md).toContain("No entries yet.");
  });

  it("separates multiple entries with ---", () => {
    const page = makePage({
      entries: [
        makeEntry({ id: "e1", content: "First note" }),
        makeEntry({ id: "e2", content: "Second note" }),
      ],
    });
    const md = buildPageMarkdown(page);
    expect(md).toContain("First note");
    expect(md).toContain("---");
    expect(md).toContain("Second note");
  });

  it("renders a single entry without separator", () => {
    const page = makePage({
      entries: [makeEntry({ content: "Only note" })],
    });
    const md = buildPageMarkdown(page);
    expect(md).toContain("Only note");
    expect(md).not.toContain("---");
  });
});

/* ------------------------------------------------------------------ */
/*  buildAllPagesMarkdown                                             */
/* ------------------------------------------------------------------ */

describe("buildAllPagesMarkdown", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders course title in the top-level heading", () => {
    const pages = [makePage({ title: "Lecture 1" })];
    const md = buildAllPagesMarkdown(pages, "CS50x");
    expect(md).toContain("# CS50x — All Notes");
  });

  it("renders each page as a ## heading", () => {
    const pages = [
      makePage({ id: "p1", title: "Lecture 1" }),
      makePage({ id: "p2", title: "Lecture 2" }),
    ];
    const md = buildAllPagesMarkdown(pages);
    expect(md).toContain("## Lecture 1");
    expect(md).toContain("## Lecture 2");
  });

  it("includes entries from each page", () => {
    const pages = [
      makePage({
        title: "Lecture 1",
        entries: [makeEntry({ content: "Note from L1" })],
      }),
    ];
    const md = buildAllPagesMarkdown(pages);
    expect(md).toContain("Note from L1");
  });

  it("renders fallback heading when courseTitle is omitted", () => {
    const pages = [makePage()];
    const md = buildAllPagesMarkdown(pages);
    expect(md).toContain("# All Notes");
  });

  it("handles empty pages array", () => {
    const md = buildAllPagesMarkdown([]);
    expect(md).toContain("# All Notes");
  });
});

/* ------------------------------------------------------------------ */
/*  todayIso                                                          */
/* ------------------------------------------------------------------ */

describe("todayIso", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a YYYY-MM-DD string", () => {
    const result = todayIso();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the correct date", () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-03-14T12:34:56.789Z",
    );
    expect(todayIso()).toBe("2026-03-14");
  });
});
