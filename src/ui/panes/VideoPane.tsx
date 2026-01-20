import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useQuery } from "convex/react";
import type { VideoPlaybackState } from "../../domain/video";
import { VideoPlayer } from "../video/VideoPlayer";
import { useVideoFrame } from "../video/useVideoFrame";
import { getLessonRef } from "../content/convexContent";
import { useDebouncedValue } from "../../infra/useDebouncedValue";

type VideoPaneProps = {
  lessonId: string;
  seekTimeSec?: number | null;
  codeHash?: string;
  threadId?: string;
  onTimeChange?: (timeSec: number) => void;
};

const formatTimestamp = (timestampSec: number): string => {
  const hours = Math.floor(timestampSec / 3600);
  const minutes = Math.floor((timestampSec % 3600) / 60);
  const seconds = Math.floor(timestampSec % 60);
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
};

const VideoPane = ({
  lessonId,
  seekTimeSec,
  codeHash,
  threadId,
  onTimeChange,
}: VideoPaneProps): ReactElement => {
  const lesson = useQuery(getLessonRef, { lessonId });
  const { frame, updateFrame } = useVideoFrame({
    lessonId,
    codeHash,
    threadId,
  });

  const initialTimeSec = frame?.videoTimeSec ?? 0;
  const lastSeek = typeof seekTimeSec === "number" ? seekTimeSec : null;
  const displayTime = useMemo((): number | null => {
    if (lastSeek !== null) {
      return lastSeek;
    }

    return frame?.videoTimeSec ?? null;
  }, [frame?.videoTimeSec, lastSeek]);

  const debouncedTimeSec = useDebouncedValue(displayTime ?? 0, 600);
  const lastSeekRef = useRef<number | null>(null);
  const lastPlaybackRef = useRef<number | null>(null);
  const [playState, setPlayState] = useState<VideoPlaybackState>("paused");

  useEffect((): void => {
    if (frame?.videoTimeSec !== undefined) {
      onTimeChange?.(frame.videoTimeSec);
    }
  }, [frame?.videoTimeSec, onTimeChange]);

  useEffect((): void => {
    if (lastSeek === null || lastSeekRef.current === lastSeek) {
      return;
    }

    lastSeekRef.current = lastSeek;
  }, [lastSeek]);

  useEffect(() => {
    if (debouncedTimeSec === null) {
      return;
    }

    if (playState !== "playing" && lastPlaybackRef.current === null) {
      return;
    }

    void updateFrame(debouncedTimeSec);
  }, [debouncedTimeSec, playState, updateFrame]);

  const handleTimeChange = useCallback(
    (timeSec: number): void => {
      lastPlaybackRef.current = timeSec;
      onTimeChange?.(timeSec);
    },
    [onTimeChange],
  );

  const handlePlayState = useCallback((state: VideoPlaybackState): void => {
    setPlayState(state);
  }, []);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Lesson video</p>
          <p className="text-xs text-text-muted">Player scaffold</p>
        </div>
        <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
          1080p
        </span>
      </header>
      <div className="p-4">
        {lesson ? (
          <VideoPlayer
            videoId={lesson.videoId}
            initialTimeSec={initialTimeSec}
            seekToSec={seekTimeSec ?? undefined}
            onTimeSample={handleTimeChange}
            onSeek={handleTimeChange}
            onPlayState={handlePlayState}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-xs text-text-muted">
            Loading video...
          </div>
        )}
        <div className="mt-3 text-[11px] text-text-subtle">
          {displayTime !== null
            ? `Seeking to ${formatTimestamp(displayTime)}`
            : "Awaiting seek"}
        </div>
      </div>
    </section>
  );
};

export { VideoPane };
