/**
 * Ingest pipeline — Step 2b: Other CS50 courses
 *
 * Re-ingests SRT transcripts for CS50P, CS50AI, CS50SQL, and CS50W.
 * Requires those courses to already exist in Convex (run Step 1 first).
 * Calls patchLessonUrls + ingestTranscriptSegmentsBatch on Convex.
 *
 * Usage: CONVEX_URL=<url> bun ./scripts/ingest-cs50-transcripts.ts
 */
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

const patchLessonUrlsMutation =
  "ingest:patchLessonUrls" as unknown as FunctionReference<"mutation">;
const clearSegmentsMutation =
  "ingest:clearTranscriptSegmentsBatch" as unknown as FunctionReference<"mutation">;
const ingestSegmentsMutation =
  "ingest:ingestTranscriptSegmentsBatch" as unknown as FunctionReference<"mutation">;
const finalizeMutation =
  "ingest:finalizeTranscriptIngest" as unknown as FunctionReference<"mutation">;
const getCoursesFn =
  "content:getCourses" as unknown as FunctionReference<"query">;
const getLessonsByCourseRef =
  "content:getLessonsByCourse" as unknown as FunctionReference<"query">;

const INGEST_VERSION = 1;
const TRANSCRIPT_MIN_SEGMENT_COUNT = 5;
const TRANSCRIPT_MIN_DURATION_SEC = 60;
const SEGMENT_BATCH_SIZE = 500;
const CLEAR_BATCH_SIZE = 500;

type CourseConfig = {
  sourcePlaylistId: string;
  coursePageBase: string;
  weekSlugs: string[];
};

type TranscriptSegment = {
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

type CourseSummary = {
  id: string;
  title: string;
  sourcePlaylistId: string;
};

type LessonSummary = {
  id: string;
  title: string;
  order: number;
  videoId: string;
  durationSec: number;
  subtitlesUrl?: string;
  transcriptUrl?: string;
  transcriptStatus?: string;
  segmentCount?: number;
};

const COURSE_CONFIGS: CourseConfig[] = [
  {
    sourcePlaylistId: "PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V",
    coursePageBase: "https://cs50.harvard.edu/python/2022/weeks/",
    weekSlugs: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  {
    sourcePlaylistId: "PLhQjrBD2T381PopUTYtMSstgk-hsTGkVm",
    coursePageBase: "https://cs50.harvard.edu/ai/2024/weeks/",
    weekSlugs: ["0", "1", "2", "3", "4", "5", "6"],
  },
  {
    sourcePlaylistId: "PLhQjrBD2T382v1MBjNOhPu9SiJ1fsD4C0",
    coursePageBase: "https://cs50.harvard.edu/sql/2024/weeks/",
    weekSlugs: ["0", "1", "2", "3", "4", "5", "6"],
  },
  {
    sourcePlaylistId: "PLhQjrBD2T380xvFSUmToMMzERZ3qB5Ueu",
    coursePageBase: "https://cs50.harvard.edu/web/2020/weeks/",
    weekSlugs: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
  },
];

const getEnvValue = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
};

const cleanText = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const normalizeTranscriptText = (value: string): string => {
  return cleanText(value).toLowerCase();
};

const parseTimestamp = (value: string): number => {
  const match = value.match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!match) {
    return 0;
  }
  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0) +
    Number(match[4] ?? 0) / 1000
  );
};

const parseSrt = (content: string): TranscriptSegment[] => {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const segments: TranscriptSegment[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    if (!line) {
      index += 1;
      continue;
    }

    if (/^\d+$/.test(line)) {
      index += 1;
    }

    const timeLine = lines[index]?.trim() ?? "";
    const timeMatch = timeLine.match(
      /(\d+:\d+:\d+,\d+)\s+-->\s+(\d+:\d+:\d+,\d+)/,
    );
    if (!timeMatch) {
      index += 1;
      continue;
    }

    const startSec = parseTimestamp(timeMatch[1] ?? "0:00:00,000");
    const endSec = parseTimestamp(timeMatch[2] ?? "0:00:00,000");
    index += 1;

    const textLines: string[] = [];
    while (index < lines.length && (lines[index]?.trim() ?? "") !== "") {
      textLines.push(lines[index] ?? "");
      index += 1;
    }

    const textRaw = cleanText(textLines.join(" "));
    if (textRaw) {
      segments.push({
        idx: segments.length + 1,
        startSec,
        endSec,
        textRaw,
        textNormalized: normalizeTranscriptText(textRaw),
      });
    }

    index += 1;
  }

  return segments;
};

const parseDurationSec = (segments: TranscriptSegment[]): number => {
  if (!segments.length) {
    return 0;
  }
  return segments.reduce((max, segment) => Math.max(max, segment.endSec), 0);
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

const extractSrtUrl = (html: string): string | undefined => {
  const match = html.match(/href="(https?:\/\/cdn\.cs50\.net[^"]*\.srt)"/i);
  return match ? match[1] : undefined;
};

