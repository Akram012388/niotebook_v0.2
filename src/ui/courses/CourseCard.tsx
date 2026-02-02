"use client";

import { memo, type ReactElement } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  /** Animation delay index for stagger */
  index?: number;
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
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
  index = 0,
}: CourseCardProps): ReactElement {
  const progressPct =
    lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  if (variant === "coming-soon") {
    return (
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-5 opacity-60 transition-all duration-200 hover:opacity-80 hover:scale-[1.02] hover:shadow-lg"
      >
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
            <span className="text-xs font-medium tracking-wide text-text-muted">
              Coming Soon
            </span>
          </div>
          {license && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-subtle">
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
        <div className="mt-auto flex items-center justify-between pt-1">
          {provider && (
            <span className="inline-block w-fit rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
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
      </motion.div>
    );
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <Link
        href={`/courses/${id as string}`}
        className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:scale-[1.02] hover:border-workspace-accent/40 hover:shadow-xl hover:shadow-workspace-accent/5"
      >
        {/* Subtle green glow on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-workspace-accent/0 to-workspace-accent/0 transition-all duration-300 group-hover:from-workspace-accent/[0.03] group-hover:to-transparent" />

        <h3 className="relative text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-workspace-accent">
          {title}
        </h3>
        {description && (
          <p className="relative line-clamp-2 text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        )}
        <div className="relative mt-auto flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            {provider && (
              <span className="inline-block w-fit rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
                {provider}
              </span>
            )}
            {license && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-text-subtle">
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
                  className="h-full rounded-full bg-workspace-accent transition-all"
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
    </motion.div>
  );
});

export { CourseCard };
export type { CourseCardProps };
