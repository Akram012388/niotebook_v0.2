import type { CourseId, LessonId, UserId } from "./ids";

// ── Input types ──

type LearningSessionInput = {
  sessionId: string;
  userId: UserId;
  startedAt: number;
  endedAt: number;
  lessonId: LessonId;
  eventsCount: number;
  videoWatchSec: number;
  codeRunCount: number;
  nioMessageCount: number;
};

type LessonProgressInput = {
  lessonId: LessonId;
  courseId: CourseId;
  courseTitle?: string;
  order: number;
  totalLessons: number;
  completed: boolean;
  completedAt?: number;
  lastVideoTimeSec: number;
  lessonDurationSec: number;
};

type PulseInput = {
  userId: UserId;
  sessions: LearningSessionInput[];
  lessonProgress: LessonProgressInput[];
  now: number;
};

// ── Output types ──

type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  isActiveToday: boolean;
};

type PaceInsight = {
  avgSessionMinutes: number;
  avgSessionsPerWeek: number;
  totalStudyMinutes: number;
  totalSessions: number;
  trend: "accelerating" | "steady" | "slowing" | "insufficient_data";
};

type CourseProgress = {
  courseId: CourseId;
  courseTitle?: string;
  completedLessons: number;
  totalLessons: number;
  completionPct: number;
  currentLessonOrder: number;
  estimatedCompletionDays: number | null;
};

type LearningStyle = {
  videoHeavy: boolean;
  codeHeavy: boolean;
  nioEngaged: boolean;
  sessionPattern: "short-burst" | "deep-focus" | "mixed";
};

type NioContextEnrichment = {
  summaryLine: string;
  streakLine: string;
  paceLine: string;
  progressLine: string;
  styleLine: string;
};

type LearningPulse = {
  streak: StreakInfo;
  pace: PaceInsight;
  courses: CourseProgress[];
  style: LearningStyle;
  nioContext: NioContextEnrichment;
};

// ── Helpers ──

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

const toDateStr = (ms: number): string => {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfDayUTC = (ms: number): number => {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

// ── Functions ──

/**
 * Compute the user's learning streak from session timestamps.
 * A "day" is defined as a UTC calendar day. Sessions spanning midnight
 * count toward both days. The current streak counts backward from today
 * (or yesterday if not active today).
 */
const computeStreak = (
  sessions: LearningSessionInput[],
  now: number,
): StreakInfo => {
  if (sessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: "",
      isActiveToday: false,
    };
  }

  // Collect unique active days from both startedAt and endedAt to handle
  // sessions that span midnight
  const activeDays = new Set<string>();
  for (const s of sessions) {
    activeDays.add(toDateStr(s.startedAt));
    activeDays.add(toDateStr(s.endedAt));
  }

  const sortedDays = [...activeDays].sort();
  const lastActive = sortedDays[sortedDays.length - 1];
  const todayStr = toDateStr(now);
  const isActiveToday = activeDays.has(todayStr);

  const dayMs = sortedDays.map((d) => startOfDayUTC(new Date(d + "T00:00:00Z").getTime()));

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < dayMs.length; i++) {
    if (dayMs[i] - dayMs[i - 1] === MS_PER_DAY) {
      currentRun++;
    } else {
      currentRun = 1;
    }
    if (currentRun > longestStreak) longestStreak = currentRun;
  }

  const todayMs = startOfDayUTC(now);
  let checkDay = isActiveToday ? todayMs : todayMs - MS_PER_DAY;
  let currentStreak = 0;

  while (activeDays.has(toDateStr(checkDay))) {
    currentStreak++;
    checkDay -= MS_PER_DAY;
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: lastActive,
    isActiveToday,
  };
};

/**
 * Compute pace insights: session frequency, average duration, and trend.
 * Trend compares session count in the last 2 weeks vs the 2 weeks before.
 * Returns "insufficient_data" when fewer than 4 total sessions or when
 * there is no historical baseline (all sessions in the recent window).
 */
