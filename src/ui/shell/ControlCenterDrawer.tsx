"use client";

import {
  ChatCenteredText,
  Gear,
  ListNumbers,
  Moon,
  Stack,
  ShareNetwork,
  Sun,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { useMemo, useState, type ReactElement, type RefObject } from "react";
import type { CourseSummary, LessonSummary } from "../../domain/content";

type ControlCenterDrawerProps = {
  isOpen: boolean;
  isMounted: boolean;
  drawerRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  courseId: string | null;
  courseOptions: CourseSummary[];
  lessonId: string | null;
  lessonOptions: LessonSummary[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onShare: () => void;
  onFeedback: () => void;
  onSelectLesson: (lessonId: string | null) => void;
  onSelectCourse: (courseId: string | null) => void;
};

const ControlCenterDrawer = ({
  isOpen,
  isMounted,
  drawerRef,
  onClose,
  courseId,
  courseOptions,
  lessonId,
  lessonOptions,
  theme,
  onToggleTheme,
  onShare,
  onFeedback,
  onSelectLesson,
  onSelectCourse,
}: ControlCenterDrawerProps): ReactElement | null => {
  const [activeTab, setActiveTab] = useState<"lectures" | "courses">(
    "lectures",
  );
  const [panelView, setPanelView] = useState<"content" | "user" | "settings">(
    "content",
  );
  const [lectureQuery, setLectureQuery] = useState("");

  const handleTabChange = (next: "lectures" | "courses"): void => {
    setActiveTab(next);
    setPanelView("content");
  };

  const handlePanelToggle = (next: "user" | "settings"): void => {
    setPanelView((prev) => (prev === next ? "content" : next));
  };

  const filteredLectures = useMemo(() => {
    const normalized = lectureQuery.trim().toLowerCase();
    if (!normalized) {
      return lessonOptions;
    }
    return lessonOptions.filter((lesson) => {
      const orderText = `lecture ${lesson.order}`;
      return (
        lesson.title.toLowerCase().includes(normalized) ||
        orderText.includes(normalized)
      );
    });
  }, [lectureQuery, lessonOptions]);

  const sortedCourses = useMemo(() => {
    return [...courseOptions].sort((left, right) =>
      left.title.localeCompare(right.title),
    );
  }, [courseOptions]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-[120ms] ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close control center"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-[360px] border-l border-border bg-surface shadow-lg transition-transform duration-[180ms] ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="text-sm font-semibold text-foreground">
              Control center
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border bg-surface-muted p-2 text-text-muted transition hover:bg-surface"
              aria-label="Close control center"
            >
              <X size={16} weight="regular" />
            </button>
          </div>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => handleTabChange("lectures")}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeTab === "lectures"
                  ? "border-border bg-surface text-foreground"
                  : "border-transparent text-text-muted hover:bg-surface-muted"
              }`}
            >
              <ListNumbers size={14} weight="regular" />
              Lectures
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("courses")}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                activeTab === "courses"
                  ? "border-border bg-surface text-foreground"
                  : "border-transparent text-text-muted hover:bg-surface-muted"
              }`}
            >
              <Stack size={14} weight="regular" />
              Courses
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 text-sm">
              {panelView === "content" ? (
                activeTab === "lectures" ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Search
                      </div>
                      <input
                        value={lectureQuery}
                        onChange={(event) =>
                          setLectureQuery(event.target.value)
                        }
                        placeholder="Search lectures"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-text-subtle"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Lectures
                      </div>
                      <div className="flex flex-col gap-2">
                        {filteredLectures.map((lesson) => {
                          const isActive = lesson.id === lessonId;
                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => onSelectLesson(lesson.id)}
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                                isActive
                                  ? "border-border bg-surface text-foreground shadow-sm"
                                  : "border-border text-text-muted hover:bg-surface-muted hover:text-foreground"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-[0.08em] text-text-subtle">
                                  Lecture {lesson.order}
                                </span>
                                <span className="text-sm text-foreground">
                                  {lesson.title}
                                </span>
                              </div>
                              <span className="text-xs text-text-subtle">
                                →
                              </span>
                            </button>
                          );
                        })}
                        {filteredLectures.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border bg-surface-muted px-3 py-4 text-xs text-text-muted">
                            No lectures match that search.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                      Courses
                    </div>
                    <div className="flex flex-col gap-2">
                      {sortedCourses.map((course) => {
                        const isActive = course.id === courseId;
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => {
                              onSelectCourse(course.id);
                              setActiveTab("lectures");
                              setPanelView("content");
                            }}
                            className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-left text-xs transition ${
                              isActive
                                ? "border-border bg-surface text-foreground shadow-sm"
                                : "border-border text-text-muted hover:bg-surface-muted hover:text-foreground"
                            }`}
                          >
                            <span className="text-sm text-foreground">
                              {course.title}
                            </span>
                            {course.description ? (
                              <span className="text-xs text-text-subtle">
                                {course.description}
                              </span>
                            ) : null}
                            <span className="text-[10px] uppercase tracking-[0.08em] text-text-subtle">
                              {course.license} · {course.sourceUrl}
                            </span>
                          </button>
                        );
                      })}
                      {sortedCourses.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-surface-muted px-3 py-4 text-xs text-text-muted">
                          No courses available yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              ) : panelView === "settings" ? (
                <div className="flex flex-col gap-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Theme
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                  >
                    <span>{theme === "light" ? "Light" : "Dark"}</span>
                    {theme === "light" ? (
                      <Sun size={14} weight="regular" />
                    ) : (
                      <Moon size={14} weight="regular" />
                    )}
                  </button>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Actions
                  </div>
                  <button
                    type="button"
                    onClick={onShare}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                  >
                    <span>Share</span>
                    <ShareNetwork size={14} weight="regular" />
                  </button>
                  <button
                    type="button"
                    onClick={onFeedback}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted"
                  >
                    <span>Feedback</span>
                    <ChatCenteredText size={14} weight="regular" />
                  </button>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-xs text-text-muted">
                  <UserCircle size={18} weight="regular" />
                  <div>User panel coming soon.</div>
                </div>
              )}
            </div>
            <div className="border-t border-border bg-surface px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePanelToggle("user")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    panelView === "user"
                      ? "border-border bg-surface text-foreground"
                      : "border-transparent text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  <UserCircle size={14} weight="regular" />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => handlePanelToggle("settings")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    panelView === "settings"
                      ? "border-border bg-surface text-foreground"
                      : "border-transparent text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  <Gear size={14} weight="regular" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export { ControlCenterDrawer };
