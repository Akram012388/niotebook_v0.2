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
      className="group relative flex min-w-[260px] max-w-[300px] shrink-0 snap-start flex-col gap-2.5 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-workspace-accent/40 hover:shadow-xl hover:shadow-workspace-accent/5"
    >
      {/* Subtle green glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-workspace-accent/0 to-workspace-accent/0 transition-all duration-300 group-hover:from-workspace-accent/[0.03] group-hover:to-transparent" />

      <span className="relative text-[11px] font-medium uppercase tracking-wide text-text-subtle">
        {courseTitle}
      </span>
      <h3 className="relative text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-workspace-accent">
        {lessonTitle}
      </h3>
      <div className="relative flex items-center justify-between">
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
            className="text-workspace-accent/60"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>{formatTimestamp(videoTimeSec)}</span>
        </div>
        <span className="text-[10px] font-medium text-workspace-accent opacity-0 transition-opacity group-hover:opacity-100">
          Resume →
        </span>
      </div>
    </Link>
  );
});

export { ResumeCard };
