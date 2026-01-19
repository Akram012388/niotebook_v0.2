"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import {
  shouldSampleVideoTime,
  type VideoPlaybackState,
} from "../../domain/video";

type VideoPlayerProps = {
  videoId: string;
  initialTimeSec?: number;
  onTimeSample?: (timeSec: number) => void;
  onSeek?: (timeSec: number) => void;
  onPlayState?: (state: VideoPlaybackState) => void;
};

const SAMPLE_INTERVAL_SEC = 3;

const VideoPlayer = ({
  videoId,
  initialTimeSec = 0,
  onTimeSample,
  onSeek,
  onPlayState,
}: VideoPlayerProps): ReactElement => {
  const [currentTimeSec, setCurrentTimeSec] = useState(initialTimeSec);
  const [lastSampleSec, setLastSampleSec] = useState<number | null>(null);
  const [playState, setPlayState] = useState<VideoPlaybackState>("paused");

  const formattedTime = useMemo((): string => {
    const minutes = Math.floor(currentTimeSec / 60);
    const seconds = Math.floor(currentTimeSec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [currentTimeSec]);

  useEffect((): void => {
    setCurrentTimeSec(initialTimeSec);
  }, [initialTimeSec]);

  useEffect((): void => {
    onPlayState?.(playState);
  }, [onPlayState, playState]);

  useEffect(() => {
    if (playState !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + 1;

        if (shouldSampleVideoTime(lastSampleSec, next, SAMPLE_INTERVAL_SEC)) {
          setLastSampleSec(next);
          onTimeSample?.(next);
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [lastSampleSec, onTimeSample, playState]);

  const handlePlay = useCallback((): void => {
    setPlayState("playing");
    onTimeSample?.(currentTimeSec);
  }, [currentTimeSec, onTimeSample]);

  const handlePause = useCallback((): void => {
    setPlayState("paused");
    onTimeSample?.(currentTimeSec);
  }, [currentTimeSec, onTimeSample]);

  const handleSeek = useCallback(
    (delta: number): void => {
      const wasPlaying = playState === "playing";
      setCurrentTimeSec((prev) => {
        const next = Math.max(0, prev + delta);
        onSeek?.(next);
        onTimeSample?.(next);
        setLastSampleSec(next);
        return next;
      });
      setTimeout(() => {
        if (wasPlaying) {
          setPlayState("playing");
        }
      }, 0);
    },
    [onSeek, onTimeSample, playState],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-xs text-text-muted">
        <div className="flex flex-col items-center gap-2">
          <span>Video placeholder ({videoId})</span>
          <span className="text-[11px] text-text-subtle">
            {playState === "playing" ? "Playing" : "Paused"} · {formattedTime}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlay}
            className="rounded-full border border-border px-3 py-1"
          >
            Play
          </button>
          <button
            type="button"
            onClick={handlePause}
            className="rounded-full border border-border px-3 py-1"
          >
            Pause
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSeek(-10)}
            className="rounded-full border border-border px-3 py-1"
          >
            -10s
          </button>
          <button
            type="button"
            onClick={() => handleSeek(10)}
            className="rounded-full border border-border px-3 py-1"
          >
            +10s
          </button>
        </div>
      </div>
    </div>
  );
};

export { VideoPlayer };
