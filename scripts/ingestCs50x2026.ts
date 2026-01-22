import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

const ingestMutation =
  "ingest:ingestCs50x2026" as unknown as FunctionReference<"mutation">;
const clearSegmentsMutation =
  "ingest:clearTranscriptSegmentsBatch" as unknown as FunctionReference<"mutation">;
const ingestSegmentsMutation =
  "ingest:ingestTranscriptSegmentsBatch" as unknown as FunctionReference<"mutation">;
const finalizeMutation =
  "ingest:finalizeTranscriptIngest" as unknown as FunctionReference<"mutation">;

const COURSE_SOURCE_PLAYLIST_ID = "cs50x-2026";
const COURSE_TITLE = "CS50x 2026";
const COURSE_SOURCE_URL = "https://cs50.harvard.edu/x/weeks/";
const COURSE_LICENSE = "CC";
const COURSE_DESCRIPTION = "CS50x 2026 lecture series.";
const INGEST_VERSION = 1;
const MIN_SLUG_COUNT = 3;
const TRANSCRIPT_WARN_THRESHOLD_SEC = 120;
const TRANSCRIPT_MIN_SEGMENT_COUNT = 5;
const TRANSCRIPT_MIN_DURATION_SEC = 60;

const FALLBACK_WEEK_SLUGS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "ai",
];

type LessonMetadata = {
  order: number;
  slug: string;
  title: string;
  videoId: string;
  subtitlesUrl?: string;
  transcriptUrl?: string;
  transcriptSegments?: TranscriptSegment[];
  transcriptDurationSec?: number;
  segmentCount?: number;
  transcriptStatus: "ok" | "warn" | "missing" | "error";
  durationSec: number;
};

type TranscriptSegment = {
  idx: number;
  startSec: number;
  endSec: number;
  textRaw: string;
  textNormalized: string;
};

type LessonIngestMeta = {
  lessonId: string;
  order: number;
  shouldReplaceSegments: boolean;
};

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

const parseYouTubeId = (url: string): string | null => {
  const trimmed = url.trim();
  const matchVideoHost = trimmed.match(
    /(?:video\.cs50\.io|youtu\.be)\/([a-zA-Z0-9_-]{6,})/,
  );
  if (matchVideoHost) {
    return matchVideoHost[1];
  }

  const matchYouTube = trimmed.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (matchYouTube) {
    return matchYouTube[1];
  }

  return null;
};

const parseDurationSec = (segments: TranscriptSegment[]): number => {
  if (!segments.length) {
    return 0;
  }
  return segments.reduce((max, segment) => Math.max(max, segment.endSec), 0);
};

const parseTimestamp = (value: string): number => {
  const match = value.match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!match) {
    return 0;
  }
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const milliseconds = Number(match[4] ?? 0);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
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

const getWeekSlugs = (html: string): string[] => {
  const matches = [...html.matchAll(/href="(\d+|ai)\//g)];
  const slugs = matches.map((match) => match[1] ?? "").filter(Boolean);
  if (slugs.length >= MIN_SLUG_COUNT) {
    return Array.from(new Set(slugs));
  }
  return FALLBACK_WEEK_SLUGS;
};

const extractWeekTitlesFromIndex = (html: string): Map<string, string> => {
  const titles = new Map<string, string>();
  const weekPattern = /<a[^>]+href="(\d+)\/">\s*Week\s*\1\s*<\/a>\s*([^<]+)/gi;
  for (const match of html.matchAll(weekPattern)) {
    const slug = match[1];
    const topic = cleanText(match[2] ?? "");
    if (slug && topic) {
      titles.set(slug, topic);
    }
  }

  const aiMatch = html.match(/<a[^>]+href="ai\/"[^>]*>([^<]+)<\/a>/i);
  if (aiMatch) {
    const topic = cleanText(aiMatch[1] ?? "");
    if (topic) {
      titles.set("ai", topic);
    }
  }

  return titles;
};

const parseOgTitle = (html: string): string | null => {
  const match = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (!match) {
    return null;
  }
  return cleanText(match[1] ?? "");
};

const parseMainTitle = (html: string): string | null => {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  if (!mainMatch) {
    return null;
  }
  const titleMatch = mainMatch[0].match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!titleMatch) {
    return null;
  }
  const titleText = titleMatch[1] ?? "";
  return cleanText(titleText.replace(/<[^>]+>/g, ""));
};

const parseTitleTag = (html: string): string | null => {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) {
    return null;
  }
  return cleanText(match[1] ?? "");
};

