import { describe, it, expect } from "vitest";
import {
  extractLectureNumber,
  resolveLectureNumber,
} from "../../../src/domain/lectureNumber";

describe("extractLectureNumber", () => {
  describe("URL pattern: /lectures/N/", () => {
    it("extracts lecture number from /lectures/N/ path", () => {
      expect(
        extractLectureNumber("https://cs50.harvard.edu/x/2024/lectures/5/"),
      ).toBe(5);
    });

    it("extracts lecture number from /lectures/N/ with trailing path", () => {
      expect(extractLectureNumber("https://example.com/lectures/3/notes")).toBe(
        3,
      );
    });
  });

  describe("URL pattern: /lecture/N/", () => {
    it("extracts lecture number from /lecture/N/ path", () => {
      expect(extractLectureNumber("https://example.com/lecture/2/")).toBe(2);
    });

    it("extracts from /lecture/N/ with content after", () => {
      expect(extractLectureNumber("https://example.com/lecture/7/slides")).toBe(
        7,
      );
    });
  });

  describe("URL pattern: /weeks/N/", () => {
    it("extracts lecture number from /weeks/N/ path", () => {
      expect(extractLectureNumber("https://example.com/weeks/4/")).toBe(4);
    });

    it("extracts from /weeks/N/ with trailing path segment", () => {
      expect(extractLectureNumber("https://example.com/weeks/1/problems")).toBe(
        1,
      );
    });
  });

  describe("text pattern: 'lecture N'", () => {
    it("extracts number from 'lecture N' in plain text", () => {
      expect(extractLectureNumber("lecture 4")).toBe(4);
    });

    it("extracts number from 'Lecture N' case-insensitively", () => {
      expect(extractLectureNumber("Lecture 10 - Pointers")).toBe(10);
    });

    it("extracts from 'lecture N' embedded in a title", () => {
      expect(extractLectureNumber("CS50 lecture 6 recap")).toBe(6);
    });
  });

  describe("text pattern: 'week N'", () => {
    it("extracts number from 'week N' in plain text", () => {
      expect(extractLectureNumber("week 7")).toBe(7);
    });

    it("extracts number from 'Week N' case-insensitively", () => {
      expect(extractLectureNumber("Week 3 Notes")).toBe(3);
    });
  });

  describe("null cases", () => {
    it("returns null for undefined input", () => {
      expect(extractLectureNumber(undefined)).toBeNull();
    });

    it("returns null for a string with no matching pattern", () => {
      expect(extractLectureNumber("no numbers here")).toBeNull();
    });

    it("returns null for a generic URL with no lecture segment", () => {
      expect(extractLectureNumber("https://example.com/about/team")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(extractLectureNumber("")).toBeNull();
    });
  });

  describe("edge case: lecture 0", () => {
    it("returns 0 (not null) for /lectures/0/", () => {
      expect(
        extractLectureNumber("https://cs50.harvard.edu/x/2024/lectures/0/"),
      ).toBe(0);
    });

    it("returns 0 (not null) for 'lecture 0'", () => {
      expect(extractLectureNumber("lecture 0")).toBe(0);
    });

    it("returns 0 (not null) for 'week 0'", () => {
      expect(extractLectureNumber("week 0")).toBe(0);
    });
  });
});

describe("resolveLectureNumber", () => {
  it("returns number from subtitlesUrl when present", () => {
    expect(
      resolveLectureNumber({
        subtitlesUrl: "https://example.com/lectures/3/subs.vtt",
        transcriptUrl: "https://example.com/lectures/9/transcript.txt",
        title: "Lecture 7",
      }),
    ).toBe(3);
  });

  it("uses transcriptUrl when subtitlesUrl is absent", () => {
    expect(
      resolveLectureNumber({
        transcriptUrl: "https://example.com/lectures/5/transcript.txt",
        title: "Lecture 7",
      }),
    ).toBe(5);
  });

  it("uses title when both URL fields are absent", () => {
    expect(
      resolveLectureNumber({
        title: "Lecture 2 - Arrays",
      }),
    ).toBe(2);
  });

  it("falls back to order when all text fields are absent", () => {
    expect(
      resolveLectureNumber({
        order: 4,
      }),
    ).toBe(4);
  });

  it("returns null when all inputs are undefined", () => {
    expect(resolveLectureNumber({})).toBeNull();
  });

  it("returns null when subtitlesUrl and transcriptUrl have no match and title is absent", () => {
    expect(
      resolveLectureNumber({
        subtitlesUrl: "https://example.com/no-match",
        transcriptUrl: "https://example.com/also-no-match",
      }),
    ).toBeNull();
  });

  it("subtitlesUrl takes priority over transcriptUrl and title", () => {
    const result = resolveLectureNumber({
      subtitlesUrl: "https://example.com/lectures/1/",
      transcriptUrl: "https://example.com/lectures/2/",
      title: "Lecture 3",
      order: 4,
    });
    expect(result).toBe(1);
  });

  it("transcriptUrl takes priority over title and order", () => {
    const result = resolveLectureNumber({
      transcriptUrl: "https://example.com/lectures/2/",
      title: "Lecture 3",
      order: 4,
    });
    expect(result).toBe(2);
  });

  it("title takes priority over order", () => {
    const result = resolveLectureNumber({
      title: "Week 3 Notes",
      order: 9,
    });
    expect(result).toBe(3);
  });

  it("returns 0 from subtitlesUrl containing lecture 0", () => {
    expect(
      resolveLectureNumber({
        subtitlesUrl: "https://cs50.harvard.edu/x/2024/lectures/0/",
        order: 5,
      }),
    ).toBe(0);
  });
});
