import { describe, expect, it } from "vitest";
import {
  COMING_SOON_COURSES,
  type ComingSoonCourse,
} from "../../../../src/ui/courses/comingSoonCourses";

describe("COMING_SOON_COURSES", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(COMING_SOON_COURSES)).toBe(true);
    expect(COMING_SOON_COURSES.length).toBeGreaterThan(0);
  });

  it("every entry has title and provider strings", () => {
    for (const entry of COMING_SOON_COURSES) {
      expect(typeof entry.title).toBe("string");
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.provider).toBe("string");
      expect(entry.provider.length).toBeGreaterThan(0);
    }
  });

  it("satisfies ComingSoonCourse type", () => {
    // Type-level check — assignment would fail at compile time if wrong
    const first: ComingSoonCourse = COMING_SOON_COURSES[0];
    expect(first).toBeDefined();
  });

  it("contains known courses", () => {
    const titles = COMING_SOON_COURSES.map((c) => c.title);
    expect(titles).toContain("6.006: Introduction to Algorithms");
    expect(titles).toContain("CS106A: Programming Methodology");
  });
});