const normalizeLessonTitle = (value: string): string => {
  let normalized = value.replace(/\s*[-|–—]\s*CS50x\s*\d{4}$/i, "").trim();
  normalized = normalized.replace(/^Week\s+\d+\s*[:\-–—]?\s*/i, "").trim();
  normalized = normalized.replace(/^Lecture\s+\d+\s*[:\-–—]?\s*/i, "").trim();
  return normalized;
};

const extractWeekTopicFromNav = (html: string, slug: string): string | null => {
  if (!/^\d+$/.test(slug)) {
    return null;
  }

  const pattern = new RegExp(
    `<a[^>]*>\s*Week\s*${slug}\s*<\/a>\s*([^<]+)`,
    "gi",
  );
  const matches = [...html.matchAll(pattern)];
  for (const match of matches) {
    const topic = cleanText(match[1] ?? "");
    if (topic) {
      return topic;
    }
  }
  return null;
};

const parseLessonTitle = (html: string, slug: string): string => {
  const candidates = [
    parseOgTitle(html),
    parseMainTitle(html),
    parseTitleTag(html),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (/this is cs50/i.test(candidate)) {
      continue;
    }
    const normalized = normalizeLessonTitle(candidate);
    if (normalized && !/this is cs50/i.test(normalized)) {
      return normalized;
    }
  }

  const navTopic = extractWeekTopicFromNav(html, slug);
  return navTopic ? normalizeLessonTitle(navTopic) : "";
};

const extractLectureSection = (html: string): string => {
  const lectureIndex = html.indexOf("Lecture");
  if (lectureIndex === -1) {
    return html;
  }
  return html.slice(lectureIndex);
};

const extractUrl = (html: string, pattern: RegExp): string | undefined => {
  const match = html.match(pattern);
  return match ? match[1] : undefined;
};

const extractCoursePlaylistUrl = (html: string): string | undefined => {
  const match = html.match(
    /https:\/\/www\.youtube\.com\/playlist\?list=[^"\s]+/,
  );
  return match ? match[0] : undefined;
};

const extractLabeledUrl = (html: string, label: string): string | undefined => {
  const pattern = new RegExp(
    `<a[^>]+href="(https?:\\/\\/[^\"]+)"[^>]*>\\s*${label}\\s*<\\/a>`,
    "i",
  );
  return extractUrl(html, pattern);
};

const pickVideoUrl = (candidates: Array<string | undefined>): string | null => {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    if (parseYouTubeId(candidate)) {
      return candidate;
    }
  }
  return null;
};

