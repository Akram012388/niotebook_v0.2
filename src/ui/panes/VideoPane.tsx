import type { ReactElement } from "react";

type VideoPaneProps = {
  seekTimeSec?: number | null;
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

const VideoPane = ({ seekTimeSec }: VideoPaneProps): ReactElement => {
  const lastSeek = typeof seekTimeSec === "number" ? seekTimeSec : null;

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
        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted text-xs text-text-muted">
          <span>Video player placeholder</span>
          <span className="text-[11px] text-text-subtle">
            {lastSeek !== null
              ? `Seeking to ${formatTimestamp(lastSeek)}`
              : "Awaiting seek"}
          </span>
        </div>
      </div>
    </section>
  );
};

export { VideoPane };