const computePace = (
  sessions: LearningSessionInput[],
  now: number,
): PaceInsight => {
  const totalSessions = sessions.length;
  const totalStudyMinutes = sessions.reduce(
    (sum, s) => sum + (s.endedAt - s.startedAt) / 60_000,
    0,
  );
  const avgSessionMinutes =
    totalSessions > 0 ? totalStudyMinutes / totalSessions : 0;

  const firstSession = sessions.reduce(
    (min, s) => Math.min(min, s.startedAt),
    Infinity,
  );
  const spanWeeks = totalSessions > 0 ? Math.max((now - firstSession) / MS_PER_WEEK, 1) : 1;
  const avgSessionsPerWeek =
    totalSessions > 0 ? totalSessions / spanWeeks : 0;

  let trend: PaceInsight["trend"] = "insufficient_data";
  if (totalSessions >= 4) {
    const twoWeeksAgo = now - 2 * MS_PER_WEEK;
    const fourWeeksAgo = now - 4 * MS_PER_WEEK;
    const recent = sessions.filter(
      (s) => s.startedAt >= twoWeeksAgo && s.startedAt < now,
    ).length;
    const previous = sessions.filter(
      (s) => s.startedAt >= fourWeeksAgo && s.startedAt < twoWeeksAgo,
    ).length;

    if (previous === 0) {
      // No historical baseline — can't determine trend
      trend = "insufficient_data";
    } else {
      const ratio = recent / previous;
      if (ratio > 1.2) trend = "accelerating";
      else if (ratio < 0.8) trend = "slowing";
      else trend = "steady";
    }
  }

  return {
    avgSessionMinutes: Math.round(avgSessionMinutes * 10) / 10,
    avgSessionsPerWeek: Math.round(avgSessionsPerWeek * 10) / 10,
    totalStudyMinutes: Math.round(totalStudyMinutes * 10) / 10,
    totalSessions,
    trend,
  };
};

/**
 * Group lesson progress entries by course and compute per-course completion
 * statistics. Optionally estimates days to completion based on current pace.
 */
const computeCourseProgress = (
  lessonProgress: LessonProgressInput[],
  pace: PaceInsight,
): CourseProgress[] => {
  const byCourse = new Map<string, LessonProgressInput[]>();
  for (const lp of lessonProgress) {
    const key = lp.courseId as string;
    const existing = byCourse.get(key);
    if (existing) {
      existing.push(lp);
    } else {
      byCourse.set(key, [lp]);
    }
  }

  return [...byCourse.entries()].map(([courseId, lessons]) => {
    const completedLessons = lessons.filter((l) => l.completed).length;
    const totalLessons = lessons[0].totalLessons;
    const completionPct =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    const currentLessonOrder = Math.max(...lessons.map((l) => l.order));

    const courseTitle = lessons.find((l) => l.courseTitle)?.courseTitle;

    let estimatedCompletionDays: number | null = null;
    const remaining = totalLessons - completedLessons;
    if (remaining > 0 && pace.avgSessionsPerWeek > 0 && pace.totalSessions >= 4) {
      const lessonsPerWeek = pace.avgSessionsPerWeek;
      const weeksLeft = remaining / lessonsPerWeek;
      estimatedCompletionDays = Math.round(weeksLeft * 7);
    }

    return {
      courseId: courseId as CourseId,
      courseTitle,
      completedLessons,
      totalLessons,
      completionPct,
      currentLessonOrder,
      estimatedCompletionDays,
    };
  });
};

/**
 * Infer the user's learning style from session-level aggregates:
 * video vs code ratio, Nio engagement, and session duration pattern.
 */