const extractTxtUrl = (html: string): string | undefined => {
  const match = html.match(
    /href="(https?:\/\/cdn\.cs50\.net[^"]*lang\/en\/[^"]*\.txt)"/i,
  );
  return match ? match[1] : undefined;
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const runIngest = async (): Promise<void> => {
  const convexUrl = getEnvValue("CONVEX_URL");
  const ingestToken = process.env.NIOTEBOOK_INGEST_TOKEN;

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NIOTEBOOK_ALLOW_PROD_INGEST !== "true"
  ) {
    throw new Error("Production ingest requires NIOTEBOOK_ALLOW_PROD_INGEST.");
  }

  const client = new ConvexHttpClient(convexUrl, {
    skipConvexDeploymentUrlCheck: true,
  });

  const courses = (await client.query(getCoursesFn, {})) as CourseSummary[];

  for (const config of COURSE_CONFIGS) {
    const course = courses.find(
      (c) => c.sourcePlaylistId === config.sourcePlaylistId,
    );
    if (!course) {
      console.log(`[skip] Course not found: ${config.sourcePlaylistId}`);
      continue;
    }

    console.log(`\n=== ${course.title} ===`);

    const lessons = (await client.query(getLessonsByCourseRef, {
      courseId: course.id,
    })) as LessonSummary[];

    const lessonByOrder = new Map<number, LessonSummary>();
    for (const lesson of lessons) {
      lessonByOrder.set(lesson.order, lesson);
    }

    for (let i = 0; i < config.weekSlugs.length; i++) {
      const slug = config.weekSlugs[i] ?? "";
      const order = i;
      const lesson = lessonByOrder.get(order);

      if (!lesson) {
        console.log(`  [skip] No lesson at order=${order} for week ${slug}`);
        continue;
      }

      const weekUrl = `${config.coursePageBase}${slug}/`;
      let html: string;
      try {
        html = await fetchText(weekUrl);
      } catch {
        console.log(`  [skip] Failed to fetch ${weekUrl}`);
        continue;
      }

      const srtUrl = extractSrtUrl(html);
      const txtUrl = extractTxtUrl(html);

      if (!srtUrl) {
        console.log(`  [skip] ${lesson.title}: no SRT found`);
        continue;
      }

      console.log(`  [ingest] ${lesson.title}: ${srtUrl}`);

      // Update lesson URLs
      await client.mutation(patchLessonUrlsMutation, {
        lessonId: lesson.id,
        subtitlesUrl: srtUrl.replace(/^http:/, "https:"),
        transcriptUrl: txtUrl?.replace(/^http:/, "https:"),
        ingestToken: ingestToken ?? undefined,
      } as never);

      // Fetch and parse SRT
      let segments: TranscriptSegment[];
      try {
        const srtText = await fetchText(srtUrl);
        segments = parseSrt(srtText);
      } catch (err) {
        console.log(
          `  [error] Failed to parse SRT: ${err instanceof Error ? err.message : err}`,
        );
        continue;
      }

      const transcriptDurationSec = parseDurationSec(segments);
      const segmentCount = segments.length;
      const transcriptStatus =
        transcriptDurationSec >= TRANSCRIPT_MIN_DURATION_SEC &&
        segmentCount >= TRANSCRIPT_MIN_SEGMENT_COUNT
          ? "ok"
          : "error";

      console.log(
        `    ${segmentCount} segments, ${Math.round(transcriptDurationSec)}s, status=${transcriptStatus}`,
      );

      // Clear existing segments for this lesson
      let cursor: string | null = null;
      let lastCursor: string | null = null;
      do {
        const response = (await client.mutation(clearSegmentsMutation, {
          lessonId: lesson.id,
          cursor: cursor ?? undefined,
          limit: CLEAR_BATCH_SIZE,
          ingestToken: ingestToken ?? undefined,
        } as never)) as { nextCursor: string | null; cleared: number };
        if (response.cleared === 0) {
          cursor = null;
          break;
        }
        lastCursor = cursor;
        cursor = response.nextCursor;
        if (cursor && cursor === lastCursor) {
          cursor = null;
        }
      } while (cursor);

      // Insert segments in batches
      const chunks = chunkArray(segments, SEGMENT_BATCH_SIZE);
      for (const chunk of chunks) {
        await client.mutation(ingestSegmentsMutation, {
          lessonId: lesson.id,
          segments: chunk,
          ingestToken: ingestToken ?? undefined,
        } as never);
      }

      // Finalize
      await client.mutation(finalizeMutation, {
        lessonId: lesson.id,
        ingestVersion: INGEST_VERSION,
        transcriptStatus,
        transcriptDurationSec,
        segmentCount,
        durationSec: transcriptDurationSec || lesson.durationSec,
        ingestToken: ingestToken ?? undefined,
      } as never);

      console.log(`    done`);
    }
  }

  console.log("\nIngestion complete.");
};

runIngest().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exit(1);
});
