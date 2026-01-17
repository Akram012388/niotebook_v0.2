import { describe, expect, it } from "vitest";
import {
  orderCoursesByTitle,
  selectLessonsByCourse,
  type CourseSummary,
  type LessonSummary,
} from "../../src/domain/content";

describe("content selectors", (): void => {
  it("orders courses by title", (): void => {
    const courses: CourseSummary[] = [
      {
        id: "course-b" as CourseSummary["id"],
        sourcePlaylistId: "playlist-b",
        title: "B Course",
        description: "Second",
        license: "CC",
        sourceUrl: "https://example.com/b",
      },
      {
        id: "course-a" as CourseSummary["id"],
        sourcePlaylistId: "playlist-a",
        title: "A Course",
        license: "CC",
        sourceUrl: "https://example.com/a",
      },
    ];

    const ordered = orderCoursesByTitle(courses);

    expect(ordered[0]?.title).toBe("A Course");
    expect(ordered[1]?.title).toBe("B Course");
  });

  it("filters and orders lessons by course", (): void => {
    const courseA = "course-a" as CourseSummary["id"];
    const courseB = "course-b" as CourseSummary["id"];

    const lessons: LessonSummary[] = [
      {
        id: "lesson-2" as LessonSummary["id"],
        courseId: courseA,
        videoId: "vid-2",
        title: "Lesson 2",
        durationSec: 1200,
        order: 2,
        transcriptStatus: "warn",
        segmentCount: 20,
      },
      {
        id: "lesson-1" as LessonSummary["id"],
        courseId: courseA,
        videoId: "vid-1",
        title: "Lesson 1",
        durationSec: 900,
        order: 1,
        transcriptStatus: "ok",
        segmentCount: 42,
        transcriptUrl: "https://example.com/lesson-1.txt",
        transcriptDurationSec: 880,
        ingestVersion: 1,
      },
      {
        id: "lesson-3" as LessonSummary["id"],
        courseId: courseB,
        videoId: "vid-3",
        title: "Lesson 3",
        durationSec: 600,
        order: 1,
      },
    ];

    const selected = selectLessonsByCourse(lessons, courseA);

    expect(selected).toHaveLength(2);
    expect(selected[0]?.id).toBe("lesson-1");
    expect(selected[1]?.id).toBe("lesson-2");
    expect(selected[0]).toMatchObject({
      courseId: courseA,
      videoId: "vid-1",
      title: "Lesson 1",
      durationSec: 900,
      order: 1,
      transcriptStatus: "ok",
      segmentCount: 42,
      transcriptUrl: "https://example.com/lesson-1.txt",
      transcriptDurationSec: 880,
      ingestVersion: 1,
    });
  });
});
