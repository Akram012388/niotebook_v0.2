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
import { NotebookFrame } from "@/ui/shared/NotebookFrame";

type CourseDetailPageProps = {
  courseId: string;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const lectureContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const lectureCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.min(i * 0.1, 0.8),
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

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
        <div className="h-64 w-full nio-shimmer rounded-2xl" />
      </div>
    );
  }

  const content = (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
            aria-hidden="true"
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
          <p className="text-sm leading-relaxed text-text-muted">
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
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

      {/* Lecture card grid */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold font-mono uppercase tracking-[0.2em] text-accent">
          Lectures
        </p>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
          variants={lectureContainerVariants}
          initial="hidden"
          animate={lessons ? "visible" : "hidden"}
        >
          {(lessons ?? []).map((lesson, i) => {
            const isCompleted = completedLessonIds.has(lesson.id as string);
            return (
              <motion.div
                key={lesson.id}
                custom={i}
                variants={lectureCardVariants}
                className={`flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/30 hover:shadow-md ${
                  isCompleted
                    ? "border-l-[3px] border-l-accent bg-accent/[0.03]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-xs font-mono text-text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {lesson.title}
                    </span>
                    <span className="text-xs font-mono text-text-muted">
                      {formatDuration(lesson.durationSec)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {isCompleted && (
                      <div className="flex items-center gap-1.5 text-xs text-accent">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                      {isCompleted ? "Review" : "Start"} →
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10">
      <div className="hidden sm:block">
        <NotebookFrame compact>{content}</NotebookFrame>
      </div>
      <div className="sm:hidden">{content}</div>
    </div>
  );
}

export { CourseDetailPage };
