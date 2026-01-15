import type { GenericId } from "convex/values";

type TranscriptSegment = {
  lessonId: GenericId<"lessons">;
  idx: number;
  startSec: number;
  endSec: number;
  textNormalized: string;
};

type TranscriptWindowSegment = {
  idx: number;
  startSec: number;
  endSec: number;
  textNormalized: string;
};

const TRANSCRIPT_START_PAD_SEC = 5;

const toTranscriptWindowSegments = (
  segments: TranscriptSegment[],
  startSec: number,
  endSec: number
): TranscriptWindowSegment[] => {
  return segments
    .filter((segment) => segment.endSec >= startSec && segment.startSec <= endSec)
    .sort((left, right) => left.idx - right.idx)
    .map((segment) => ({
      idx: segment.idx,
      startSec: segment.startSec,
      endSec: segment.endSec,
      textNormalized: segment.textNormalized
    }));
};

export type { TranscriptSegment, TranscriptWindowSegment };
export { TRANSCRIPT_START_PAD_SEC, toTranscriptWindowSegments };
