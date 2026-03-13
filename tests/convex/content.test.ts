import { describe, it, expect } from "vitest";
import { makeTestEnv, api } from "./setup";

describe("content — getCourses", () => {
  it("returns all courses sorted by title", async () => {
    const t = makeTestEnv();

    await t.run(async (ctx) => {
      await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-z",
        title: "Zebra Course",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-a",
        title: "Alpha Course",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-m",
        title: "Middle Course",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
    });

    const courses = await t.query(api.content.getCourses, {});

    expect(courses).toHaveLength(3);
    expect(courses[0].title).toBe("Alpha Course");
    expect(courses[1].title).toBe("Middle Course");
    expect(courses[2].title).toBe("Zebra Course");
  });

  it("returns empty array when no courses exist", async () => {
    const t = makeTestEnv();

    const courses = await t.query(api.content.getCourses, {});

    expect(courses).toEqual([]);
  });
});

describe("content — getLessonsByCourse", () => {
  it("returns lessons sorted by order", async () => {
    const t = makeTestEnv();

    const courseId = await t.run(async (ctx) => {
      const cId = await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-lbc",
        title: "Test Course",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      await ctx.db.insert("lessons", {
        courseId: cId,
        videoId: "vid-3",
        title: "Third",
        durationSec: 300,
        order: 3,
        transcriptStatus: "ok",
      });
      await ctx.db.insert("lessons", {
        courseId: cId,
        videoId: "vid-1",
        title: "First",
        durationSec: 300,
        order: 1,
        transcriptStatus: "ok",
      });
      await ctx.db.insert("lessons", {
        courseId: cId,
        videoId: "vid-2",
        title: "Second",
        durationSec: 300,
        order: 2,
        transcriptStatus: "ok",
      });
      return cId;
    });

    const lessons = await t.query(api.content.getLessonsByCourse, { courseId });

    expect(lessons).toHaveLength(3);
    expect(lessons[0].title).toBe("First");
    expect(lessons[1].title).toBe("Second");
    expect(lessons[2].title).toBe("Third");
  });
});

describe("content — getLesson", () => {
  it("returns lesson by ID", async () => {
    const t = makeTestEnv();

    const lessonId = await t.run(async (ctx) => {
      const courseId = await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-gl",
        title: "Test Course",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      return ctx.db.insert("lessons", {
        courseId,
        videoId: "vid-gl",
        title: "My Lesson",
        durationSec: 600,
        order: 1,
        transcriptStatus: "ok",
      });
    });

    const lesson = await t.query(api.content.getLesson, { lessonId });

    expect(lesson).not.toBeNull();
    expect(lesson!.title).toBe("My Lesson");
    expect(lesson!.videoId).toBe("vid-gl");
    expect(lesson!.durationSec).toBe(600);
  });

  it("returns null for a non-existent lesson ID", async () => {
    const t = makeTestEnv();

    const fakeId = await t.run(async (ctx) => {
      const courseId = await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-fake",
        title: "Temp",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      const tempId = await ctx.db.insert("lessons", {
        courseId,
        videoId: "vid-fake",
        title: "Temp Lesson",
        durationSec: 100,
        order: 1,
        transcriptStatus: "ok",
      });
      await ctx.db.delete(tempId);
      return tempId;
    });

    const lesson = await t.query(api.content.getLesson, { lessonId: fakeId });

    expect(lesson).toBeNull();
  });
});

describe("content — getCourseByCourseId", () => {
  it("returns course by ID", async () => {
    const t = makeTestEnv();

    const courseId = await t.run(async (ctx) => {
      return ctx.db.insert("courses", {
        sourcePlaylistId: "pl-gcbc",
        title: "Found Course",
        license: "MIT",
        sourceUrl: "https://example.com",
        description: "A test course",
      });
    });

    const course = await t.query(api.content.getCourseByCourseId, { courseId });

    expect(course).not.toBeNull();
    expect(course!.title).toBe("Found Course");
    expect(course!.description).toBe("A test course");
  });
});

describe("content — getLessonCountsByCourse", () => {
  it("returns correct counts per course", async () => {
    const t = makeTestEnv();

    await t.run(async (ctx) => {
      const course1 = await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-c1",
        title: "Course One",
        license: "MIT",
        sourceUrl: "https://example.com",
      });
      const course2 = await ctx.db.insert("courses", {
        sourcePlaylistId: "pl-c2",
        title: "Course Two",
        license: "MIT",
        sourceUrl: "https://example.com",
      });

      // Course 1: 3 lessons
      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("lessons", {
          courseId: course1,
          videoId: `vid-c1-${i}`,
          title: `Lesson ${i}`,
          durationSec: 300,
          order: i + 1,
          transcriptStatus: "ok",
        });
      }

      // Course 2: 1 lesson
      await ctx.db.insert("lessons", {
        courseId: course2,
        videoId: "vid-c2-0",
        title: "Lesson 0",
        durationSec: 300,
        order: 1,
        transcriptStatus: "ok",
      });
    });

    const counts = await t.query(api.content.getLessonCountsByCourse, {});

    expect(counts).toHaveLength(2);

    const sorted = [...counts].sort((a, b) => b.count - a.count);
    expect(sorted[0].count).toBe(3);
    expect(sorted[1].count).toBe(1);
  });
});
