"use client";

import { useMemo, useCallback, type ReactElement } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
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
        <p className="text-sm text-text-muted">Loading course...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/courses"
          className="text-xs text-text-muted hover:text-foreground"
        >
          &larr; Back to courses
        </Link>
        <h1 className="text-lg font-bold text-foreground">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-text-muted">{course.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>{course.license}</span>
          {course.sourceUrl && (
            <a
              href={course.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Source
            </a>
          )}
        </div>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {completedCount}/{totalCount} lectures completed
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {firstIncomplete && (
            <Link
              href={`/workspace?lessonId=${firstIncomplete.id as string}`}
              className="mt-1 w-fit rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition hover:opacity-90"
            >
              Resume
            </Link>
          )}
        </div>
      )}

      {/* Lecture list */}
      <div className="flex flex-col gap-1">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Lectures</h2>
        {(lessons ?? []).map((lesson) => {
          const isCompleted = completedLessonIds.has(lesson.id as string);
          return (
            <div
              key={lesson.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs text-text-muted">
                  {isCompleted ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline text-accent"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="inline-block h-3.5 w-3.5 rounded-full border border-border" />
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">
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
                    className="rounded-md bg-surface-muted px-3 py-1 text-xs text-text-muted transition hover:bg-accent hover:text-accent-foreground"
                  >
                    Mark Complete
                  </button>
                )}
                <Link
                  href={`/workspace?lessonId=${lesson.id as string}`}
                  className="rounded-md bg-surface-muted px-3 py-1 text-xs text-text-muted transition hover:bg-accent hover:text-accent-foreground"
                >
                  {isCompleted ? "Review" : "Start"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CourseDetailPage };
