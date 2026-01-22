"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { SidebarSimple } from "@phosphor-icons/react";
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
import { ControlCenterDrawer } from "./ControlCenterDrawer";

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
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const drawerWasOpenRef = useRef(false);

  const courses = useQuery(getCoursesRef);

  const lessonId = useMemo((): string | null => {
    return searchParams.get("lessonId");
  }, [searchParams]);

  const lesson = useQuery(getLessonRef, lessonId ? { lessonId } : "skip");

  const courseId = useMemo((): string | null => {
    if (selectedCourseId) {
      return selectedCourseId;
    }

    if (lesson?.courseId) {
      return lesson.courseId as unknown as string;
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

  useEffect((): void => {
    if (!selectedCourseId || lessonOptions.length === 0) {
      return;
    }

    const isCurrentLessonInCourse = lessonOptions.some(
      (item) => item.id === lessonId,
    );

    if (!isCurrentLessonInCourse) {
      updateLesson(lessonOptions[0]?.id ?? null);
    }
  }, [lessonId, lessonOptions, selectedCourseId, updateLesson]);

  const handleShare = useCallback((): void => {
    // Placeholder for share modal trigger.
  }, []);

  const handleFeedback = useCallback((): void => {
    // Placeholder for feedback modal trigger.
  }, []);

  const handleSelectLesson = useCallback(
    (nextLessonId: string | null): void => {
      updateLesson(nextLessonId);
      setIsDrawerOpen(false);
    },
    [updateLesson],
  );

  const handleSelectCourse = useCallback(
    (nextCourseId: string | null): void => {
      setSelectedCourseId(nextCourseId);
    },
    [],
  );

  const handleOpenDrawer = useCallback((): void => {
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    setIsDrawerMounted(true);
    window.requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  }, []);

  const handleCloseDrawer = useCallback((): void => {
    setIsDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (!isDrawerMounted || isDrawerOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsDrawerMounted(false);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [isDrawerMounted, isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      if (drawerWasOpenRef.current) {
        if (lastActiveRef.current) {
          lastActiveRef.current.focus();
          lastActiveRef.current = null;
        }
        drawerWasOpenRef.current = false;
      }
      return;
    }

    drawerWasOpenRef.current = true;

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
      <ControlCenterDrawer
        isOpen={isDrawerOpen}
        isMounted={isDrawerMounted}
        drawerRef={drawerRef}
        onClose={handleCloseDrawer}
        courseId={courseId}
        courseOptions={courseOptions}
        lessonId={lessonId}
        lessonOptions={lessonOptions}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onShare={handleShare}
        onFeedback={handleFeedback}
        onSelectLesson={handleSelectLesson}
        onSelectCourse={handleSelectCourse}
      />
    </header>
  );
};

export { TopNav };