const parseLectureResources = (
  html: string,
): {
  videoId: string;
  subtitlesUrl?: string;
  transcriptUrl?: string;
} => {
  const lectureHtml = extractLectureSection(html);
  const labeledYouTubeUrl = extractLabeledUrl(lectureHtml, "YouTube");
  const labeledPlayerUrl = extractLabeledUrl(lectureHtml, "CS50 Video Player");
  const videoUrl =
    labeledYouTubeUrl ||
    labeledPlayerUrl ||
    extractUrl(lectureHtml, /href="(https:\/\/video\.cs50\.io\/[^"]+)"/) ||
    extractUrl(lectureHtml, /href="(https:\/\/youtu\.be\/[^"]+)"/) ||
    extractUrl(
      lectureHtml,
      /href="(https:\/\/www\.youtube\.com\/watch\?v=[^"]+)"/,
    );

  if (!videoUrl) {
    throw new Error("Lecture video URL not found.");
  }

  let videoId = parseYouTubeId(videoUrl);

  if (!videoId) {
    const fallbackUrl = pickVideoUrl([
      labeledYouTubeUrl,
      labeledPlayerUrl,
      extractUrl(lectureHtml, /href="(https:\/\/video\.cs50\.io\/[^\"]+)"/),
      extractUrl(lectureHtml, /href="(https:\/\/youtu\.be\/[^\"]+)"/),
      extractUrl(
        lectureHtml,
        /href="(https:\/\/www\.youtube\.com\/watch\?v=[^\"]+)"/,
      ),
    ]);

    if (fallbackUrl) {
      videoId = parseYouTubeId(fallbackUrl);
    }
  }

  if (!videoId) {
    throw new Error("Unable to extract YouTube ID.");
  }

  const subtitlesUrl =
    extractUrl(
      lectureHtml,
      /href="(https:\/\/cdn\.cs50\.net\/[^\"]+\/lang\/en\/[^\"]+\.srt)"/,
    ) ||
    extractUrl(
      lectureHtml,
      /href="(https:\/\/cdn\.cs50\.net\/[^\"]+\/lang\/[^\"]+\/[^\"]+\.srt)"/,
    );

  const transcriptUrl = extractUrl(
    lectureHtml,
    /href="(https:\/\/cdn\.cs50\.net\/[^\"]+\/lang\/en\/[^\"]+\.txt)"/,
  );

  return { videoId, subtitlesUrl, transcriptUrl };
};

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.text();
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.text();
};

const parseWeekLesson = async (
  slug: string,
  order: number,
  fallbackTitle?: string,
): Promise<LessonMetadata> => {
  const url = `https://cs50.harvard.edu/x/weeks/${slug}/`;
  const html = await fetchHtml(url);
  const title =
    parseLessonTitle(html, slug) ||
    (fallbackTitle ? normalizeLessonTitle(fallbackTitle) : "") ||
    `Week ${slug}`;
  const { videoId, subtitlesUrl, transcriptUrl } = parseLectureResources(html);

  if (!subtitlesUrl) {
    return {
      order,
      slug,
      title,
      videoId,
      subtitlesUrl,
      transcriptUrl,
      transcriptStatus: "missing",
      durationSec: 0,
    };
  }

  try {
    const srtText = await fetchText(subtitlesUrl);
    const segments = parseSrt(srtText);
    const transcriptDurationSec = parseDurationSec(segments);
    const segmentCount = segments.length;
    const transcriptStatus =
      transcriptDurationSec >= TRANSCRIPT_MIN_DURATION_SEC &&
      segmentCount >= TRANSCRIPT_MIN_SEGMENT_COUNT
        ? "ok"
        : "error";
    const durationSec = transcriptDurationSec;

    return {
      order,
      slug,
      title,
      videoId,
      subtitlesUrl,
      transcriptUrl,
      transcriptSegments: segments,
      transcriptDurationSec,
      segmentCount,
      transcriptStatus,
      durationSec,
    };
  } catch {
    return {
      order,
      slug,
      title,
      videoId,
      subtitlesUrl,
      transcriptUrl,
      transcriptStatus: "error",
      durationSec: 0,
    };
  }
};

