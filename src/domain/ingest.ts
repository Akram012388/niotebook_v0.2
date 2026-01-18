import type { CourseId, LessonId } from "./ids";

const MAX_TRANSCRIPT_DURATION_MISMATCH_SEC = 120;

type TranscriptSegmentInput = {
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

type TranscriptIngestResult = {
  status: "ok" | "warn" | "missing" | "error";
  segmentCount: number;
  transcriptDurationSec: number | null;
  durationMismatchSec: number | null;
};

type CourseSeed = {
  title: string;
  sourcePlaylistId: string;
  sourceUrl: string;
  license: string;
  description?: string;
};

type LessonSeed = {
  courseId: CourseId;
  videoId: string;
  title: string;
  durationSec: number;
  order: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
};

type ParsedWeekLesson = {
  title: string;
  videoId: string;
  durationSec: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
};

type ParsedWeek = {
  slug: string;
  title: string;
  lessons: ParsedWeekLesson[];
};

type CourseSeedPayload = {
  course: CourseSeed;
  lessons: LessonSeed[];
};

type TranscriptParseResult = {
  segments: TranscriptSegmentInput[];
  durationSec: number | null;
  rawSegmentCount: number;
};

type LessonTranscriptPayload = {
  lessonId: LessonId;
  ingestVersion: number;
  lessonDurationSec: number;
  transcriptUrl: string;
  subtitlesUrl?: string;
};

type TranscriptIngestPayload = {
  lesson: LessonTranscriptPayload;
  segments: TranscriptSegmentInput[];
  transcriptDurationSec: number | null;
};

const normalizeTranscriptText = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const computeTranscriptDurationSec = (
  segments: TranscriptSegmentInput[],
): number | null => {
  if (segments.length === 0) {
    return null;
  }

  return Math.max(...segments.map((segment) => segment.endSec));
};

const evaluateTranscriptIngest = (
  segments: TranscriptSegmentInput[],
  lessonDurationSec: number,
): TranscriptIngestResult => {
  const segmentCount = segments.length;

  if (segmentCount === 0) {
    return {
      status: "missing",
      segmentCount: 0,
      transcriptDurationSec: null,
      durationMismatchSec: null,
    };
  }

  const transcriptDurationSec = computeTranscriptDurationSec(segments);

  if (transcriptDurationSec === null) {
    return {
      status: "error",
      segmentCount,
      transcriptDurationSec: null,
      durationMismatchSec: null,
    };
  }

  const durationMismatchSec = Math.abs(
    lessonDurationSec - transcriptDurationSec,
  );

  if (durationMismatchSec > MAX_TRANSCRIPT_DURATION_MISMATCH_SEC) {
    return {
      status: "warn",
      segmentCount,
      transcriptDurationSec,
      durationMismatchSec,
    };
  }

  return {
    status: "ok",
    segmentCount,
    transcriptDurationSec,
    durationMismatchSec,
  };
};

export type {
  CourseSeed,
  CourseSeedPayload,
  LessonSeed,
  ParsedWeek,
  ParsedWeekLesson,
  TranscriptIngestPayload,
  TranscriptIngestResult,
  TranscriptParseResult,
  TranscriptSegmentInput,
  LessonTranscriptPayload,
};
export {
  MAX_TRANSCRIPT_DURATION_MISMATCH_SEC,
  computeTranscriptDurationSec,
  evaluateTranscriptIngest,
  normalizeTranscriptText,
};
