import { describe, it, expect } from "vitest";
import {
  computeStreak,
  computePace,
  computeCourseProgress,
  computeLearningStyle,
  buildNioContextEnrichment,
  computeLearningPulse,
  type LearningSessionInput,
  type LessonProgressInput,
} from "../../../src/domain/learningPulse";
import type { CourseId, LessonId, UserId } from "../../../src/domain/ids";

// ── Factories ──

const uid = "user_1" as UserId;
const lid = (n: number) => `lesson_${n}` as LessonId;
const cid = "course_1" as CourseId;
const cid2 = "course_2" as CourseId;

const DAY = 86_400_000;

const makeSession = (
  overrides: Partial<LearningSessionInput> & { startedAt: number },
): LearningSessionInput => ({
  sessionId: `s_${overrides.startedAt}`,
  userId: uid,
  endedAt: overrides.startedAt + 30 * 60_000,
  lessonId: lid(1),
  eventsCount: 10,
  videoWatchSec: 600,
  codeRunCount: 5,
  nioMessageCount: 2,
  ...overrides,
});

const makeProgress = (
  overrides: Partial<LessonProgressInput> = {},
): LessonProgressInput => ({
  lessonId: lid(1),
  courseId: cid,
  order: 1,
  totalLessons: 12,
  completed: false,
  lastVideoTimeSec: 300,
  lessonDurationSec: 600,
  ...overrides,
});

// Fixed "now": 2024-06-15T12:00:00Z
const NOW = Date.UTC(2024, 5, 15, 12, 0, 0);

// ── Streak ──

describe("computeStreak", () => {
  it("returns zeros for empty sessions", () => {
    const result = computeStreak([], NOW);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.lastActiveDate).toBe("");
    expect(result.isActiveToday).toBe(false);
  });

  it("single session today", () => {
    const result = computeStreak([makeSession({ startedAt: NOW - 3600_000 })], NOW);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.isActiveToday).toBe(true);
  });

  it("multi-day consecutive streak", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 0 * DAY }),
      makeSession({ startedAt: NOW - 1 * DAY }),
      makeSession({ startedAt: NOW - 2 * DAY }),
      makeSession({ startedAt: NOW - 3 * DAY }),
      makeSession({ startedAt: NOW - 4 * DAY }),
    ];
    const result = computeStreak(sessions, NOW);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.isActiveToday).toBe(true);
  });

  it("broken streak (gap day)", () => {
    const sessions = [
      makeSession({ startedAt: NOW }),
      makeSession({ startedAt: NOW - 1 * DAY }),
      makeSession({ startedAt: NOW - 3 * DAY }),
      makeSession({ startedAt: NOW - 4 * DAY }),
    ];
    const result = computeStreak(sessions, NOW);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it("streak from yesterday when not active today", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 1 * DAY }),
      makeSession({ startedAt: NOW - 2 * DAY }),
    ];
    const result = computeStreak(sessions, NOW);
    expect(result.currentStreak).toBe(2);
    expect(result.isActiveToday).toBe(false);
  });

  it("session spanning midnight counts both days", () => {
    const june14_2330 = Date.UTC(2024, 5, 14, 23, 30, 0);
    const june15_0030 = Date.UTC(2024, 5, 15, 0, 30, 0);
    const sessions = [
      makeSession({ startedAt: june14_2330, endedAt: june15_0030 }),
    ];
    const now = Date.UTC(2024, 5, 15, 12, 0, 0);
    const result = computeStreak(sessions, now);
    expect(result.currentStreak).toBe(2);
    expect(result.isActiveToday).toBe(true);
  });

  it("very long streak (30+ days) works without issue", () => {
    const sessions = Array.from({ length: 35 }, (_, i) =>
      makeSession({ startedAt: NOW - i * DAY }),
    );
    const result = computeStreak(sessions, NOW);
    expect(result.currentStreak).toBe(35);
    expect(result.longestStreak).toBe(35);
    expect(result.isActiveToday).toBe(true);
  });
});

// ── Pace ──