const buildLessonMetadata = (lesson: LessonMetadata): LessonMetadata => {
  if (!lesson.transcriptDurationSec) {
    return lesson;
  }

  if (
    Math.abs(lesson.durationSec - lesson.transcriptDurationSec) >
    TRANSCRIPT_WARN_THRESHOLD_SEC
  ) {
    return {
      ...lesson,
      transcriptStatus: "warn",
    };
  }

  return lesson;
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const runIngest = async (): Promise<void> => {
  const convexUrl = getEnvValue("CONVEX_URL");
  const allowProdIngest = process.env.NIOTEBOOK_ALLOW_PROD_INGEST === "true";
  const ingestToken = process.env.NIOTEBOOK_INGEST_TOKEN;

  if (process.env.NODE_ENV === "production" && !allowProdIngest) {
    throw new Error("Production ingest requires NIOTEBOOK_ALLOW_PROD_INGEST.");
  }

  const client = new ConvexHttpClient(convexUrl, {
    skipConvexDeploymentUrlCheck: true,
  });

  const weeksHtml = await fetchHtml(COURSE_SOURCE_URL);
  const slugs = getWeekSlugs(weeksHtml);
  const navTitles = extractWeekTitlesFromIndex(weeksHtml);
  const youtubePlaylistUrl = extractCoursePlaylistUrl(weeksHtml);
  const lessons: LessonMetadata[] = [];

  for (let index = 0; index < slugs.length; index += 1) {
    const slug = slugs[index] ?? "";
    const order = index + 1;
    const lesson = await parseWeekLesson(slug, order, navTitles.get(slug));
    lessons.push(buildLessonMetadata(lesson));
  }

  const coursePayload = {
    sourcePlaylistId: COURSE_SOURCE_PLAYLIST_ID,
    title: COURSE_TITLE,
    description: COURSE_DESCRIPTION,
    license: COURSE_LICENSE,
    sourceUrl: COURSE_SOURCE_URL,
    ...(youtubePlaylistUrl ? { youtubePlaylistUrl } : {}),
  };

  const payload = {
    course: coursePayload,
    lessons: lessons.map((lesson) => ({
      order: lesson.order,
      title: lesson.title,
      videoId: lesson.videoId,
      durationSec: lesson.durationSec,
      subtitlesUrl: lesson.subtitlesUrl,
      transcriptUrl: lesson.transcriptUrl,
      transcriptDurationSec: lesson.transcriptDurationSec,
      segmentCount: lesson.segmentCount,
      ingestVersion: INGEST_VERSION,
      transcriptStatus: lesson.transcriptStatus,
    })),
  };

  const ingestMeta = (await client.mutation(ingestMutation, {
    ...payload,
    ingestToken: ingestToken ?? undefined,
  } as never)) as LessonIngestMeta[];

  const lessonByOrder = new Map<number, LessonIngestMeta>();
  for (const meta of ingestMeta) {
    lessonByOrder.set(meta.order, meta);
  }

  for (const lesson of lessons) {
    const meta = lessonByOrder.get(lesson.order);
    if (!meta || !meta.shouldReplaceSegments) {
      continue;
    }

    let cursor: string | null = null;
    do {
      const response = (await client.mutation(clearSegmentsMutation, {
        lessonId: meta.lessonId,
        cursor: cursor ?? undefined,
        limit: 500,
        ingestToken: ingestToken ?? undefined,
      } as never)) as { nextCursor: string | null; cleared: number };
      cursor = response.nextCursor;
    } while (cursor);

    const chunks = chunkArray(lesson.transcriptSegments ?? [], 500);
    for (const chunk of chunks) {
      await client.mutation(ingestSegmentsMutation, {
        lessonId: meta.lessonId,
        segments: chunk,
        ingestToken: ingestToken ?? undefined,
      } as never);
    }

    await client.mutation(finalizeMutation, {
      lessonId: meta.lessonId,
      ingestVersion: INGEST_VERSION,
      transcriptStatus: lesson.transcriptStatus,
      transcriptDurationSec: lesson.transcriptDurationSec,
      segmentCount: lesson.segmentCount,
      durationSec: lesson.durationSec,
      ingestToken: ingestToken ?? undefined,
    } as never);
  }
};

runIngest().catch((error) => {
  process.stdout.write(`${String(error)}\n`);
  process.exit(1);
});
