"use client";

import { memo, type ReactElement } from "react";
import Link from "next/link";

type ResumeCardProps = {
  courseTitle: string;
  lessonTitle: string;
  lessonId: string;
  videoTimeSec: number;
};

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ResumeCard = memo(function ResumeCard({
  courseTitle,
  lessonTitle,
  lessonId,
  videoTimeSec,
}: ResumeCardProps): ReactElement {
  return (
    <Link
      href={`/workspace?lessonId=${lessonId}`}
      className="group flex min-w-[260px] max-w-[300px] shrink-0 snap-start flex-col gap-2.5 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/30 hover:shadow-md"
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-subtle">
        {courseTitle}
      </span>
      <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
        {lessonTitle}
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent/60"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>{formatTimestamp(videoTimeSec)}</span>
        </div>
        <span className="text-[10px] font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          Resume →
        </span>
      </div>
    </Link>
  );
});

export { ResumeCard };
