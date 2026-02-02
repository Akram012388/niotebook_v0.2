import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useQuery } from "convex/react";
import { VideoPlayer } from "../video/VideoPlayer";
import { useAutoCompletion } from "../video/useAutoCompletion";
import { useVideoFrame } from "../video/useVideoFrame";
import { getCoursesRef, getLessonRef } from "../content/convexContent";
import { resolveLectureNumber } from "../../domain/lectureNumber";

type VideoSeekRequest = {
  timeSec: number;
  token: number;
};

type VideoPaneProps = {
  lessonId: string;
  seekRequest?: VideoSeekRequest | null;
  codeHash?: string;
  threadId?: string;
  onTimeChange?: (timeSec: number) => void;
  onTimeUpdate?: (timeSec: number) => void;
  headerExtras?: ReactElement;
  showInfoStrip?: boolean;
};

const VideoPane = ({
  lessonId,
  seekRequest,
  codeHash,
  threadId,
  onTimeChange,
  onTimeUpdate,
  headerExtras,
  showInfoStrip = false,
}: VideoPaneProps): ReactElement => {
  const lesson = useQuery(getLessonRef, { lessonId });
  const courses = useQuery(getCoursesRef, {});
  const { frame, remoteFrame, updateFrame } = useVideoFrame({
    lessonId,
    codeHash,
    threadId,
  });

  const course = useMemo(() => {
    if (!lesson || !courses) {
      return null;
    }

    return courses.find((item) => item.id === lesson.courseId) ?? null;
  }, [courses, lesson]);

  const lectureNumber = useMemo(() => {
    return resolveLectureNumber({
      subtitlesUrl: lesson?.subtitlesUrl,
      transcriptUrl: lesson?.transcriptUrl,
      title: lesson?.title,
      order: lesson?.order,
    });
  }, [lesson?.order, lesson?.subtitlesUrl, lesson?.title, lesson?.transcriptUrl]);

  const checkAutoCompletion = useAutoCompletion({
    lessonId,
    durationSec: lesson?.durationSec,
  });

  const courseTitle = course?.title ?? null;

  const headerTitle = useMemo(() => {
    if (!courseTitle && !lesson?.title) {
      return { primary: "Lesson video", secondary: null };
    }
    const lecturePart =
      lectureNumber !== null && lectureNumber !== undefined
        ? `Lecture ${lectureNumber}`
        : null;
    let topicPart = lesson?.title ?? null;
    if (topicPart && lecturePart) {
      topicPart = topicPart
        .replace(/^Lecture\s+\d+\s*[:\u2014—\-–]\s*/i, "")
        .trim() || null;
    }
    const secondaryParts = [lecturePart, topicPart].filter(Boolean).join(": ");
    return {
      primary: courseTitle ?? "Lesson video",
      secondary: secondaryParts || null,
    };
  }, [courseTitle, lectureNumber, lesson?.title]);

  const sourceLabel = (() => {
    if (!course?.sourceUrl) {
      return null;
    }

    try {
      const url = new URL(course.sourceUrl);
      const trimmedPath = url.pathname.replace(/\/$/, "");
      return `${url.hostname}${trimmedPath}`;
    } catch {
      return course.sourceUrl;
    }
  })();

  const infoItems = (() => {
    const items: Array<{ label: string; value: string; href?: string }> = [];

    if (lesson?.title) {
      items.push({ label: "Lecture", value: lesson.title });
    }

    if (sourceLabel) {
      items.push({
        label: "Source",
        value: sourceLabel,
        href: course?.sourceUrl,
      });
    }

    if (course?.license) {
      items.push({ label: "License", value: course.license });
    }

    return items;
  })();

  const initialTimeSec = remoteFrame?.videoTimeSec ?? null;
  const lastSeek = seekRequest?.timeSec ?? null;

  const lastSeekRef = useRef<number | null>(null);
  const lastPersistedRef = useRef<number | null>(null);
  const videoAreaRef = useRef<HTMLDivElement | null>(null);
  const videoWrapRef = useRef<HTMLDivElement | null>(null);
  const [lastSampleTimeSec, setLastSampleTimeSec] = useState<number | null>(
    null,
  );

  useEffect((): void => {
    if (frame?.videoTimeSec !== undefined) {
      onTimeChange?.(frame.videoTimeSec);
    }
  }, [frame?.videoTimeSec, onTimeChange]);


  // Size the video wrapper via direct DOM writes to avoid state-driven
  // re-render loops that caused jitter with the previous setState approach.
  useEffect(() => {
    const area = videoAreaRef.current;
    if (!area || typeof ResizeObserver === "undefined") {
      return;
    }

    const applyWidth = (areaW: number, areaH: number): void => {
      const wrap = videoWrapRef.current;
      if (!wrap || areaW <= 0 || areaH <= 0) return;
      const optimal = Math.round(Math.min(areaW, areaH * (16 / 9)));
      wrap.style.width = `${optimal}px`;
    };

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) applyWidth(rect.width, rect.height);
    });

    observer.observe(area);
    const rect = area.getBoundingClientRect();
    applyWidth(rect.width, rect.height);

    return () => observer.disconnect();
  }, []);

  useEffect((): void => {
    if (lastSeek === null || lastSeekRef.current === lastSeek) {
      return;
    }

    lastSeekRef.current = lastSeek;
  }, [lastSeek]);

  useEffect(() => {
    if (lastSampleTimeSec === null) {
      return;
    }

    if (lastPersistedRef.current === lastSampleTimeSec) {
      return;
    }

    lastPersistedRef.current = lastSampleTimeSec;
    void updateFrame(lastSampleTimeSec);
  }, [lastSampleTimeSec, updateFrame]);

  const handleTimeChange = useCallback(
    (timeSec: number): void => {
      onTimeChange?.(timeSec);
      setLastSampleTimeSec(timeSec);
      checkAutoCompletion(timeSec);
    },
    [checkAutoCompletion, onTimeChange],
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            <span className="font-semibold">{headerTitle.primary}</span>
            {headerTitle.secondary ? (
              <span className="font-normal text-text-muted">
                {" — "}
                {headerTitle.secondary}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtras}
          <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
            1080p
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div
          ref={videoAreaRef}
          className="flex min-h-0 flex-1 items-start justify-center"
        >
          {lesson ? (
            <div ref={videoWrapRef} className="w-full max-w-full aspect-video">

              <VideoPlayer
                videoId={lesson.videoId}
                initialTimeSec={initialTimeSec}
                seekToSec={seekRequest?.timeSec}
                seekToken={seekRequest?.token}
                onTimeSample={handleTimeChange}
                onTimeUpdate={onTimeUpdate}
                onSeek={handleTimeChange}
                showControls={false}
              />
            </div>
          ) : (
            <div className="flex w-full max-w-[720px] aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted text-xs text-text-muted">
              Loading video...
            </div>
          )}
        </div>
        {showInfoStrip && infoItems.length > 0 ? (
          <div className="mt-3 rounded-lg border border-border bg-surface-muted px-3 py-2 text-[11px] text-text-muted">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="uppercase tracking-[0.08em] text-[10px] text-text-subtle">
                    {item.label}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-foreground underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-foreground">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export { VideoPane };
