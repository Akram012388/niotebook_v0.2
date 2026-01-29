import { query } from "./_generated/server";
import { requireQueryUser } from "./auth";
import { toDomainId } from "./idUtils";
import {
  computeLearningPulse,
  type LearningSessionInput,
  type LessonProgressInput,
  type LearningPulse,
} from "../src/domain/learningPulse";
import type { UserId, LessonId, CourseId } from "../src/domain/ids";

/**
 * getPulse – gathers session & progress data, returns a LearningPulse.
 *
 * Strategy:
 *  - Sessions: derived from pairs of session_start / session_end events
 *  - Lesson progress: derived from lessonCompletions + lessons table
 */
const getPulse = query({
  args: {},
  handler: async (ctx): Promise<LearningPulse> => {
    const user = await requireQueryUser(ctx);
    const userId = toDomainId(user.id) as unknown as UserId;
    const now = Date.now();

    // ── Gather session events ──
    const events = await ctx.db
      .query("events")
      .withIndex("by_userId", (q) => q.eq("userId", user.id))
      .collect();

    // Build sessions from session_start/session_end pairs
    const startEvents = events
      .filter((e) => e.type === "session_start")
      .sort((a, b) => a.createdAt - b.createdAt);

    const endEvents = events
      .filter((e) => e.type === "session_end")
      .sort((a, b) => a.createdAt - b.createdAt);

    // Match by sessionId in metadata
    const endBySessionId = new Map<string, (typeof endEvents)[0]>();
    for (const e of endEvents) {
      if (e.metadata.sessionId) endBySessionId.set(e.metadata.sessionId, e);
    }

    const sessions: LearningSessionInput[] = [];
    for (const start of startEvents) {
      const sid = start.sessionId ?? start.metadata.sessionId;
      if (!sid) continue;
      const end = endBySessionId.get(sid);
      if (!end) continue;

      // Count events in this session
      const sessionEvents = events.filter((e) => e.sessionId === sid);
      const videoWatchSec = sessionEvents
        .filter((e) => e.type === "video_play" || e.type === "video_pause")
        .reduce((sum, e) => sum + (e.metadata.videoTimeSec ?? 0), 0);
      const codeRunCount = sessionEvents.filter(
        (e) => e.type === "code_run",
      ).length;
      const nioMessageCount = sessionEvents.filter(
        (e) => e.type === "nio_message_sent",
      ).length;

      sessions.push({
        sessionId: sid,
        userId,
        startedAt: start.createdAt,
        endedAt: end.createdAt,
        lessonId: toDomainId(start.lessonId!) as unknown as LessonId,
        eventsCount: sessionEvents.length,
        videoWatchSec,
        codeRunCount,
        nioMessageCount,
      });
    }

    // ── Gather lesson progress ──
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_userId_lessonId", (q) => q.eq("userId", user.id))
      .collect();

    const completionByLesson = new Map(
      completions.map((c) => [c.lessonId.toString(), c]),
    );

    // Get all lessons the user has interacted with (from frames)
    const frames = await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (q) => q.eq("userId", user.id))
      .collect();

    const lessonIds = new Set([
      ...completions.map((c) => c.lessonId),
      ...frames.map((f) => f.lessonId),
    ]);

    const lessonProgress: LessonProgressInput[] = [];
    for (const lessonGenId of lessonIds) {
      const lesson = await ctx.db.get(lessonGenId);
      if (!lesson) continue;

      // Count total lessons in course
      const courseLessons = await ctx.db
        .query("lessons")
        .withIndex("by_courseId", (q) => q.eq("courseId", lesson.courseId))
        .collect();

      const completion = completionByLesson.get(lessonGenId.toString());
      const frame = frames.find(
        (f) => f.lessonId.toString() === lessonGenId.toString(),
      );

      lessonProgress.push({
        lessonId: toDomainId(lessonGenId) as unknown as LessonId,
        courseId: toDomainId(lesson.courseId) as unknown as CourseId,
        order: lesson.order,
        totalLessons: courseLessons.length,
        completed: !!completion,
        completedAt: completion?.completedAt,
        lastVideoTimeSec: frame?.videoTimeSec ?? 0,
        lessonDurationSec: lesson.durationSec,
      });
    }

    return computeLearningPulse({ userId, sessions, lessonProgress, now });
  },
});

export { getPulse };
