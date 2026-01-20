import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { useDebouncedValue } from "../../infra/useDebouncedValue";
import { VideoPlayer } from "../video/VideoPlayer";
import { useVideoFrame } from "../video/useVideoFrame";

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

  const debouncedTimeSec = useDebouncedValue(displayTime ?? 0, 800);

  useEffect((): void => {
    if (frame?.videoTimeSec !== undefined) {
      onTimeChange?.(frame.videoTimeSec);
    }
  }, [frame?.videoTimeSec, onTimeChange]);

  useEffect(() => {
    if (debouncedTimeSec === null) {
      return;
    }

    void updateFrame(debouncedTimeSec);
  }, [debouncedTimeSec, updateFrame]);

  const handleTimeChange = useCallback(
    (timeSec: number): void => {
      onTimeChange?.(timeSec);
    },
    [onTimeChange],
  );

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
        <VideoPlayer
          videoId="cs50x-week1"
          initialTimeSec={initialTimeSec}
          onTimeSample={handleTimeChange}
          onSeek={handleTimeChange}
        />
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
