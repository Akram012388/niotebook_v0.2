import { describe, it, expect } from "vitest";
import type {
  NiotepadEntryData,
  NiotepadEntryMetadata,
  NiotepadEntrySource,
  NiotepadPage,
  NiotepadSnapshot,
} from "@/domain/niotepad";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeEntry(
  overrides: Partial<NiotepadEntryData> = {},
): NiotepadEntryData {
  return {
    id: "entry-1",
    source: "manual",
    content: "Test note",
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
    title: "Lecture 1: Intro",
    lectureNumber: 1,
    entries: [],
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  NiotepadEntryData                                                 */
/* ------------------------------------------------------------------ */

describe("NiotepadEntryData", () => {
  const sources: NiotepadEntrySource[] = ["manual", "code", "chat", "video"];

  it.each(sources)("accepts '%s' as a valid source", (source) => {
    const entry = makeEntry({ source });
    expect(entry.source).toBe(source);
  });

  it("allows null videoTimeSec", () => {
    const entry = makeEntry({ videoTimeSec: null });
    expect(entry.videoTimeSec).toBeNull();
  });

  it("allows numeric videoTimeSec", () => {
    const entry = makeEntry({ videoTimeSec: 185 });
    expect(entry.videoTimeSec).toBe(185);
  });

  it("stores all required fields", () => {
    const entry = makeEntry({
      id: "e-42",
      source: "video",
      content: "Key concept",
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_001_000,
      videoTimeSec: 90,
      pageId: "page-5",
      metadata: { lectureTitle: "Pointers" },
    });

    expect(entry.id).toBe("e-42");
    expect(entry.source).toBe("video");
    expect(entry.content).toBe("Key concept");
    expect(entry.createdAt).toBe(1_700_000_000_000);
    expect(entry.updatedAt).toBe(1_700_000_001_000);
    expect(entry.videoTimeSec).toBe(90);
    expect(entry.pageId).toBe("page-5");
    expect(entry.metadata.lectureTitle).toBe("Pointers");
  });
});

/* ------------------------------------------------------------------ */
/*  NiotepadEntryMetadata                                             */
/* ------------------------------------------------------------------ */

describe("NiotepadEntryMetadata", () => {
  it("supports all optional fields", () => {
    const metadata: NiotepadEntryMetadata = {
      chatMessageId: "msg-1",
      filePath: "main.py",
      language: "python",
      transcriptRange: [10, 30],
      codeHash: "abc123",
      lectureTitle: "Arrays",
      lectureNumber: 3,
    };

    expect(metadata.chatMessageId).toBe("msg-1");
    expect(metadata.filePath).toBe("main.py");
    expect(metadata.language).toBe("python");
    expect(metadata.transcriptRange).toEqual([10, 30]);
    expect(metadata.codeHash).toBe("abc123");
    expect(metadata.lectureTitle).toBe("Arrays");
    expect(metadata.lectureNumber).toBe(3);
  });

  it("allows an empty metadata object", () => {
    const metadata: NiotepadEntryMetadata = {};
    expect(Object.keys(metadata)).toHaveLength(0);
  });

  it("allows null lectureNumber in metadata", () => {
    const metadata: NiotepadEntryMetadata = { lectureNumber: null };
    expect(metadata.lectureNumber).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  NiotepadPage                                                      */
/* ------------------------------------------------------------------ */

describe("NiotepadPage", () => {
  it("allows null lectureNumber for a general page", () => {
    const page = makePage({ lectureNumber: null, title: "General" });
    expect(page.lectureNumber).toBeNull();
    expect(page.title).toBe("General");
  });

  it("allows numeric lectureNumber", () => {
    const page = makePage({ lectureNumber: 5 });
    expect(page.lectureNumber).toBe(5);
  });

  it("holds entries as an array", () => {
    const entries = [makeEntry({ id: "e1" }), makeEntry({ id: "e2" })];
    const page = makePage({ entries });
    expect(page.entries).toHaveLength(2);
    expect(page.entries[0].id).toBe("e1");
    expect(page.entries[1].id).toBe("e2");
  });
});

/* ------------------------------------------------------------------ */
/*  NiotepadSnapshot                                                  */
/* ------------------------------------------------------------------ */

describe("NiotepadSnapshot", () => {
  it("wraps pages with a version number", () => {
    const snapshot: NiotepadSnapshot = {
      pages: [makePage()],
      version: 1,
    };

    expect(snapshot.version).toBe(1);
    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.pages[0].id).toBe("page-1");
  });

  it("supports an empty pages array", () => {
    const snapshot: NiotepadSnapshot = {
      pages: [],
      version: 1,
    };

    expect(snapshot.pages).toHaveLength(0);
    expect(snapshot.version).toBe(1);
  });

  it("supports multiple pages", () => {
    const snapshot: NiotepadSnapshot = {
      pages: [
        makePage({ id: "p1", lectureNumber: 1 }),
        makePage({ id: "p2", lectureNumber: 2 }),
        makePage({ id: "p3", lectureNumber: null }),
      ],
      version: 1,
    };

    expect(snapshot.pages).toHaveLength(3);
    expect(snapshot.pages[2].lectureNumber).toBeNull();
  });
});