describe("computePace", () => {
  it("returns zeros for empty sessions", () => {
    const result = computePace([], NOW);
    expect(result.totalSessions).toBe(0);
    expect(result.avgSessionMinutes).toBe(0);
    expect(result.trend).toBe("insufficient_data");
  });

  it("insufficient data with < 4 sessions", () => {
    const sessions = [makeSession({ startedAt: NOW - DAY })];
    const result = computePace(sessions, NOW);
    expect(result.totalSessions).toBe(1);
    expect(result.trend).toBe("insufficient_data");
  });

  it("detects accelerating trend", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 21 * DAY }),
      makeSession({ startedAt: NOW - 3 * DAY }),
      makeSession({ startedAt: NOW - 4 * DAY }),
      makeSession({ startedAt: NOW - 5 * DAY }),
      makeSession({ startedAt: NOW - 6 * DAY }),
      makeSession({ startedAt: NOW - 7 * DAY }),
    ];
    const result = computePace(sessions, NOW);
    expect(result.trend).toBe("accelerating");
  });

  it("detects slowing trend", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 20 * DAY }),
      makeSession({ startedAt: NOW - 21 * DAY }),
      makeSession({ startedAt: NOW - 22 * DAY }),
      makeSession({ startedAt: NOW - 23 * DAY }),
      makeSession({ startedAt: NOW - 24 * DAY }),
      makeSession({ startedAt: NOW - 2 * DAY }),
    ];
    const result = computePace(sessions, NOW);
    expect(result.trend).toBe("slowing");
  });

  it("detects steady trend", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 20 * DAY }),
      makeSession({ startedAt: NOW - 21 * DAY }),
      makeSession({ startedAt: NOW - 22 * DAY }),
      makeSession({ startedAt: NOW - 3 * DAY }),
      makeSession({ startedAt: NOW - 4 * DAY }),
      makeSession({ startedAt: NOW - 5 * DAY }),
    ];
    const result = computePace(sessions, NOW);
    expect(result.trend).toBe("steady");
  });

  it("returns insufficient_data when all sessions are in last 2 weeks", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 1 * DAY }),
      makeSession({ startedAt: NOW - 3 * DAY }),
      makeSession({ startedAt: NOW - 5 * DAY }),
      makeSession({ startedAt: NOW - 7 * DAY }),
      makeSession({ startedAt: NOW - 10 * DAY }),
    ];
    const result = computePace(sessions, NOW);
    expect(result.totalSessions).toBe(5);
    expect(result.trend).toBe("insufficient_data");
  });

  it("exactly 4 sessions all recent returns insufficient_data", () => {
    const sessions = [
      makeSession({ startedAt: NOW - 1 * DAY }),
      makeSession({ startedAt: NOW - 2 * DAY }),
      makeSession({ startedAt: NOW - 3 * DAY }),
      makeSession({ startedAt: NOW - 4 * DAY }),
    ];
    const result = computePace(sessions, NOW);
    expect(result.totalSessions).toBe(4);
    expect(result.trend).toBe("insufficient_data");
  });
});

// ── Course Progress ──

describe("computeCourseProgress", () => {
  it("computes basic progress", () => {
    const progress = [
      makeProgress({ order: 1, completed: true }),
      makeProgress({ order: 2, completed: true, lessonId: lid(2) }),
      makeProgress({ order: 3, completed: false, lessonId: lid(3) }),
    ];
    const pace = computePace(
      Array.from({ length: 6 }, (_, i) =>
        makeSession({ startedAt: NOW - i * 3 * DAY }),
      ),
      NOW,
    );
    const result = computeCourseProgress(progress, pace);
    expect(result).toHaveLength(1);
    expect(result[0].completedLessons).toBe(2);
    expect(result[0].totalLessons).toBe(12);
    expect(result[0].completionPct).toBe(17);
    expect(result[0].currentLessonOrder).toBe(3);
    expect(result[0].estimatedCompletionDays).toBeTypeOf("number");
  });

  it("returns null estimate with insufficient pace data", () => {
    const progress = [makeProgress({ order: 1, completed: false })];
    const pace = computePace([makeSession({ startedAt: NOW })], NOW);
    const result = computeCourseProgress(progress, pace);
    expect(result[0].estimatedCompletionDays).toBeNull();
  });

  it("handles multiple courses", () => {
    const progress = [
      makeProgress({ order: 1, completed: true, courseId: cid, lessonId: lid(1), totalLessons: 10 }),
      makeProgress({ order: 2, completed: false, courseId: cid, lessonId: lid(2), totalLessons: 10 }),
      makeProgress({ order: 1, completed: true, courseId: cid2, lessonId: lid(3), totalLessons: 5 }),
      makeProgress({ order: 2, completed: true, courseId: cid2, lessonId: lid(4), totalLessons: 5 }),
      makeProgress({ order: 3, completed: false, courseId: cid2, lessonId: lid(5), totalLessons: 5 }),
    ];
    const pace = computePace(
      Array.from({ length: 6 }, (_, i) =>
        makeSession({ startedAt: NOW - i * 3 * DAY }),
      ),
      NOW,
    );
    const result = computeCourseProgress(progress, pace);
    expect(result).toHaveLength(2);

    const c1 = result.find((c) => c.courseId === cid)!;
    expect(c1.completedLessons).toBe(1);
    expect(c1.totalLessons).toBe(10);
    expect(c1.completionPct).toBe(10);

    const c2 = result.find((c) => c.courseId === cid2)!;
    expect(c2.completedLessons).toBe(2);
    expect(c2.totalLessons).toBe(5);
    expect(c2.completionPct).toBe(40);
  });

  it("propagates courseTitle", () => {
    const progress = [
      makeProgress({ order: 1, completed: true, courseTitle: "CS50x" }),
      makeProgress({ order: 2, completed: false, lessonId: lid(2) }),
    ];
    const pace = computePace([], NOW);
    const result = computeCourseProgress(progress, pace);
    expect(result[0].courseTitle).toBe("CS50x");
  });
});

