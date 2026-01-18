import { fetchText } from "./http";
import {
  normalizeTranscriptText,
  type ParsedWeek,
  type ParsedWeekLesson,
  type TranscriptParseResult,
  type TranscriptSegmentInput,
} from "../domain/ingest";

const CS50_BASE_URL = "https://cs50.harvard.edu";

const CS50_X_WEEKS_URL = `${CS50_BASE_URL}/x/weeks/`;

type FetchHtmlResult = {
  ok: boolean;
  html: string | null;
  status: number;
};

type FetchSrtResult = {
  ok: boolean;
  srt: string | null;
  status: number;
};

const fetchWeekHtml = async (url: string): Promise<FetchHtmlResult> => {
  const response = await fetchText(url);

  return {
    ok: response.ok,
    html: response.ok ? response.text : null,
    status: response.status,
  };
};

const fetchSrt = async (url: string): Promise<FetchSrtResult> => {
  const response = await fetchText(url);

  return {
    ok: response.ok,
    srt: response.ok ? response.text : null,
    status: response.status,
  };
};

const parseWeekHtml = (slug: string, html: string): ParsedWeek => {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
    : slug;

  const videoMatches = [
    ...html.matchAll(/https:\/\/video\.cs50\.io\/([A-Za-z0-9_-]+)/g),
    ...html.matchAll(/https:\/\/youtu\.be\/([A-Za-z0-9_-]+)/g),
    ...html.matchAll(
      /https?:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/g,
    ),
  ];

  const lessons: ParsedWeekLesson[] = Array.from(
    new Map(videoMatches.map((match) => [match[1], match[1]])).values(),
  ).map((videoId, index) => ({
    title: `Lesson ${index + 1}`,
    videoId,
    durationSec: 0,
    order: index,
  }));

  return { slug, title, lessons };
};

const parseWeekSlugs = (html: string): string[] => {
  const matches = [...html.matchAll(/\/x\/weeks\/([^\/\"\'#\?]+)/g)];
  const slugs = matches
    .map((match) => match[1])
    .filter((slug): slug is string => Boolean(slug))
    .filter((slug) => slug !== "weeks");

  return Array.from(new Set(slugs));
};

const buildWeekUrl = (slug: string): string => {
  return `${CS50_BASE_URL}/x/weeks/${slug}/`;
};

const parseSrtTimestamp = (value: string): number => {
  const [rawTime, millis] = value.split(",");
  const [hours, minutes, seconds] = rawTime.split(":").map(Number);
  const ms = Number(millis);

  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
};

const parseSrt = (raw: string): TranscriptParseResult => {
  const blocks = raw.trim().split(/\n\s*\n/);
  const segments: TranscriptSegmentInput[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split("\n").map((line) => line.trim());
    const timeLine = lines.find((line) => line.includes(" --> "));

    if (!timeLine) {
      return;
    }

    const [startRaw, endRaw] = timeLine.split(" --> ");

    if (!startRaw || !endRaw) {
      return;
    }

    const textLines = lines.filter((line) => line && !line.includes(" --> "));
    const textRaw = textLines.join(" ");
    const textNormalized = normalizeTranscriptText(textRaw);

    segments.push({
      idx,
      startSec: parseSrtTimestamp(startRaw),
      endSec: parseSrtTimestamp(endRaw),
      textRaw,
      textNormalized,
    });
  });

  const durationSec = segments.length
    ? Math.max(...segments.map((segment) => segment.endSec))
    : null;

  return { segments, durationSec, rawSegmentCount: blocks.length };
};

export {
  CS50_BASE_URL,
  CS50_X_WEEKS_URL,
  buildWeekUrl,
  fetchSrt,
  fetchWeekHtml,
  parseSrt,
  parseWeekHtml,
  parseWeekSlugs,
};
