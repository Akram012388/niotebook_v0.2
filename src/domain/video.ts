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

type VideoTimeInput = {
  currentSec: number;
  lastSampleSec: number | null;
  intervalSec: number;
};

const clampVideoTime = (timeSec: number): number => {
  if (!Number.isFinite(timeSec)) {
    return 0;
  }

  return Math.max(0, Math.floor(timeSec));
};

const shouldPersistVideoTime = ({
  currentSec,
  lastSampleSec,
  intervalSec,
}: VideoTimeInput): boolean => {
  return shouldSampleVideoTime(lastSampleSec, currentSec, intervalSec);
};

export type {
  VideoPlaybackState,
  VideoSeekEvent,
  VideoTimeSample,
  VideoTimeInput,
};
export { clampVideoTime, shouldPersistVideoTime, shouldSampleVideoTime };
