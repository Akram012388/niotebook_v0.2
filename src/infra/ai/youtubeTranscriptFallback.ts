import { YoutubeTranscript } from "youtube-transcript";

type YtCacheEntry = {
  segments: { startSec: number; endSec: number; text: string }[];
  fetchedAtMs: number;
};

const ytCache = new Map<string, YtCacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

const fetchYoutubeTranscriptWindow = async (args: {
  videoId: string;
  startSec: number;
  endSec: number;
}): Promise<string[]> => {
  const cached = ytCache.get(args.videoId);
  let segments: YtCacheEntry["segments"];

  if (cached && Date.now() - cached.fetchedAtMs < CACHE_TTL_MS) {
    segments = cached.segments;
  } else {
    const raw = await YoutubeTranscript.fetchTranscript(args.videoId, {
      lang: "en",
    });

    segments = raw.map((entry) => ({
      startSec: entry.offset / 1000,
      endSec: (entry.offset + entry.duration) / 1000,
      text: entry.text.replace(/\s+/g, " ").trim(),
    }));

    ytCache.set(args.videoId, { segments, fetchedAtMs: Date.now() });
  }

  return segments
    .filter(
      (segment) =>
        segment.endSec >= args.startSec && segment.startSec <= args.endSec,
    )
    .map((segment) => segment.text)
    .filter((line) => line.length > 0);
};

export { fetchYoutubeTranscriptWindow };
