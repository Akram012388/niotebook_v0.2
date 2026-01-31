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
      className="group flex min-w-[260px] max-w-[300px] shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-transform hover:scale-[1.02] hover:shadow-md"
    >
      <span className="text-xs font-medium text-text-muted">{courseTitle}</span>
      <h3 className="text-sm font-semibold text-foreground group-hover:text-accent">
        {lessonTitle}
      </h3>
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
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>{formatTimestamp(videoTimeSec)}</span>
      </div>
    </Link>
  );
});

export { ResumeCard };
