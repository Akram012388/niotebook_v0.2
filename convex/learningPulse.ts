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
 * Estimate video watch seconds by pairing consecutive play→pause events
 * and summing the wall-clock duration between each pair.
 */
const estimateVideoWatchSec = (
  sessionEvents: Array<{ type: string; createdAt: number }>,
): number => {
  const plays = sessionEvents
    .filter((e) => e.type === "video_play")
    .sort((a, b) => a.createdAt - b.createdAt);
  const pauses = sessionEvents
    .filter((e) => e.type === "video_pause")
    .sort((a, b) => a.createdAt - b.createdAt);

  let totalSec = 0;
  const usedPauses = new Set<number>();
  for (const play of plays) {
    const nextPause = pauses.find(
      (p) => p.createdAt > play.createdAt && !usedPauses.has(p.createdAt),
    );
    if (nextPause) {
      usedPauses.add(nextPause.createdAt);
      totalSec += (nextPause.createdAt - play.createdAt) / 1000;
    }
  }
  return totalSec;
};

/**
 * getPulse – gathers session & progress data, returns a LearningPulse.
 *
 * Strategy:
 *  - Sessions: derived from pairs of session_start / session_end events
 *  - Lesson progress: derived from lessonCompletions + lessons table
 *
 * Performance: lesson lookups are batched via Promise.all and course data
 * is fetched once per unique course (O(n + k) instead of O(n × k)).
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

    const startEvents = events
      .filter((e) => e.type === "session_start")
      .sort((a, b) => a.createdAt - b.createdAt);

    const endEvents = events
      .filter((e) => e.type === "session_end")
      .sort((a, b) => a.createdAt - b.createdAt);

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

      const sessionEvents = events.filter((e) => e.sessionId === sid);
      const videoWatchSec = estimateVideoWatchSec(sessionEvents);
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

    const frames = await ctx.db
      .query("frames")
      .withIndex("by_userId_lessonId", (q) => q.eq("userId", user.id))
      .collect();

    const lessonIds = new Set([
      ...completions.map((c) => c.lessonId),
      ...frames.map((f) => f.lessonId),
    ]);

    // ── Batch lesson + course lookups (O(n + k)) ──
    const lessons = await Promise.all(
      [...lessonIds].map((id) => ctx.db.get(id)),
    );
    const validLessons = lessons.filter(Boolean);

    const courseIds = [...new Set(validLessons.map((l) => l!.courseId))];

    const courseLessonCounts = new Map<string, number>();
    const courseTitles = new Map<string, string>();
    for (const courseId of courseIds) {
      const course = await ctx.db.get(courseId);
      if (course) courseTitles.set(courseId.toString(), course.title);

      const courseLessons = await ctx.db
        .query("lessons")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect();
      courseLessonCounts.set(courseId.toString(), courseLessons.length);
    }

    const lessonById = new Map(
      validLessons.map((l) => [l!._id.toString(), l!]),
    );

    const lessonProgress: LessonProgressInput[] = [];
    for (const lessonGenId of lessonIds) {
      const lesson = lessonById.get(lessonGenId.toString());
      if (!lesson) continue;

      const courseKey = lesson.courseId.toString();
      const completion = completionByLesson.get(lessonGenId.toString());
      const frame = frames.find(
        (f) => f.lessonId.toString() === lessonGenId.toString(),
      );

      lessonProgress.push({
        lessonId: toDomainId(lessonGenId) as unknown as LessonId,
        courseId: toDomainId(lesson.courseId) as unknown as CourseId,
        courseTitle: courseTitles.get(courseKey),
        order: lesson.order,
        totalLessons: courseLessonCounts.get(courseKey) ?? 0,
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
