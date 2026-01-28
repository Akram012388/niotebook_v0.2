import { spawnSync } from "node:child_process";

type CourseSummary = {
  id: string;
  sourcePlaylistId: string;
};

type LessonSummary = {
  id: string;
  order: number;
  subtitlesUrl?: string;
};

type TranscriptWindowSegment = {
  textNormalized: string;
};

const DEFAULT_LESSON_ID = "k170tmrc8zxxqtabctyddvhhqx7zkgae";
const COURSE_SOURCE_PLAYLIST_ID = "cs50x-2026";

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required for transcript verification.`);
  }
  return value;
};

const runConvex = (
  functionName: string,
  args: Record<string, unknown>,
): unknown => {
  const result = spawnSync(
    "npx",
    ["convex", "run", functionName, JSON.stringify(args)],
    {
      stdio: "pipe",
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim() ?? "";
    throw new Error(stderr || `Convex run failed for ${functionName}.`);
  }

  const stdout = result.stdout?.toString().trim() ?? "";
  if (!stdout) {
    return null;
  }

  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`Failed to parse ${functionName} output: ${stdout}`);
  }
};

const resolveCourseId = (courses: CourseSummary[]): string => {
  const match = courses.find(
    (course) => course.sourcePlaylistId === COURSE_SOURCE_PLAYLIST_ID,
  );
  if (!match) {
    throw new Error("CS50x course not found in Convex.");
  }
  return match.id;
};

const resolveLectureZeroLessonId = (lessons: LessonSummary[]): string => {
  const fromSubtitle = lessons.find((lesson) =>
    lesson.subtitlesUrl?.includes("/lectures/0/"),
  );
  if (fromSubtitle) {
    return fromSubtitle.id;
  }

  const fromOrder = lessons.find((lesson) => lesson.order === 1);
  if (fromOrder) {
    return fromOrder.id;
  }

  throw new Error("Lecture 0 lesson not found in Convex.");
};

const assertTranscriptWindow = async (args: {
  label: string;
  lessonId: string;
  startSec: number;
  endSec: number;
}): Promise<void> => {
  const result = runConvex("transcripts:getTranscriptWindow", {
    lessonId: args.lessonId,
    startSec: args.startSec,
    endSec: args.endSec,
  }) as TranscriptWindowSegment[] | null;

  const count = Array.isArray(result) ? result.length : 0;
  if (count === 0) {
    throw new Error(
      `Transcript window empty for ${args.label} (${args.startSec}-${args.endSec}).`,
    );
  }

  console.log(
    `Verified ${args.label}: ${count} transcript segments (${args.startSec}-${args.endSec}).`,
  );
};

const main = async (): Promise<void> => {
  ensureEnv("CONVEX_URL");
  const lessonId =
    process.env.NEXT_PUBLIC_DEFAULT_LESSON_ID ?? DEFAULT_LESSON_ID;

  const courses = runConvex("content:getCourses", {}) as CourseSummary[];
  const courseId = resolveCourseId(courses);
  const lessons = runConvex("content:getLessonsByCourse", {
    courseId,
  }) as LessonSummary[];
  const lectureZeroLessonId = resolveLectureZeroLessonId(lessons);

  await assertTranscriptWindow({
    label: "Lecture 10",
    lessonId,
    startSec: 960,
    endSec: 1020,
  });

  await assertTranscriptWindow({
    label: "Lecture 0",
    lessonId: lectureZeroLessonId,
    startSec: 0,
    endSec: 60,
  });
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
