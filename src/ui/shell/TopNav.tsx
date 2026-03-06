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
  SidebarSimple,
  ShareNetwork,
  ChatCenteredText,
} from "@phosphor-icons/react";
import { Wordmark } from "../brand/Wordmark";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { storageAdapter } from "../../infra/storageAdapter";
import { meRef } from "../auth/convexAuth";
import type { CourseSummary, LessonSummary } from "../../domain/content";
import {
  getCoursesRef,
  getLessonRef,
  getLessonsByCourseRef,
} from "../content/convexContent";
import { LayoutPresetToggle } from "../layout/LayoutPresetToggle";
import { ControlCenterDrawer } from "./ControlCenterDrawer";
import type { SettingsRoute } from "./ControlCenterDrawer";
import { NiotepadPill } from "../niotepad/NiotepadPill";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";

const LESSON_STORAGE_KEY = "niotebook.lesson";

const TopNav = (): ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const meData = useQuery(meRef);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [drawerSettingsCard, setDrawerSettingsCard] =
    useState<SettingsRoute | null>(null);
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
  const shouldAutoSelectDefault = useMemo((): boolean => {
    return (
      process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true" ||
      process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS === "true"
    );
  }, []);

  const updateLesson = useCallback(
    (nextLessonId: string | null): void => {
      if (!nextLessonId) {
        return;
      }

      storageAdapter.setItem(LESSON_STORAGE_KEY, nextLessonId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("lessonId", nextLessonId);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect((): void => {
    if (lessonId || lessonOptions.length === 0) {
      return;
    }

    const isPreviewHost =
      typeof window !== "undefined" &&
      window.location.hostname.endsWith(".vercel.app");

    if (!shouldAutoSelectDefault && !isPreviewHost) {
      return;
    }

    updateLesson(lessonOptions[0]?.id ?? null);
  }, [lessonId, lessonOptions, shouldAutoSelectDefault, updateLesson]);

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

  const handleOpenDrawerWithRoute = useCallback(
    (route: SettingsRoute): void => {
      useNiotepadStore.getState().closePanel();
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      setDrawerSettingsCard(route);
      setIsDrawerMounted(true);
      window.requestAnimationFrame(() => {
        setIsDrawerOpen(true);
      });
    },
    [],
  );

  const handleShare = useCallback((): void => {
    handleOpenDrawerWithRoute("share");
  }, [handleOpenDrawerWithRoute]);

  const handleFeedback = useCallback((): void => {
    handleOpenDrawerWithRoute("feedback");
  }, [handleOpenDrawerWithRoute]);

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
    // Mutual exclusion: close niotepad when opening drawer
    useNiotepadStore.getState().closePanel();
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    setDrawerSettingsCard(null);
    setIsDrawerMounted(true);
    window.requestAnimationFrame(() => {
      setIsDrawerOpen(true);
    });
  }, []);

  const handleCloseDrawer = useCallback((): void => {
    setIsDrawerOpen(false);
    setDrawerSettingsCard(null);
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

  // Mutual exclusion: when niotepad opens, close drawer
  useEffect(() => {
    const unsubscribe = useNiotepadStore.subscribe((state, prev) => {
      if (state.isOpen && !prev.isOpen) {
        setIsDrawerOpen(false);
      }
    });
    return unsubscribe;
  }, []);

  // Listen for settings open requests from other components (e.g. AiPane NO_API_KEY)
  useEffect(() => {
    const handleOpenSettings = (): void => {
      handleOpenDrawerWithRoute("api-keys");
    };
    window.addEventListener("niotebook:open-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("niotebook:open-settings", handleOpenSettings);
    };
  }, [handleOpenDrawerWithRoute]);

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto">
        <Wordmark height={40} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface hover:text-foreground"
            aria-label="Share"
            title="Share"
          >
            <ShareNetwork size={16} weight="regular" />
          </button>
          <button
            type="button"
            onClick={handleFeedback}
            className="rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface hover:text-foreground"
            aria-label="Send feedback"
            title="Feedback"
          >
            <ChatCenteredText size={16} weight="regular" />
          </button>
          <NiotepadPill />
          <LayoutPresetToggle />
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface hover:text-foreground"
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
        onShare={handleShare}
        onFeedback={handleFeedback}
        onSelectLesson={handleSelectLesson}
        onSelectCourse={handleSelectCourse}
        userInfo={{
          email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
          role: meData?.role ?? null,
        }}
        onSignOut={() => void signOut()}
        initialSettingsCard={drawerSettingsCard}
      />
    </header>
  );
};

export { TopNav };
