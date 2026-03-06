import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { GenericId } from "convex/values";
import {
  TRANSCRIPT_START_PAD_SEC,
  toTranscriptWindowSegments,
  type TranscriptSegment,
} from "../src/domain/transcript";
import { toDomainId } from "./idUtils";

const COURSE_SOURCE_PLAYLIST_ID = "cs50x-2026";

type TranscriptSegmentRecord = {
  _id: GenericId<"transcriptSegments">;
  _creationTime: number;
  lessonId: GenericId<"lessons">;
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

type CourseRecord = {
  _id: GenericId<"courses">;
  sourcePlaylistId: string;
};

type LessonRecord = {
  _id: GenericId<"lessons">;
  order: number;
  videoId: string;
  subtitlesUrl?: string;
  transcriptUrl?: string;
  transcriptStatus?: "ok" | "warn" | "missing" | "error";
};

type UserRecord = {
  _id: GenericId<"users">;
  tokenIdentifier: string;
};

type ChatThreadRecord = {
  _id: GenericId<"chatThreads">;
  userId: GenericId<"users">;
  lessonId: GenericId<"lessons">;
};

const ensureIngestToken = (ingestToken: string): void => {
  const expected = process.env.NIOTEBOOK_INGEST_TOKEN;
  if (!expected) {
    throw new Error("NIOTEBOOK_INGEST_TOKEN is not configured.");
  }
  if (ingestToken !== expected) {
    throw new Error("Invalid ingest token.");
  }
};

const toTranscriptSegment = (
  segment: TranscriptSegmentRecord,
): TranscriptSegment => {
  return {
    lessonId: toDomainId(segment.lessonId as GenericId<"lessons">),
    idx: segment.idx,
    startSec: segment.startSec,
    endSec: segment.endSec,
    textNormalized: segment.textNormalized,
  };
};

const verifyTranscriptWindows = query({
  args: {
    ingestToken: v.string(),
    defaultLessonId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    lectureTenCount: number;
    lectureZeroCount: number;
    lectureZeroLabel?: string;
  }> => {
    ensureIngestToken(args.ingestToken);

    const courses = (await ctx.db.query("courses").collect()) as CourseRecord[];
    const course = courses.find(
      (item) => item.sourcePlaylistId === COURSE_SOURCE_PLAYLIST_ID,
    );
    if (!course) {
      throw new Error("CS50x course not found in Convex.");
    }

    const lessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", course._id))
      .collect()) as LessonRecord[];

    const lectureZero =
      lessons.find((lesson) => lesson.subtitlesUrl?.includes("/lectures/0/")) ??
      lessons.find((lesson) => lesson.order === 1);

    if (!lectureZero) {
      throw new Error("Lecture 0 lesson not found in Convex.");
    }

    let lectureTen: LessonRecord | null = null;
    if (args.defaultLessonId) {
      try {
        const candidate = (await ctx.db.get(
          args.defaultLessonId as GenericId<"lessons">,
        )) as LessonRecord | null;
        if (candidate) {
          lectureTen = candidate;
        }
      } catch {
        lectureTen = null;
      }
    }

    if (!lectureTen) {
      lectureTen =
        lessons.find((lesson) =>
          lesson.subtitlesUrl?.includes("/lectures/10/"),
        ) ??
        lessons.find((lesson) =>
          lesson.transcriptUrl?.includes("/lectures/10/"),
        ) ??
        lessons.find((lesson) => lesson.order === 11) ??
        null;
    }

    if (!lectureTen) {
      throw new Error("Lecture 10 lesson not found in Convex.");
    }

    const readWindow = async (
      lessonId: GenericId<"lessons">,
      startSec: number,
      endSec: number,
    ): Promise<number> => {
      const lowerBound = Math.max(0, startSec - TRANSCRIPT_START_PAD_SEC);
      const segments = (await ctx.db
        .query("transcriptSegments")
        .withIndex("by_lessonId_startSec", (query) =>
          query
            .eq("lessonId", lessonId)
            .gte("startSec", lowerBound)
            .lte("startSec", endSec),
        )
        .collect()) as TranscriptSegmentRecord[];

      return toTranscriptWindowSegments(
        segments.map(toTranscriptSegment),
        startSec,
        endSec,
      ).length;
    };

    const lectureTenCount = await readWindow(lectureTen._id, 960, 1020);
    if (lectureTenCount === 0) {
      throw new Error("Transcript window empty for Lecture 10 (960-1020).");
    }

    let lectureZeroCount = await readWindow(lectureZero._id, 0, 60);
    let lectureZeroLabel: string | undefined = "Lecture 0";

    if (lectureZeroCount === 0) {
      const fallbackLesson = lessons.find(
        (lesson) =>
          lesson._id !== lectureZero._id &&
          (lesson.transcriptStatus === "ok" ||
            lesson.transcriptStatus === "warn"),
      );

      if (!fallbackLesson) {
        throw new Error("Transcript window empty for Lecture 0 (0-60).");
      }

      lectureZeroCount = await readWindow(fallbackLesson._id, 0, 60);
      lectureZeroLabel = `Lesson order ${fallbackLesson.order}`;

      if (lectureZeroCount === 0) {
        throw new Error(
          "Transcript window empty for Lecture 0 (0-60) and fallback lesson (0-60).",
        );
      }
    }

    return { lectureTenCount, lectureZeroCount, lectureZeroLabel };
  },
});

