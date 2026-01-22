"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  ChatCenteredText,
  Gear,
  Moon,
  SidebarSimple,
  ShareNetwork,
  Sun,
  UserCircle,
  X,
} from "@phosphor-icons/react";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

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

  const handleOpenDrawer = useCallback((): void => {
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback((): void => {
    setIsDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) {
      if (lastActiveRef.current) {
        lastActiveRef.current.focus();
        lastActiveRef.current = null;
      }
      return;
    }

    const focusDrawer = (): void => {
      const drawer = drawerRef.current;
      if (!drawer) {
        return;
      }
      const focusable = drawer.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      const first = focusable[0];
      first?.focus();
    };

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const drawer = drawerRef.current;
      if (!drawer) {
        return;
      }

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    window.setTimeout(focusDrawer, 0);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [isDrawerOpen]);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            niotebook
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LayoutPresetToggle />
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface"
            aria-label="Open control center"
            title="Control center"
          >
            <SidebarSimple size={16} weight="regular" />
          </button>
        </div>
      </div>
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={handleCloseDrawer}
            className="absolute inset-0 bg-black/30"
            aria-label="Close control center"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 h-full w-[360px] border-l border-border bg-surface shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="text-sm font-semibold text-foreground">
                Control center
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface"
                aria-label="Close control center"
              >
                <X size={16} weight="regular" />
              </button>
            </div>
            <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-5 text-sm">
              <section className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Course
                </div>
                <select
                  value={courseId ?? ""}
                  onChange={handleCourseChange}
                  onBlur={handleCourseBlur}
                  className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                >
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </section>
              <section className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Lesson
                </div>
                <select
                  value={lessonId ?? ""}
                  onChange={handleLessonChange}
                  className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
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
                    className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-surface hover:text-foreground"
                  >
                    Start
                  </button>
                )}
              </section>
              <section className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Theme
                </div>
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                >
                  <span>{theme === "light" ? "Light" : "Dark"}</span>
                  {theme === "light" ? (
                    <Sun size={14} weight="regular" />
                  ) : (
                    <Moon size={14} weight="regular" />
                  )}
                </button>
              </section>
              <section className="flex flex-col gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Actions
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                >
                  <span>Share</span>
                  <ShareNetwork size={14} weight="regular" />
                </button>
                <button
                  type="button"
                  onClick={handleFeedback}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                >
                  <span>Feedback</span>
                  <ChatCenteredText size={14} weight="regular" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                >
                  <span>User</span>
                  <UserCircle size={14} weight="regular" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                >
                  <span>Settings</span>
                  <Gear size={14} weight="regular" />
                </button>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
};

export { TopNav };
