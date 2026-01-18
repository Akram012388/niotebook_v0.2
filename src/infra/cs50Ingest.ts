import { fetchText } from "./http";
import {
  normalizeTranscriptText,
  type ParsedWeek,
  type ParsedWeekLesson,
  type TranscriptParseResult,
  type TranscriptSegmentInput,
} from "../domain/ingest";

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
  const title = titleMatch ? titleMatch[1].trim() : slug;

  const lessonMatches = [...html.matchAll(/data-video-id="([^"]+)"/g)];
  const lessons: ParsedWeekLesson[] = lessonMatches.map((match, index) => {
    const videoId = match[1];

    return {
      title: `Lesson ${index + 1}`,
      videoId,
      durationSec: 0,
    };
  });

  return { slug, title, lessons };
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

export { fetchSrt, fetchWeekHtml, parseSrt, parseWeekHtml };