const computeLearningStyle = (
  sessions: LearningSessionInput[],
): LearningStyle => {
  if (sessions.length === 0) {
    return {
      videoHeavy: false,
      codeHeavy: false,
      nioEngaged: false,
      sessionPattern: "mixed",
    };
  }

  const totalVideoSec = sessions.reduce((s, x) => s + x.videoWatchSec, 0);
  const totalCodeSec = sessions.reduce((s, x) => s + x.codeRunCount * 30, 0);
  const totalActivitySec = totalVideoSec + totalCodeSec || 1;

  const videoPct = totalVideoSec / totalActivitySec;
  const codePct = totalCodeSec / totalActivitySec;

  const avgNio =
    sessions.reduce((s, x) => s + x.nioMessageCount, 0) / sessions.length;

  const avgMinutes =
    sessions.reduce((s, x) => s + (x.endedAt - x.startedAt) / 60_000, 0) /
    sessions.length;

  const sessionPattern: LearningStyle["sessionPattern"] =
    avgMinutes < 15 ? "short-burst" : avgMinutes > 45 ? "deep-focus" : "mixed";

  return {
    videoHeavy: videoPct > 0.7,
    codeHeavy: codePct > 0.5,
    nioEngaged: avgNio > 3,
    sessionPattern,
  };
};

/**
 * Build human-readable context lines for Nio's system prompt.
 * Uses courseTitle when available, falling back to the raw courseId.
 */
const buildNioContextEnrichment = (
  streak: StreakInfo,
  pace: PaceInsight,
  courses: CourseProgress[],
  style: LearningStyle,
): NioContextEnrichment => {
  const streakLine =
    streak.currentStreak > 0
      ? `Learning streak: ${streak.currentStreak} days`
      : "No current streak";

  const paceLine = `Pace: ${pace.avgSessionsPerWeek} sessions/week, avg ${pace.avgSessionMinutes}min`;

  const progressLine =
    courses.length > 0
      ? courses
          .map((c) => {
            const label = c.courseTitle ?? (c.courseId as string);
            return `${label} progress: ${c.completedLessons}/${c.totalLessons} lessons (${c.completionPct}%)`;
          })
          .join("; ")
      : "No course progress yet";

  const styleTraits: string[] = [style.sessionPattern];
  if (style.videoHeavy) styleTraits.push("video-heavy");
  if (style.codeHeavy) styleTraits.push("code-heavy");
  if (style.nioEngaged) styleTraits.push("Nio-engaged");
  const styleLine = `Style: ${styleTraits.join(", ")}`;

  const parts: string[] = [];
  if (streak.currentStreak > 0)
    parts.push(`${streak.currentStreak}-day streak`);
  parts.push(`${style.sessionPattern} style`);
  if (style.codeHeavy) parts.push("code-heavy");
  if (style.videoHeavy) parts.push("video-heavy");
  if (courses.length > 0) {
    const c = courses[0];
    parts.push(`${c.completionPct}% through course`);
  }
  if (pace.trend !== "insufficient_data") parts.push(`${pace.trend} pace`);

  const summaryLine = `Learner profile: ${parts.join(", ")}`;

  return { summaryLine, streakLine, paceLine, progressLine, styleLine };
};

/**
 * Main entry point: compute the full LearningPulse from raw session
 * and lesson progress data. Pure function — no side effects.
 */
const computeLearningPulse = (input: PulseInput): LearningPulse => {
  const streak = computeStreak(input.sessions, input.now);
  const pace = computePace(input.sessions, input.now);
  const courses = computeCourseProgress(input.lessonProgress, pace);
  const style = computeLearningStyle(input.sessions);
  const nioContext = buildNioContextEnrichment(streak, pace, courses, style);

  return { streak, pace, courses, style, nioContext };
};

export { computeStreak, computePace, computeCourseProgress, computeLearningStyle, buildNioContextEnrichment, computeLearningPulse };
export type {
  LearningSessionInput,
  LessonProgressInput,
  PulseInput,
  StreakInfo,
  PaceInsight,
  CourseProgress,
  LearningStyle,
  NioContextEnrichment,
  LearningPulse,
};
