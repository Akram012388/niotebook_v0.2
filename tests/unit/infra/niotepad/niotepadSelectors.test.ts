import { describe, expect, it } from "vitest";

import type { NiotepadEntryData, NiotepadPage } from "@/domain/niotepad";
import {
  selectActivePageEntryCount,
  selectFilteredEntries,
  selectTotalEntryCount,
} from "@/infra/niotepad/niotepadSelectors";
import type { NiotepadState } from "@/infra/niotepad/useNiotepadStore";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEntry(
  overrides: Partial<NiotepadEntryData> & { id: string },
): NiotepadEntryData {
  return {
    source: "manual",
    content: "default content",
    createdAt: 0,
    updatedAt: 0,
    videoTimeSec: null,
    pageId: "page-1",
    metadata: {},
    ...overrides,
  };
}

function makePage(id: string, entries: NiotepadEntryData[]): NiotepadPage {
  return {
    id,
    lessonId: `lesson-${id}`,
    title: `Page ${id}`,
    lectureNumber: null,
    entries,
    createdAt: 0,
  };
}

/** Build a minimal state slice accepted by selectFilteredEntries. */
function makeFilterState(
  overrides: Partial<
    Pick<
      NiotepadState,
      "pages" | "activePageId" | "sourceFilters" | "searchQuery"
    >
  > = {},
): Pick<
  NiotepadState,
  "pages" | "activePageId" | "sourceFilters" | "searchQuery"
> {
  return {
    pages: [],
    activePageId: null,
    sourceFilters: [],
    searchQuery: "",
    ...overrides,
  };
}

/** Build a minimal full NiotepadState for count selectors (only pages + activePageId matter). */
function makeState(
  pages: NiotepadPage[],
  activePageId: string | null = null,
): NiotepadState {
  return {
    pages,
    activePageId,
    sourceFilters: [],
    searchQuery: "",
    isOpen: false,
    geometry: { x: 0, y: 0, width: 440, height: 560 },
    isSearchExpanded: false,
    hasUnread: false,
    pushSignal: 0,
    isLoaded: true,
    editingEntryId: null,
  } as unknown as NiotepadState;
}

// ---------------------------------------------------------------------------
// selectFilteredEntries
// ---------------------------------------------------------------------------

