"use client";

import {
  ChatCenteredText,
  CopySimple,
  FacebookLogo,
  Gear,
  ListNumbers,
  PaperPlaneTilt,
  Star,
  Stack,
  ShareNetwork,
  XLogo,
  LinkedinLogo,
  SignOut,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { ThemeToggle } from "../shared/ThemeToggle";
import {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type RefObject,
} from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { CourseSummary, LessonSummary } from "../../domain/content";
import { resolveLectureNumber } from "../../domain/lectureNumber";

type UserInfo = {
  email: string | null;
  role: string | null;
  inviteBatchId: string | null;
};

type ControlCenterDrawerProps = {
  isOpen: boolean;
  isMounted: boolean;
  drawerRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  courseId: string | null;
  courseOptions: CourseSummary[];
  lessonId: string | null;
  lessonOptions: LessonSummary[];
  onShare: () => void;
  onFeedback: () => void;
  onSelectLesson: (lessonId: string | null) => void;
  onSelectCourse: (courseId: string | null) => void;
  userInfo?: UserInfo;
  onSignOut?: () => void;
};

const getLectureNumber = (lesson: LessonSummary): number | null => {
  return resolveLectureNumber({
    subtitlesUrl: lesson.subtitlesUrl,
    transcriptUrl: lesson.transcriptUrl,
    title: lesson.title,
    order: lesson.order,
  });
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
  onShare,
  onFeedback,
  onSelectLesson,
  onSelectCourse,
  userInfo,
  onSignOut,
}: ControlCenterDrawerProps): ReactElement | null => {
  const [activeTab, setActiveTab] = useState<"lectures" | "courses">(
    "lectures",
  );
  const [panelView, setPanelView] = useState<"content" | "user" | "settings">(
    "content",
  );
  const [lectureQuery, setLectureQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [activeSettingsCard, setActiveSettingsCard] = useState<
    "share" | "feedback" | null
  >(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackCategories, setFeedbackCategories] = useState<string[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [copyConfirm, setCopyConfirm] = useState(false);

  const logEvent = useMutation(api.events.logEvent);
  const submitFeedbackMutation = useMutation(api.feedback.submit);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyConfirm(true);
      setTimeout(() => setCopyConfirm(false), 2000);
      void logEvent({
        eventType: "share_copy",
        metadata: { surface: "control_center" },
      });
    } catch {
      // clipboard not available
    }
  }, [shareUrl, logEvent]);

  const handleShareVia = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "niotebook",
          url: shareUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopyConfirm(true);
      setTimeout(() => setCopyConfirm(false), 2000);
    }
    void logEvent({
      eventType: "share_copy",
      metadata: { surface: "control_center" },
    });
  }, [shareUrl, logEvent]);

  const handleShareSocial = useCallback(
    (network: string) => {
      const encoded = encodeURIComponent(shareUrl);
      const text = encodeURIComponent("Check out niotebook!");
      const urls: Record<string, string> = {
        x: `https://x.com/intent/tweet?url=${encoded}&text=${text}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      };
      const url = urls[network];
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      void logEvent({
        eventType: "share_social",
        metadata: { surface: "control_center", network },
      });
    },
    [shareUrl, logEvent],
  );

  const handleTabChange = (next: "lectures" | "courses"): void => {
    setActiveTab(next);
    setPanelView("content");
    setActiveSettingsCard(null);
  };

  const handlePanelToggle = (next: "user" | "settings"): void => {
    setPanelView((prev) => {
      const nextView = prev === next ? "content" : next;
      if (nextView !== "settings") {
        setActiveSettingsCard(null);
      }
      return nextView;
    });
  };

  const handleSettingsCardToggle = (next: "share" | "feedback"): void => {
    setActiveSettingsCard((prev) => {
      const nextState = prev === next ? null : next;
      if (nextState === "share") {
        onShare();
      }
      if (nextState === "feedback") {
        onFeedback();
      }
      return nextState;
    });
  };

  const handleResetFeedback = useCallback((): void => {
    setFeedbackRating(0);
    setFeedbackCategories([]);
    setFeedbackNotes("");
  }, []);

  const isFeedbackDirty =
    feedbackRating > 0 ||
    feedbackCategories.length > 0 ||
    feedbackNotes.trim().length > 0;

  const handleSubmitFeedback = useCallback(async () => {
    if (!isFeedbackDirty) return;
    const category = feedbackCategories.join(", ") || "General";
    try {
      await submitFeedbackMutation({
        category,
        rating: feedbackRating,
        notes: feedbackNotes || undefined,
      });
      void logEvent({
        eventType: "feedback_submitted",
        metadata: {
          surface: "control_center",
          rating: feedbackRating,
          textLength: feedbackNotes.length,
        },
      });
      handleResetFeedback();
      setActiveSettingsCard(null);
    } catch {
      // mutation failed
    }
  }, [
    isFeedbackDirty,
    feedbackCategories,
    feedbackRating,
    feedbackNotes,
    submitFeedbackMutation,
    logEvent,
    handleResetFeedback,
  ]);

  const filteredLectures = useMemo(() => {
    const normalized = lectureQuery.trim().toLowerCase();
    if (!normalized) {
      return lessonOptions;
    }
    return lessonOptions.filter((lesson) => {
      const lectureNumber = getLectureNumber(lesson);
      const orderText = lectureNumber ? `lecture ${lectureNumber}` : "lecture";
      return (
        lesson.title.toLowerCase().includes(normalized) ||
        orderText.includes(normalized)
      );
    });
  }, [lectureQuery, lessonOptions]);

  const filteredCourses = useMemo(() => {
    const real = courseOptions.filter(
      (course) => course.sourcePlaylistId !== "local-dev",
    );
    const sorted = [...real].sort((left, right) =>
      left.title.localeCompare(right.title),
    );
    const normalized = courseQuery.trim().toLowerCase();
    if (!normalized) return sorted;
    return sorted.filter(
      (course) =>
        course.title.toLowerCase().includes(normalized) ||
        (course.description?.toLowerCase().includes(normalized) ?? false),
    );
  }, [courseOptions, courseQuery]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        tabIndex={-1}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-100 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close control center"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-[360px] border-l border-border bg-surface shadow-lg transition-transform duration-200 ease-out ${
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
                  ? "border-accent bg-accent text-white"
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
                  ? "border-accent bg-accent text-white"
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
                          const lectureNumber = getLectureNumber(lesson);
                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => onSelectLesson(lesson.id)}
                              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200 ${
                                isActive
                                  ? "border-accent bg-accent text-white shadow-md"
                                  : "border-border text-text-muted hover:scale-[1.02] hover:shadow-md hover:border-accent/20 hover:bg-surface-muted hover:text-foreground"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span
                                  className={`text-[10px] uppercase tracking-[0.08em] ${isActive ? "text-white/70" : "text-text-subtle"}`}
                                >
                                  Lecture {lectureNumber ?? lesson.order}
                                </span>
                                <span
                                  className={`text-sm ${isActive ? "text-white" : "text-foreground"}`}
                                >
                                  {lesson.title}
                                </span>
                              </div>
                              <span
                                className={`text-xs ${isActive ? "text-white/70" : "text-text-subtle"}`}
                              >
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
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Search
                      </div>
                      <input
                        value={courseQuery}
                        onChange={(event) => setCourseQuery(event.target.value)}
                        placeholder="Search courses"
                        className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-text-subtle"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Courses
                      </div>
                      <div className="flex flex-col gap-2">
                        {filteredCourses.map((course) => {
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
                              className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-left text-xs transition-all duration-200 ${
                                isActive
                                  ? "border-accent bg-accent text-white shadow-md"
                                  : "border-border text-text-muted hover:scale-[1.02] hover:shadow-md hover:border-accent/20 hover:bg-surface-muted hover:text-foreground"
                              }`}
                            >
                              <span
                                className={`text-sm ${isActive ? "text-white" : "text-foreground"}`}
                              >
                                {course.title}
                              </span>
                              {course.description ? (
                                <span
                                  className={`text-xs ${isActive ? "text-white/70" : "text-text-subtle"}`}
                                >
                                  {course.description}
                                </span>
                              ) : null}
                              <span
                                className={`text-[10px] uppercase tracking-[0.08em] ${isActive ? "text-white/70" : "text-text-subtle"}`}
                              >
                                {course.license} · {course.sourceUrl}
                              </span>
                            </button>
                          );
                        })}
                        {filteredCourses.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border bg-surface-muted px-3 py-4 text-xs text-text-muted">
                            No courses match that search.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              ) : panelView === "settings" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                      Theme
                    </div>
                    <ThemeToggle />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Actions
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettingsCardToggle("share")}
                    className={`flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs font-medium transition ${
                      activeSettingsCard === "share"
                        ? "bg-accent text-white border-accent"
                        : "bg-surface-muted text-text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span>Share</span>
                    <ShareNetwork size={14} weight="regular" />
                  </button>
                  {activeSettingsCard === "share" ? (
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted px-4 py-4 text-xs">
                      <div className="flex items-start gap-3">
                        <ShareNetwork size={18} weight="regular" />
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-foreground">
                            Share niotebook
                          </div>
                          <div className="text-xs text-text-muted">
                            Share this learning environment with others.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          Copy link
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={shareUrl}
                            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => void handleCopyLink()}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition hover:bg-surface-muted hover:text-foreground"
                            aria-label="Copy share link"
                          >
                            {copyConfirm ? (
                              <span className="text-[10px] font-medium">
                                OK
                              </span>
                            ) : (
                              <CopySimple size={16} weight="regular" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          Share via
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleShareVia()}
                          className="flex items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-3 py-2 text-xs font-semibold text-white"
                        >
                          <PaperPlaneTilt size={14} weight="regular" />
                          Share...
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          Share on social
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleShareSocial("x")}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition hover:bg-surface hover:text-foreground"
                            aria-label="Share on X"
                          >
                            <XLogo size={16} weight="regular" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareSocial("linkedin")}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition hover:bg-surface hover:text-foreground"
                            aria-label="Share on LinkedIn"
                          >
                            <LinkedinLogo size={16} weight="regular" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareSocial("facebook")}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted transition hover:bg-surface hover:text-foreground"
                            aria-label="Share on Facebook"
                          >
                            <FacebookLogo size={16} weight="regular" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleSettingsCardToggle("feedback")}
                    className={`flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs font-medium transition ${
                      activeSettingsCard === "feedback"
                        ? "bg-accent text-white border-accent"
                        : "bg-surface-muted text-text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span>Feedback</span>
                    <ChatCenteredText size={14} weight="regular" />
                  </button>
                  {activeSettingsCard === "feedback" ? (
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted px-4 py-4 text-xs">
                      <div className="flex items-start gap-3">
                        <ChatCenteredText size={18} weight="regular" />
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-foreground">
                            Send feedback
                          </div>
                          <div className="text-xs text-text-muted">
                            Help us improve niotebook. Your feedback is
                            valuable.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          How would you rate your experience?
                        </div>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <button
                              key={`rating-${index}`}
                              type="button"
                              onClick={() => setFeedbackRating(index + 1)}
                              className={`transition ${
                                index < feedbackRating
                                  ? "text-accent"
                                  : "text-text-subtle hover:text-accent"
                              }`}
                              aria-label={`Rate ${index + 1} stars`}
                            >
                              <Star
                                size={16}
                                weight={
                                  index < feedbackRating ? "fill" : "regular"
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          What best describes your feedback?
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Bug report",
                            "Feature request",
                            "UX feedback",
                            "Performance",
                            "Other",
                          ].map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() =>
                                setFeedbackCategories((prev) =>
                                  prev.includes(label)
                                    ? prev.filter((item) => item !== label)
                                    : [...prev, label],
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-xs transition ${
                                feedbackCategories.includes(label)
                                  ? "border-accent bg-accent text-white shadow-sm"
                                  : "border-border bg-surface-muted text-text-muted hover:bg-surface hover:text-foreground"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                          Tell us more (optional)
                        </div>
                        <textarea
                          value={feedbackNotes}
                          onChange={(event) =>
                            setFeedbackNotes(event.target.value)
                          }
                          placeholder="Share your thoughts, suggestions, or issues..."
                          className="min-h-[110px] resize-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-text-subtle"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleResetFeedback}
                          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted transition hover:bg-surface hover:text-foreground"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          disabled={!isFeedbackDirty}
                          onClick={() => void handleSubmitFeedback()}
                          className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                            isFeedbackDirty
                              ? "bg-accent text-white"
                              : "bg-surface-muted text-text-subtle"
                          }`}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="rounded-xl border border-dashed border-border bg-surface-muted px-3 py-3 text-xs text-text-muted">
                    More settings coming soon.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-4">
                    <UserCircle
                      size={28}
                      weight="regular"
                      className="text-text-muted"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {userInfo?.email ?? "—"}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.08em] text-text-subtle">
                        {userInfo?.role ?? "user"}
                      </span>
                    </div>
                  </div>
                  {userInfo?.inviteBatchId ? (
                    <div className="flex flex-col gap-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Invite batch
                      </div>
                      <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs text-text-muted">
                        {userInfo.inviteBatchId}
                      </div>
                    </div>
                  ) : null}
                  {onSignOut ? (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-surface hover:text-foreground"
                    >
                      <SignOut size={14} weight="regular" />
                      Sign out
                    </button>
                  ) : null}
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
                      ? "border-accent bg-accent text-white"
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
                      ? "border-accent bg-accent text-white"
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