export { verifyTranscriptWindows };

const seedE2E = mutation({
  args: {
    ingestToken: v.string(),
    videoId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ lessonId: string; threadId: string }> => {
    if (process.env.NIOTEBOOK_PREVIEW_DATA !== "true") {
      throw new Error("E2E seed is only allowed in preview-data.");
    }

    ensureIngestToken(args.ingestToken);

    const user = (await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", "e2e-preview"),
      )
      .first()) as UserRecord | null;

    const userId = user
      ? user._id
      : await ctx.db.insert("users", {
          tokenIdentifier: "e2e-preview",
          email: "e2e@niotebook.local",
          role: "admin",
        });

    const existingCourse = (await ctx.db.query("courses").collect()).find(
      (course) => course.sourcePlaylistId === "e2e-preview",
    );

    const courseId = existingCourse
      ? existingCourse._id
      : await ctx.db.insert("courses", {
          sourcePlaylistId: "e2e-preview",
          title: "CS50x E2E",
          description: "Seeded for preview E2E runs.",
          license: "MIT",
          sourceUrl: "https://example.com",
        });

    const existingLessons = (await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (query) => query.eq("courseId", courseId))
      .collect()) as LessonRecord[];
    const existingLesson = existingLessons.find(
      (lesson) => lesson.videoId === args.videoId,
    );

    const lessonId = existingLesson
      ? existingLesson._id
      : await ctx.db.insert("lessons", {
          courseId,
          videoId: args.videoId,
          title: "E2E lesson",
          durationSec: 3600,
          order: 1,
          transcriptStatus: "missing",
        });

    const existingThread = (await ctx.db
      .query("chatThreads")
      .withIndex("by_userId_lessonId", (query) =>
        query.eq("userId", userId).eq("lessonId", lessonId),
      )
      .first()) as ChatThreadRecord | null;

    const threadId = existingThread
      ? existingThread._id
      : await ctx.db.insert("chatThreads", {
          userId,
          lessonId,
        });

    await ctx.db.insert("chatMessages", {
      threadId,
      role: "user",
      content: "hello e2e",
      videoTimeSec: 0,
      timeWindowStartSec: 0,
      timeWindowEndSec: 60,
      createdAt: Date.now(),
    });

    return {
      lessonId: toDomainId(lessonId),
      threadId: toDomainId(threadId as GenericId<"chatThreads">),
    };
  },
});

