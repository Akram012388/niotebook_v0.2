import { describe, it, expect } from "vitest";
import { orderCoursesByTitle, selectLessonsByCourse } from "@/domain/content";
import type { CourseSummary, LessonSummary } from "@/domain/content";
import type { CourseId, LessonId } from "@/domain/ids";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                          */
/* ------------------------------------------------------------------ */

function makeCourse(overrides: Partial<CourseSummary> = {}): CourseSummary {
  return {
    id: "course-1" as CourseId,
    sourcePlaylistId: "PL123",
    title: "Untitled Course",
    license: "MIT",
    sourceUrl: "https://example.com",
    ...overrides,
  };
}

function makeLesson(overrides: Partial<LessonSummary> = {}): LessonSummary {
  return {
    id: "lesson-1" as LessonId,
    courseId: "course-1" as CourseId,
    videoId: "vid-1",
    title: "Untitled Lesson",
    durationSec: 600,
    order: 0,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  orderCoursesByTitle                                                */
/* ------------------------------------------------------------------ */

describe("orderCoursesByTitle", () => {
  it("sorts courses alphabetically by title", () => {
    const courses = [
      makeCourse({ id: "c3" as CourseId, title: "Zebra" }),
      makeCourse({ id: "c1" as CourseId, title: "Alpha" }),
      makeCourse({ id: "c2" as CourseId, title: "Middle" }),
    ];
    const sorted = orderCoursesByTitle(courses);
    expect(sorted.map((c) => c.title)).toEqual(["Alpha", "Middle", "Zebra"]);
  });

  it("does not mutate the original array", () => {
    const courses = [
      makeCourse({ id: "c2" as CourseId, title: "Beta" }),
      makeCourse({ id: "c1" as CourseId, title: "Alpha" }),
    ];
    const original = [...courses];
    orderCoursesByTitle(courses);
    expect(courses).toEqual(original);
  });

  it("returns an empty array when given an empty array", () => {
    expect(orderCoursesByTitle([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    const courses = [makeCourse({ title: "Only" })];
    const sorted = orderCoursesByTitle(courses);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].title).toBe("Only");
  });

  it("handles case-insensitive locale comparison", () => {
    const courses = [
      makeCourse({ id: "c1" as CourseId, title: "banana" }),
      makeCourse({ id: "c2" as CourseId, title: "Apple" }),
    ];
    const sorted = orderCoursesByTitle(courses);
    expect(sorted[0].title).toBe("Apple");
    expect(sorted[1].title).toBe("banana");
  });
});

/* ------------------------------------------------------------------ */
/*  selectLessonsByCourse                                             */
/* ------------------------------------------------------------------ */

describe("selectLessonsByCourse", () => {
  const courseA = "course-a" as CourseId;
  const courseB = "course-b" as CourseId;

  it("filters lessons by courseId", () => {
    const lessons = [
      makeLesson({ id: "l1" as LessonId, courseId: courseA, order: 1 }),
      makeLesson({ id: "l2" as LessonId, courseId: courseB, order: 1 }),
      makeLesson({ id: "l3" as LessonId, courseId: courseA, order: 2 }),
    ];
    const result = selectLessonsByCourse(lessons, courseA);
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.courseId === courseA)).toBe(true);
  });

  it("sorts filtered lessons by order ascending", () => {
    const lessons = [
      makeLesson({ id: "l3" as LessonId, courseId: courseA, order: 3 }),
      makeLesson({ id: "l1" as LessonId, courseId: courseA, order: 1 }),
      makeLesson({ id: "l2" as LessonId, courseId: courseA, order: 2 }),
    ];
    const result = selectLessonsByCourse(lessons, courseA);
    expect(result.map((l) => l.order)).toEqual([1, 2, 3]);
  });

  it("returns an empty array for a non-matching courseId", () => {
    const lessons = [
      makeLesson({ id: "l1" as LessonId, courseId: courseA, order: 1 }),
    ];
    const result = selectLessonsByCourse(lessons, courseB);
    expect(result).toEqual([]);
  });

  it("returns an empty array when lessons is empty", () => {
    expect(selectLessonsByCourse([], courseA)).toEqual([]);
  });
});
