import { query } from "./_generated/server";
import { v } from "convex/values";
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

type DailyPoint = { date: string; count: number };

type UserRow = {
  _id: string;
  _creationTime: number;
  email?: string;
  role: string;
};

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

const getActiveUsers = query({
  args: { timeWindowMs: v.number() },
  handler: async (ctx, args): Promise<number> => {
    await requireQueryAdmin(ctx);

    const cutoff = Date.now() - args.timeWindowMs;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect()) as unknown as EventRow[];

    const userIds = new Set<string>();
    for (const event of events) {
      if (event.userId) {
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
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect()) as unknown as EventRow[];

    const sessionIds = new Set<string>();
    for (const event of events) {
      if (event.sessionId) {
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
        q.eq("type", "code_run").gte("createdAt", cutoff),
      )
      .collect()) as unknown as EventRow[];

    return events.length;
  },
});

const getDailyActiveUsersSeries = query({
  args: { days: v.number() },
  handler: async (ctx, args): Promise<DailyPoint[]> => {
    await requireQueryAdmin(ctx);

    const now = Date.now();
    const cutoff = now - args.days * 24 * 60 * 60 * 1000;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect()) as unknown as EventRow[];

    const buckets = new Map<string, Set<string>>();
    for (const event of events) {
      if (event.userId) {
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

const getTopLessons = query({
  args: { limit: v.number(), timeWindowMs: v.optional(v.number()) },
  handler: async (ctx, args): Promise<TopLesson[]> => {
    await requireQueryAdmin(ctx);

    // Default to 90 days to avoid unbounded full-table scan when omitted.
    const cutoff = Date.now() - (args.timeWindowMs ?? 90 * 24 * 60 * 60 * 1000);

    const events = (await ctx.db
      .query("events")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
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
    // Use by_createdAt index to avoid unbounded full-table scan. Last 90 days
    // provides a reasonable content overview window.
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const events = (await ctx.db
      .query("events")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
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