// ── Learning Style ──

describe("computeLearningStyle", () => {
  it("returns defaults for empty sessions", () => {
    const result = computeLearningStyle([]);
    expect(result.videoHeavy).toBe(false);
    expect(result.codeHeavy).toBe(false);
    expect(result.nioEngaged).toBe(false);
    expect(result.sessionPattern).toBe("mixed");
  });

  it("detects video-heavy style", () => {
    const result = computeLearningStyle([
      makeSession({ startedAt: NOW, videoWatchSec: 1000, codeRunCount: 0 }),
    ]);
    expect(result.videoHeavy).toBe(true);
    expect(result.codeHeavy).toBe(false);
  });

  it("detects code-heavy style", () => {
    const result = computeLearningStyle([
      makeSession({ startedAt: NOW, videoWatchSec: 0, codeRunCount: 100 }),
    ]);
    expect(result.codeHeavy).toBe(true);
    expect(result.videoHeavy).toBe(false);
  });

  it("detects nio-engaged", () => {
    const result = computeLearningStyle([
      makeSession({ startedAt: NOW, nioMessageCount: 10 }),
    ]);
    expect(result.nioEngaged).toBe(true);
  });

  it("detects short-burst pattern", () => {
    const result = computeLearningStyle([
      makeSession({ startedAt: NOW, endedAt: NOW + 10 * 60_000 }),
    ]);
    expect(result.sessionPattern).toBe("short-burst");
  });

  it("detects deep-focus pattern", () => {
    const result = computeLearningStyle([
      makeSession({ startedAt: NOW, endedAt: NOW + 60 * 60_000 }),
    ]);
    expect(result.sessionPattern).toBe("deep-focus");
  });

  it("detects mixed pattern", () => {
    const result = computeLearningStyle([
      makeSession({ startedAt: NOW, endedAt: NOW + 25 * 60_000 }),
    ]);
    expect(result.sessionPattern).toBe("mixed");
  });
});

// ── Nio Context Enrichment ──