export { seedE2E };

import { requireQueryAdmin } from "./auth";

type EventRow = {
  _id: string;
  _creationTime: number;
  userId?: string;
  lessonId?: string;
  sessionId?: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: number;
};

const getActiveUsers = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const userIds = new Set<string>();
    for (const event of events) {
      if (event.createdAt >= cutoff && event.userId) {
        userIds.add(String(event.userId));
      }
    }

    return userIds.size;
  },
});

const getSessionCount = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const sessionIds = new Set<string>();
    for (const event of events) {
      if (event.createdAt >= cutoff && event.sessionId) {
        sessionIds.add(event.sessionId);
      }
    }

    return sessionIds.size;
  },
});

const getAiRequestCount = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_type_createdAt", (q) =>
        q.eq("type", "nio_message_sent").gte("createdAt", cutoff),
      )
      .collect()) as unknown as EventRow[];

    return events.length;
  },
});

const getEventLog = query({
  args: { limit: v.number() },
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      id: string;
      type: string;
      userId?: string;
      sessionId?: string;
      createdAt: number;
    }>
  > => {
    await requireQueryAdmin(ctx);

    const events = (await ctx.db
      .query("events")
      .order("desc")
      .take(args.limit)) as unknown as EventRow[];

    return events.map((event) => ({
      id: String(event._id),
      type: event.type,
      userId: event.userId ? String(event.userId) : undefined,
      sessionId: event.sessionId,
      createdAt: event.createdAt,
    }));
  },
});

const getTotalLessons = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    await requireQueryAdmin(ctx);
    const lessons = await ctx.db.query("lessons").collect();
    return lessons.length;
  },
});

const getCodeExecutionCount = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_type_createdAt", (q) =>
        q.eq("type", "code_executed").gte("createdAt", cutoff),
      )
      .collect()) as unknown as EventRow[];

    return events.length;
  },
});

type DailyPoint = { date: string; count: number };

const getDailyActiveUsersSeries = query({
  args: { days: v.number() },
  handler: async (ctx, args): Promise<DailyPoint[]> => {
    await requireQueryAdmin(ctx);

    const now = Date.now();
    const cutoff = now - args.days * 24 * 60 * 60 * 1000;
    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const buckets = new Map<string, Set<string>>();
    for (const event of events) {
      if (event.createdAt >= cutoff && event.userId) {
        const day = new Date(event.createdAt).toISOString().slice(0, 10);
        if (!buckets.has(day)) buckets.set(day, new Set());
        buckets.get(day)!.add(String(event.userId));
      }
    }

    const result: DailyPoint[] = [];
    for (let i = args.days - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const day = d.toISOString().slice(0, 10);
      result.push({ date: day, count: buckets.get(day)?.size ?? 0 });
    }
    return result;
  },
});

const getAiUsageSeries = query({
  args: { days: v.number() },
  handler: async (ctx, args): Promise<DailyPoint[]> => {
    await requireQueryAdmin(ctx);

    const now = Date.now();
    const cutoff = now - args.days * 24 * 60 * 60 * 1000;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_type_createdAt", (q) =>
        q.eq("type", "nio_message_sent").gte("createdAt", cutoff),
      )
      .collect()) as unknown as EventRow[];

    const buckets = new Map<string, number>();
    for (const event of events) {
      const day = new Date(event.createdAt).toISOString().slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }

    const result: DailyPoint[] = [];
    for (let i = args.days - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const day = d.toISOString().slice(0, 10);
      result.push({ date: day, count: buckets.get(day) ?? 0 });
    }
    return result;
  },
});

type UserRow = {
  _id: string;
  _creationTime: number;
  email?: string;
  role: string;
};

