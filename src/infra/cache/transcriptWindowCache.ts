import type { TranscriptWindowSegment } from "../../domain/transcript";

const transcriptWindowCache = new Map<string, TranscriptWindowSegment[]>();
const transcriptWindowRangeCache = new Map<
  string,
  { startSec: number; endSec: number }
>();

const getTranscriptWindowCacheKey = (lessonId: string): string => {
  return lessonId;
};

const cacheTranscriptWindowMemory = (
  lessonId: string,
  startSec: number,
  endSec: number,
  segments: TranscriptWindowSegment[],
): void => {
  const key = getTranscriptWindowCacheKey(lessonId);
  transcriptWindowCache.set(key, segments);
  transcriptWindowRangeCache.set(key, { startSec, endSec });
};

const getCachedTranscriptWindowMemory = (
  lessonId: string,
): {
  startSec: number;
  endSec: number;
  segments: TranscriptWindowSegment[];
} | null => {
  const key = getTranscriptWindowCacheKey(lessonId);
  const segments = transcriptWindowCache.get(key);
  const range = transcriptWindowRangeCache.get(key);

  if (!segments || !range) {
    return null;
  }

  return {
    startSec: range.startSec,
    endSec: range.endSec,
    segments,
  };
};

export { cacheTranscriptWindowMemory, getCachedTranscriptWindowMemory };