describe("buildNioContextEnrichment", () => {
  it("formats all lines", () => {
    const streak = {
      currentStreak: 5,
      longestStreak: 7,
      lastActiveDate: "2024-06-15",
      isActiveToday: true,
    };
    const pace = {
      avgSessionMinutes: 28,
      avgSessionsPerWeek: 3.2,
      totalStudyMinutes: 280,
      totalSessions: 10,
      trend: "accelerating" as const,
    };
    const courses = [
      {
        courseId: cid,
        completedLessons: 4,
        totalLessons: 12,
        completionPct: 33,
        currentLessonOrder: 5,
        estimatedCompletionDays: 18,
      },
    ];
    const style = {
      videoHeavy: false,
      codeHeavy: true,
      nioEngaged: true,
      sessionPattern: "deep-focus" as const,
    };

    const result = buildNioContextEnrichment(streak, pace, courses, style);
    expect(result.streakLine).toBe("Learning streak: 5 days");
    expect(result.paceLine).toContain("3.2 sessions/week");
    expect(result.progressLine).toContain("4/12 lessons (33%)");
    expect(result.styleLine).toContain("code-heavy");
    expect(result.styleLine).toContain("Nio-engaged");
    expect(result.summaryLine).toContain("5-day streak");
    expect(result.summaryLine).toContain("accelerating pace");
  });

  it("handles no streak", () => {
    const result = buildNioContextEnrichment(
      { currentStreak: 0, longestStreak: 0, lastActiveDate: "", isActiveToday: false },
      { avgSessionMinutes: 0, avgSessionsPerWeek: 0, totalStudyMinutes: 0, totalSessions: 0, trend: "insufficient_data" },
      [],
      { videoHeavy: false, codeHeavy: false, nioEngaged: false, sessionPattern: "mixed" },
    );
    expect(result.streakLine).toBe("No current streak");
    expect(result.progressLine).toBe("No course progress yet");
  });

  it("uses courseTitle in progressLine when available", () => {
    const courses = [
      {
        courseId: cid,
        courseTitle: "CS50x",
        completedLessons: 4,
        totalLessons: 12,
        completionPct: 33,
        currentLessonOrder: 5,
        estimatedCompletionDays: 18,
      },
    ];
    const result = buildNioContextEnrichment(
      { currentStreak: 1, longestStreak: 1, lastActiveDate: "2024-06-15", isActiveToday: true },
      { avgSessionMinutes: 30, avgSessionsPerWeek: 3, totalStudyMinutes: 90, totalSessions: 3, trend: "insufficient_data" },
      courses,
      { videoHeavy: false, codeHeavy: false, nioEngaged: false, sessionPattern: "mixed" },
    );
    expect(result.progressLine).toContain("CS50x progress:");
    expect(result.progressLine).not.toContain("course_1");
  });

  it("falls back to courseId when courseTitle is absent", () => {
    const courses = [
      {
        courseId: cid,
        completedLessons: 2,
        totalLessons: 10,
        completionPct: 20,
        currentLessonOrder: 3,
        estimatedCompletionDays: null,
      },
    ];
    const result = buildNioContextEnrichment(
      { currentStreak: 0, longestStreak: 0, lastActiveDate: "", isActiveToday: false },
      { avgSessionMinutes: 0, avgSessionsPerWeek: 0, totalStudyMinutes: 0, totalSessions: 0, trend: "insufficient_data" },
      courses,
      { videoHeavy: false, codeHeavy: false, nioEngaged: false, sessionPattern: "mixed" },
    );
    expect(result.progressLine).toContain("course_1 progress:");
  });
});

// ── Integration ──

describe("computeLearningPulse", () => {
  it("computes full pulse from realistic data", () => {
    const sessions = Array.from({ length: 8 }, (_, i) =>
      makeSession({
        startedAt: NOW - i * DAY,
        endedAt: NOW - i * DAY + 50 * 60_000,
        codeRunCount: 20,
        nioMessageCount: 5,
        videoWatchSec: 200,
      }),
    );
    const progress = [
      makeProgress({ order: 1, completed: true, lessonId: lid(1) }),
      makeProgress({ order: 2, completed: true, lessonId: lid(2) }),
      makeProgress({ order: 3, completed: false, lessonId: lid(3) }),
    ];

    const pulse = computeLearningPulse({
      userId: uid,
      sessions,
      lessonProgress: progress,
      now: NOW,
    });

    expect(pulse.streak.currentStreak).toBe(8);
    expect(pulse.streak.isActiveToday).toBe(true);
    expect(pulse.pace.totalSessions).toBe(8);
    // All 8 sessions are within last 2 weeks with no previous baseline
    expect(pulse.pace.trend).toBe("insufficient_data");
    expect(pulse.courses).toHaveLength(1);
    expect(pulse.courses[0].completionPct).toBe(17);
    expect(pulse.style.codeHeavy).toBe(true);
    expect(pulse.style.nioEngaged).toBe(true);
    expect(pulse.style.sessionPattern).toBe("deep-focus");
    expect(pulse.nioContext.summaryLine).toContain("Learner profile");
  });

  it("handles empty input gracefully", () => {
    const pulse = computeLearningPulse({
      userId: uid,
      sessions: [],
      lessonProgress: [],
      now: NOW,
    });

    expect(pulse.streak.currentStreak).toBe(0);
    expect(pulse.pace.totalSessions).toBe(0);
    expect(pulse.courses).toHaveLength(0);
    expect(pulse.style.sessionPattern).toBe("mixed");
  });

  it("propagates courseTitle to nioContext", () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({ startedAt: NOW - i * 3 * DAY }),
    );
    const progress = [
      makeProgress({ order: 1, completed: true, courseTitle: "Intro to Python" }),
      makeProgress({ order: 2, completed: false, lessonId: lid(2) }),
    ];

    const pulse = computeLearningPulse({
      userId: uid,
      sessions,
      lessonProgress: progress,
      now: NOW,
    });

    expect(pulse.courses[0].courseTitle).toBe("Intro to Python");
    expect(pulse.nioContext.progressLine).toContain("Intro to Python progress:");
  });
});