const getUserGrowth = query({
  args: { days: v.number() },
  handler: async (ctx, args): Promise<DailyPoint[]> => {
    await requireQueryAdmin(ctx);

    const now = Date.now();
    const cutoff = now - args.days * 24 * 60 * 60 * 1000;
    const users = (await ctx.db
      .query("users")
      .collect()) as unknown as UserRow[];

    const buckets = new Map<string, number>();
    for (const user of users) {
      if (user._creationTime >= cutoff) {
        const day = new Date(user._creationTime).toISOString().slice(0, 10);
        buckets.set(day, (buckets.get(day) ?? 0) + 1);
      }
    }

    const result: DailyPoint[] = [];
    for (let i = args.days - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const day = d.toISOString().slice(0, 10);
      result.push({ date: day, count: buckets.get(day) ?? 0 });
    }
    return result;
  },
});

type LessonRow = {
  _id: string;
  courseId: string;
  title: string;
  durationSec: number;
  order: number;
  transcriptStatus?: string;
};

type CourseRow = {
  _id: string;
  title: string;
  sourcePlaylistId: string;
};

type TopLesson = { title: string; eventCount: number };

const getTopLessons = query({
  args: { limit: v.number() },
  handler: async (ctx, args): Promise<TopLesson[]> => {
    await requireQueryAdmin(ctx);

    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const counts = new Map<string, number>();
    for (const event of events) {
      if (event.lessonId) {
        const id = String(event.lessonId);
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, args.limit);

    const lessons = (await ctx.db
      .query("lessons")
      .collect()) as unknown as LessonRow[];
    const lessonMap = new Map(lessons.map((l) => [String(l._id), l]));

    return sorted.map(([id, count]) => ({
      title: lessonMap.get(id)?.title ?? id.slice(0, 8),
      eventCount: count,
    }));
  },
});

type ContentOverviewCourse = {
  id: string;
  title: string;
  lessonCount: number;
  lessons: Array<{
    id: string;
    title: string;
    order: number;
    durationSec: number;
    transcriptStatus?: string;
    completionCount: number;
    eventCount: number;
  }>;
};

const getContentOverview = query({
  args: {},
  handler: async (ctx): Promise<ContentOverviewCourse[]> => {
    await requireQueryAdmin(ctx);

    const courses = (await ctx.db
      .query("courses")
      .collect()) as unknown as CourseRow[];
    const lessons = (await ctx.db
      .query("lessons")
      .collect()) as unknown as LessonRow[];
    const completions = await ctx.db.query("lessonCompletions").collect();
    const events = (await ctx.db
      .query("events")
      .collect()) as unknown as EventRow[];

    const completionCounts = new Map<string, number>();
    for (const c of completions) {
      const id = String(c.lessonId);
      completionCounts.set(id, (completionCounts.get(id) ?? 0) + 1);
    }

    const eventCounts = new Map<string, number>();
    for (const e of events) {
      if (e.lessonId) {
        const id = String(e.lessonId);
        eventCounts.set(id, (eventCounts.get(id) ?? 0) + 1);
      }
    }

    return courses.map((course) => {
      const courseLessons = lessons
        .filter((l) => String(l.courseId) === String(course._id))
        .sort((a, b) => a.order - b.order);

      return {
        id: String(course._id),
        title: course.title,
        lessonCount: courseLessons.length,
        lessons: courseLessons.map((l) => ({
          id: String(l._id),
          title: l.title,
          order: l.order,
          durationSec: l.durationSec,
          transcriptStatus: l.transcriptStatus,
          completionCount: completionCounts.get(String(l._id)) ?? 0,
          eventCount: eventCounts.get(String(l._id)) ?? 0,
        })),
      };
    });
  },
});

export {
  getActiveUsers,
  getSessionCount,
  getAiRequestCount,
  getEventLog,
  getTotalLessons,
  getCodeExecutionCount,
  getDailyActiveUsersSeries,
  getAiUsageSeries,
  getUserGrowth,
  getTopLessons,
  getContentOverview,
};
