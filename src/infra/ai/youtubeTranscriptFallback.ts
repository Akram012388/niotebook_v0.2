type YtCacheEntry = {
  segments: { startSec: number; endSec: number; text: string }[];
  fetchedAtMs: number;
};

type InnertubeTrack = {
  baseUrl: string;
  languageCode: string;
  kind?: string;
};

/**
 * In-memory cache for fetched YouTube caption segments, keyed by video ID.
 * Entries expire after CACHE_TTL_MS (15 minutes) to avoid redundant innertube
 * API calls for the same video within a short window.
 *
 * NOTE: This is a module-level cache. In serverless/edge environments (e.g. Next.js
 * API routes) it resets on cold starts and is not shared across function instances.
 * It provides best-effort deduplication within a single server instance's lifetime.
 */
const ytCache = new Map<string, YtCacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

const INNERTUBE_PLAYER_URL = "https://www.youtube.com/youtubei/v1/player";
const INNERTUBE_CONTEXT = {
  client: { clientName: "ANDROID", clientVersion: "19.29.37", hl: "en" },
};

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/**
 * Pick the best English caption track.
 * Preference: manual en → manual en-US/en-GB → auto-generated en.
 */
const pickEnglishTrack = (tracks: InnertubeTrack[]): InnertubeTrack | null => {
  const manualEn = tracks.find(
    (t) => t.languageCode === "en" && t.kind !== "asr",
  );
  if (manualEn) return manualEn;

  const manualEnVariant = tracks.find(
    (t) => t.languageCode.startsWith("en") && t.kind !== "asr",
  );
  if (manualEnVariant) return manualEnVariant;

  const asrEn = tracks.find(
    (t) => t.languageCode.startsWith("en") && t.kind === "asr",
  );
  if (asrEn) return asrEn;

  return null;
};

/**
 * Fetch caption segments from YouTube via the innertube /player API.
 *
 * The `youtube-transcript` npm package stopped working because YouTube
 * now returns empty bodies for server-side timedtext requests obtained
 * from the web player config.  The Android innertube client still returns
 * valid caption URLs that serve content.
 */
const fetchAllSegments = async (
  videoId: string,
): Promise<YtCacheEntry["segments"]> => {
  const playerRes = await fetch(INNERTUBE_PLAYER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "com.google.android.youtube/19.29.37 (Linux; U; Android 14)",
    },
    body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
  });

  if (!playerRes.ok) {
    return [];
  }

  const data = (await playerRes.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: InnertubeTrack[];
      };
    };
  };

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    return [];
  }

  const track = pickEnglishTrack(tracks);
  if (!track) {
    return [];
  }

  const captionRes = await fetch(track.baseUrl);
  if (!captionRes.ok) {
    return [];
  }

  const xml = await captionRes.text();
  if (xml.length === 0) {
    return [];
  }

  const segments: YtCacheEntry["segments"] = [];
  const regex = /<p t="(\d+)" d="(\d+)">([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    const tMs = parseInt(match[1], 10);
    const dMs = parseInt(match[2], 10);
    const text = decodeHtmlEntities(match[3]);
    if (text.length > 0) {
      segments.push({
        startSec: tMs / 1000,
        endSec: (tMs + dMs) / 1000,
        text,
      });
    }
  }

  return segments;
};

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
    segments = await fetchAllSegments(args.videoId);
    if (segments.length === 0) {
      console.warn(
        `[youtubeTranscriptFallback] Empty response for ${args.videoId} — ` +
          `Innertube client version ${INNERTUBE_CONTEXT.client.clientVersion} may be deprecated.`,
      );
    }
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

/** Clears the YouTube transcript cache. Intended for test isolation only. Do not call in production code. */
const clearYtCache = (): void => {
  ytCache.clear();
};

export { fetchYoutubeTranscriptWindow, clearYtCache };
