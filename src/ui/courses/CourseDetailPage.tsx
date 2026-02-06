"use client";

import { useMemo, useCallback, type ReactElement } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  getLessonsByCourseRef,
  getCoursesRef,
} from "@/ui/content/convexContent";
import {
  getCompletionsByCourseRef,
  markCompleteRef,
} from "./convexCompletions";

type CourseDetailPageProps = {
  courseId: string;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CourseDetailPage({ courseId }: CourseDetailPageProps): ReactElement {
  const courses = useQuery(getCoursesRef);
  const lessons = useQuery(getLessonsByCourseRef, { courseId });
  const completions = useQuery(getCompletionsByCourseRef, { courseId });
  const markComplete = useMutation(markCompleteRef);

  const handleMarkComplete = useCallback(
    (lessonId: string) => {
      void markComplete({ lessonId });
    },
    [markComplete],
  );

  const course = useMemo(
    () => (courses ?? []).find((c) => (c.id as string) === courseId),
    [courses, courseId],
  );

  const completedLessonIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of completions ?? []) {
      set.add(c.lessonId as string);
    }
    return set;
  }, [completions]);

  const completedCount = completedLessonIds.size;
  const totalCount = lessons?.length ?? 0;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const firstIncomplete = useMemo(() => {
    if (!lessons) return null;
    return lessons.find((l) => !completedLessonIds.has(l.id as string)) ?? null;
  }, [lessons, completedLessonIds]);

  if (!course) {
    return (
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-center px-4 py-16">
        <div className="h-64 w-full animate-pulse rounded-2xl bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 px-6 py-10">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/courses"
          className="group flex w-fit items-center gap-1.5 text-xs text-text-muted transition hover:text-foreground"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to courses
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {course.title}
        </h1>
        {course.description && (
          <p className="max-w-lg text-sm leading-relaxed text-text-muted">
            {course.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {course.license && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
              {course.license}
            </span>
          )}
          {course.sourceUrl && (
            <a
              href={course.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted underline hover:text-foreground"
            >
              Source
            </a>
          )}
        </div>
      </motion.div>

      {/* Progress */}
      {totalCount > 0 && (
        <motion.div
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {completedCount}/{totalCount} lectures completed
            </span>
            <span className="text-sm font-semibold text-accent">
              {progressPct}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
          {firstIncomplete && (
            <Link
              href={`/workspace?lessonId=${firstIncomplete.id as string}`}
              className="mt-1 w-fit rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-accent-foreground transition-all hover:shadow-[0_0_20px_var(--accent-muted)]"
            >
              Resume
            </Link>
          )}
        </motion.div>
      )}

      {/* Lecture list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-4 w-1 rounded-full bg-accent" />
          <h2 className="text-base font-semibold text-foreground">Lectures</h2>
        </div>
        {(lessons ?? []).map((lesson, i) => {
          const isCompleted = completedLessonIds.has(lesson.id as string);
          return (
            <motion.div
              key={lesson.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3.5 transition-all ${
                isCompleted
                  ? "border-accent/20 bg-accent/[0.03]"
                  : "border-border bg-surface hover:border-accent/20 hover:shadow-sm"
              }`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * Math.min(i, 10) }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">
                  {isCompleted ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline text-accent"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-border" />
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {lesson.title}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatDuration(lesson.durationSec)}
                  </span>
                </div>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(lesson.id as string)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition hover:border-accent/30 hover:text-foreground"
                  >
                    Mark Complete
                  </button>
                )}
                <Link
                  href={`/workspace?lessonId=${lesson.id as string}`}
                  className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20"
                >
                  {isCompleted ? "Review" : "Start"}
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export { CourseDetailPage };
