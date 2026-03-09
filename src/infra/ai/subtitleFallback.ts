type SubtitleSegment = {
  startSec: number;
  endSec: number;
  text: string;
};

type SubtitleCacheEntry = {
  segments: SubtitleSegment[];
  fetchedAtMs: number;
};

/**
 * In-memory cache for fetched and parsed SRT subtitle segments, keyed by subtitle URL.
 * Entries expire after CACHE_TTL_MS (15 minutes) to avoid serving stale content.
 *
 * NOTE: This is a module-level cache. In serverless/edge environments (e.g. Next.js
 * API routes) it resets on cold starts and is not shared across function instances.
 * It provides best-effort deduplication within a single server instance's lifetime.
 */
const subtitleCache = new Map<string, SubtitleCacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

const ALLOWED_SUBTITLE_HOSTNAMES = new Set(["cdn.cs50.net"]);

const validateSubtitleUrl = (url: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid subtitle URL`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`Subtitle URL must use HTTPS`);
  }

  if (!ALLOWED_SUBTITLE_HOSTNAMES.has(parsed.hostname)) {
    throw new Error(
      `Subtitle URL hostname not in allowlist: ${parsed.hostname}`,
    );
  }
};

const cleanText = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
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

const parseSrt = (content: string): SubtitleSegment[] => {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const segments: SubtitleSegment[] = [];
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

    const text = cleanText(textLines.join(" "));
    if (text) {
      segments.push({ startSec, endSec, text });
    }

    index += 1;
  }

  return segments;
};

const getCachedSegments = (url: string): SubtitleSegment[] | null => {
  const cached = subtitleCache.get(url);
  if (!cached) {
    return null;
  }
  if (Date.now() - cached.fetchedAtMs > CACHE_TTL_MS) {
    subtitleCache.delete(url);
    return null;
  }
  return cached.segments;
};

const fetchSubtitleSegments = async (
  url: string,
): Promise<SubtitleSegment[]> => {
  const cached = getCachedSegments(url);
  if (cached) {
    return cached;
  }

  validateSubtitleUrl(url);

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const content = await response.text();
  const segments = parseSrt(content);
  subtitleCache.set(url, { segments, fetchedAtMs: Date.now() });
  return segments;
};

const buildSubtitleWindow = (
  segments: SubtitleSegment[],
  startSec: number,
  endSec: number,
): string[] => {
  return segments
    .filter(
      (segment) => segment.endSec >= startSec && segment.startSec <= endSec,
    )
    .map((segment) => segment.text)
    .filter((line) => line.length > 0);
};

const fetchSubtitleWindow = async (args: {
  subtitlesUrl: string;
  startSec: number;
  endSec: number;
}): Promise<string[]> => {
  const segments = await fetchSubtitleSegments(args.subtitlesUrl);
  if (segments.length === 0) {
    return [];
  }

  return buildSubtitleWindow(segments, args.startSec, args.endSec);
};

/** Clears the subtitle cache. Primarily useful for test isolation. */
const clearSubtitleCache = (): void => {
  subtitleCache.clear();
};

export { fetchSubtitleWindow, clearSubtitleCache };