describe("selectFilteredEntries", () => {
  const entryA = makeEntry({
    id: "a",
    source: "manual",
    content: "hello python",
  });
  const entryB = makeEntry({
    id: "b",
    source: "code",
    content: "console.log()",
    pageId: "page-2",
  });
  const entryC = makeEntry({ id: "c", source: "chat", content: "AI answer" });

  const page1 = makePage("page-1", [entryA, entryC]);
  const page2 = makePage("page-2", [entryB]);

  it("all pages view (activePageId=null) flattens entries from all pages", () => {
    const state = makeFilterState({
      pages: [page1, page2],
      activePageId: null,
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id)).toEqual(["a", "c", "b"]);
  });

  it("active page view returns only entries from that page", () => {
    const state = makeFilterState({
      pages: [page1, page2],
      activePageId: "page-1",
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("source filter returns only entries matching the source", () => {
    const state = makeFilterState({
      pages: [page1, page2],
      sourceFilters: ["code"],
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("empty sourceFilters array returns all entries", () => {
    const state = makeFilterState({ pages: [page1, page2], sourceFilters: [] });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(3);
  });

  it("search query matches entries containing the term in content", () => {
    const state = makeFilterState({
      pages: [page1, page2],
      searchQuery: "python",
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("multi-term search (AND): entry must contain BOTH terms", () => {
    const entryAB = makeEntry({ id: "ab", content: "hello python world" });
    const entryOnlyHello = makeEntry({
      id: "only-hello",
      content: "hello there",
    });
    const page = makePage("p", [entryAB, entryOnlyHello]);

    const state = makeFilterState({
      pages: [page],
      searchQuery: "hello python",
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ab");
  });

  it("search is case-insensitive: 'PYTHON' matches 'python'", () => {
    const state = makeFilterState({
      pages: [page1, page2],
      searchQuery: "PYTHON",
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("search matches metadata.filePath", () => {
    const entry = makeEntry({
      id: "fp",
      content: "some code",
      metadata: { filePath: "src/utils/math.ts" },
    });
    const page = makePage("p", [entry]);
    const state = makeFilterState({ pages: [page], searchQuery: "math.ts" });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fp");
  });

  it("search matches metadata.language", () => {
    const entry = makeEntry({
      id: "lang",
      content: "x = 1",
      metadata: { language: "python" },
    });
    const page = makePage("p", [entry]);
    const state = makeFilterState({ pages: [page], searchQuery: "python" });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lang");
  });

  it("search matches metadata.lectureTitle", () => {
    const entry = makeEntry({
      id: "lt",
      content: "notes here",
      metadata: { lectureTitle: "Algorithms and Data Structures" },
    });
    const page = makePage("p", [entry]);
    const state = makeFilterState({ pages: [page], searchQuery: "algorithms" });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lt");
  });

  it("empty search query returns all entries", () => {
    const state = makeFilterState({ pages: [page1, page2], searchQuery: "" });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(3);
  });

  it("combined: sourceFilter AND search query both applied", () => {
    const codeEntry = makeEntry({
      id: "c1",
      source: "code",
      content: "python snippet",
    });
    const manualEntry = makeEntry({
      id: "m1",
      source: "manual",
      content: "python notes",
    });
    const page = makePage("p", [codeEntry, manualEntry]);

    const state = makeFilterState({
      pages: [page],
      sourceFilters: ["code"],
      searchQuery: "python",
    });
    const result = selectFilteredEntries(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
  });
});

// ---------------------------------------------------------------------------
// selectTotalEntryCount
// ---------------------------------------------------------------------------

describe("selectTotalEntryCount", () => {
  it("empty pages array returns 0", () => {
    const state = makeState([]);
    expect(selectTotalEntryCount(state)).toBe(0);
  });

  it("single page with 3 entries returns 3", () => {
    const entries = [
      makeEntry({ id: "1" }),
      makeEntry({ id: "2" }),
      makeEntry({ id: "3" }),
    ];
    const state = makeState([makePage("p1", entries)]);
    expect(selectTotalEntryCount(state)).toBe(3);
  });

  it("two pages with 2+3 entries returns 5", () => {
    const page1 = makePage("p1", [
      makeEntry({ id: "1" }),
      makeEntry({ id: "2" }),
    ]);
    const page2 = makePage("p2", [
      makeEntry({ id: "3" }),
      makeEntry({ id: "4" }),
      makeEntry({ id: "5" }),
    ]);
    const state = makeState([page1, page2]);
    expect(selectTotalEntryCount(state)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// selectActivePageEntryCount
// ---------------------------------------------------------------------------

describe("selectActivePageEntryCount", () => {
  it("activePageId=null returns same as selectTotalEntryCount", () => {
    const page1 = makePage("p1", [
      makeEntry({ id: "1" }),
      makeEntry({ id: "2" }),
    ]);
    const page2 = makePage("p2", [makeEntry({ id: "3" })]);
    const state = makeState([page1, page2], null);
    expect(selectActivePageEntryCount(state)).toBe(3);
  });

  it("activePageId set to existing page returns count for that page only", () => {
    const page1 = makePage("p1", [
      makeEntry({ id: "1" }),
      makeEntry({ id: "2" }),
    ]);
    const page2 = makePage("p2", [makeEntry({ id: "3" })]);
    const state = makeState([page1, page2], "p1");
    expect(selectActivePageEntryCount(state)).toBe(2);
  });

  it("activePageId set to nonexistent page returns 0", () => {
    const page1 = makePage("p1", [makeEntry({ id: "1" })]);
    const state = makeState([page1], "nonexistent-page");
    expect(selectActivePageEntryCount(state)).toBe(0);
  });
});
