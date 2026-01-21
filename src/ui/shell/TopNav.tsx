"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { storageAdapter } from "../../infra/storageAdapter";
import type { CourseSummary, LessonSummary } from "../../domain/content";
import {
  getCoursesRef,
  getLessonRef,
  getLessonsByCourseRef,
} from "../content/convexContent";
import { LayoutPresetToggle } from "../layout/LayoutPresetToggle";

const STORAGE_KEY = "niotebook.theme";
const LESSON_STORAGE_KEY = "niotebook.lesson";

type ThemeMode = "light" | "dark";

const TopNav = (): ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = storageAdapter.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const courses = useQuery(getCoursesRef);

  const lessonId = useMemo((): string | null => {
    return searchParams.get("lessonId");
  }, [searchParams]);

  const lesson = useQuery(getLessonRef, lessonId ? { lessonId } : "skip");

  const courseId = useMemo((): string | null => {
    if (lesson?.courseId) {
      return lesson.courseId as unknown as string;
    }

    if (selectedCourseId) {
      return selectedCourseId;
    }

    return courses?.[0]?.id ?? null;
  }, [courses, lesson?.courseId, selectedCourseId]);

  const lessons = useQuery(
    getLessonsByCourseRef,
    courseId ? { courseId } : "skip",
  );

  const courseOptions = useMemo<CourseSummary[]>(
    () => (courses ?? []) as CourseSummary[],
    [courses],
  );
  const lessonOptions = useMemo<LessonSummary[]>(
    () => (lessons ?? []) as LessonSummary[],
    [lessons],
  );

  const activeCourse = useMemo(() => {
    return courseOptions.find((course) => course.id === courseId) ?? null;
  }, [courseId, courseOptions]);

  const activeLesson = useMemo(() => {
    return lessonOptions.find((item) => item.id === lessonId) ?? null;
  }, [lessonId, lessonOptions]);

  useEffect((): void => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleToggleTheme = useCallback((): void => {
    setTheme((prev) => {
      const nextTheme: ThemeMode = prev === "light" ? "dark" : "light";
      storageAdapter.setItem(STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  const updateLesson = useCallback(
    (nextLessonId: string | null): void => {
      if (!nextLessonId) {
        return;
      }

      storageAdapter.setItem(LESSON_STORAGE_KEY, nextLessonId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("lessonId", nextLessonId);
      router.replace(`/?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleCourseChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const nextCourseId = event.target.value || null;
      setSelectedCourseId(nextCourseId);
      const nextLesson = lessonOptions.find(
        (item) => item.courseId === nextCourseId,
      );
      updateLesson(nextLesson?.id ?? null);
    },
    [lessonOptions, updateLesson],
  );

  const handleCourseBlur = useCallback((): void => {
    if (!selectedCourseId && courseId) {
      setSelectedCourseId(courseId);
    }
  }, [courseId, selectedCourseId]);

  const handleLessonChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      updateLesson(event.target.value);
    },
    [updateLesson],
  );

  const handleShare = useCallback((): void => {
    // Placeholder for share modal trigger.
  }, []);

  const handleFeedback = useCallback((): void => {
    // Placeholder for feedback modal trigger.
  }, []);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            niotebook
          </span>
          {activeCourse || activeLesson ? (
            <div className="flex flex-col text-[11px] leading-4 text-text-muted">
              <span>{activeCourse?.title ?? "Course"}</span>
              <span className="text-text-subtle">
                {activeLesson?.title ?? "Select a lesson"}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <select
              value={courseId ?? ""}
              onChange={handleCourseChange}
              onBlur={handleCourseBlur}
              className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted"
            >
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select
              value={lessonId ?? ""}
              onChange={handleLessonChange}
              className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted"
            >
              {lessonOptions.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
            {lessonId ? null : (
              <button
                type="button"
                onClick={() => updateLesson(lessonOptions[0]?.id ?? null)}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
              >
                Start
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LayoutPresetToggle />
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
            aria-label="Share"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
            aria-label="Feedback"
          >
            Feedback
          </button>
          <button
            type="button"
            onClick={handleToggleTheme}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
          >
            User
          </button>
        </div>
      </div>
    </header>
  );
};

export { TopNav };
