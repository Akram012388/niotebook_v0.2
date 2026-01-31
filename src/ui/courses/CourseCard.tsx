"use client";

import { memo, type ReactElement } from "react";
import Link from "next/link";
import type { CourseId } from "@/domain/ids";

type CourseCardProps = {
  id: CourseId;
  title: string;
  provider?: string;
  description?: string;
  lessonCount: number;
  completedCount?: number;
  license?: string;
  sourceUrl?: string;
  variant: "active" | "coming-soon";
};

const CourseCard = memo(function CourseCard({
  id,
  title,
  provider,
  description,
  lessonCount,
  completedCount = 0,
  license,
  sourceUrl,
  variant,
}: CourseCardProps): ReactElement {
  const progressPct =
    lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  if (variant === "coming-soon") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-5 opacity-70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs text-text-muted">Coming Soon</span>
          </div>
          {license && (
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-muted">
              {license}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold leading-tight text-foreground">
          {title}
        </h3>
        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          {provider && (
            <span className="inline-block w-fit rounded-full bg-surface px-2.5 py-0.5 text-xs text-text-muted">
              {provider}
            </span>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted underline hover:text-foreground"
            >
              Source
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/courses/${id as string}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-lg"
    >
      <h3 className="text-base font-semibold leading-tight text-foreground group-hover:text-accent">
        {title}
      </h3>
      {description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {provider && (
            <span className="inline-block w-fit rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-text-muted">
              {provider}
            </span>
          )}
          {license && (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
              {license}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {lessonCount} lecture{lessonCount !== 1 ? "s" : ""}
        </span>
        {completedCount > 0 && (
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">
              {progressPct}% complete
            </span>
          </div>
        )}
      </div>
    </Link>
  );
});

export { CourseCard };
export type { CourseCardProps };
