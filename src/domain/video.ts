type VideoPlaybackState = "idle" | "playing" | "paused";

type VideoSeekEvent = {
  timeSec: number;
};

type VideoTimeSample = {
  timeSec: number;
  sampledAt: number;
};

const shouldSampleVideoTime = (
  lastSampleSec: number | null,
  nextSampleSec: number,
  intervalSec: number,
): boolean => {
  if (lastSampleSec === null) {
    return true;
  }

  return Math.abs(nextSampleSec - lastSampleSec) >= intervalSec;
};

export type { VideoPlaybackState, VideoSeekEvent, VideoTimeSample };
export { shouldSampleVideoTime };
