import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useQuery } from "convex/react";
import { VideoPlayer } from "../video/VideoPlayer";
import { useVideoFrame } from "../video/useVideoFrame";
import { getLessonRef } from "../content/convexContent";

type VideoSeekRequest = {
  timeSec: number;
  token: number;
};

type VideoPaneProps = {
  lessonId: string;
  seekRequest?: VideoSeekRequest | null;
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
  seekRequest,
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

  const initialTimeSec = frame?.videoTimeSec ?? null;
  const lastSeek = seekRequest?.timeSec ?? null;
  const displayTime = useMemo((): number | null => {
    if (lastSeek !== null) {
      return lastSeek;
    }

    return frame?.videoTimeSec ?? null;
  }, [frame?.videoTimeSec, lastSeek]);

  const lastSeekRef = useRef<number | null>(null);
  const lastPersistedRef = useRef<number | null>(null);
  const [lastSampleTimeSec, setLastSampleTimeSec] = useState<number | null>(
    null,
  );

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
    if (lastSampleTimeSec === null) {
      return;
    }

    if (lastPersistedRef.current === lastSampleTimeSec) {
      return;
    }

    lastPersistedRef.current = lastSampleTimeSec;
    void updateFrame(lastSampleTimeSec);
  }, [lastSampleTimeSec, updateFrame]);

  const handleTimeChange = useCallback(
    (timeSec: number): void => {
      onTimeChange?.(timeSec);
      setLastSampleTimeSec(timeSec);
    },
    [onTimeChange],
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Lesson video</p>
          <p className="text-xs text-text-muted">Player scaffold</p>
        </div>
        <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
          1080p
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex min-h-0 flex-1 items-start justify-center">
          {lesson ? (
            <div className="w-full max-h-full aspect-video">
              <VideoPlayer
                videoId={lesson.videoId}
                initialTimeSec={initialTimeSec}
                seekToSec={seekRequest?.timeSec}
                onTimeSample={handleTimeChange}
                onSeek={handleTimeChange}
                showControls={false}
              />
            </div>
          ) : (
            <div className="flex w-full max-w-[720px] aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-xs text-text-muted">
              Loading video...
            </div>
          )}
        </div>
        <div className="text-[11px] text-text-subtle">
          {displayTime !== null
            ? `Seeking to ${formatTimestamp(displayTime)}`
            : "Awaiting seek"}
        </div>
      </div>
    </section>
  );
};

export { VideoPane };
