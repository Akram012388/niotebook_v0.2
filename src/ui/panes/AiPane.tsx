"use client";

import {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import { useQuery } from "convex/react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll, type ChatScrollHandle } from "../chat/ChatScroll";
import { useChatThread } from "../chat/useChatThread";
import { useTranscriptWindow } from "../transcript/useTranscriptWindow";
import type { CodeSnapshotSummary } from "../../domain/resume";
import { getLessonRef } from "../content/convexContent";
import { resolveLectureNumber } from "../../domain/lectureNumber";
import { useVideoDisplayTime } from "../layout/WorkspaceGrid";
import { useTerminalStore } from "../code/terminal/useTerminalStore";

type AiPaneProps = {
  lessonId: string;
  onSeek?: (timestampSec: number) => void;
  onThreadChange?: (threadId: string | null) => void;
  headerExtras?: ReactElement;
  codeSnapshot?: CodeSnapshotSummary | null;
};

const AiPane = ({
  lessonId,
  onSeek,
  onThreadChange,
  headerExtras,
  codeSnapshot = null,
}: AiPaneProps): ReactElement => {
  const videoTimeSec = useVideoDisplayTime();
  const lastRunError = useTerminalStore((s) => s.lastRunError);
  const isConvexEnabled = process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true";
  const lesson = useQuery(
    getLessonRef,
    isConvexEnabled ? { lessonId } : "skip",
  );
  const lectureNumber = useMemo(() => {
    return resolveLectureNumber({
      subtitlesUrl: lesson?.subtitlesUrl,
      transcriptUrl: lesson?.transcriptUrl,
      title: lesson?.title,
      order: lesson?.order,
    });
  }, [
    lesson?.order,
    lesson?.subtitlesUrl,
    lesson?.title,
    lesson?.transcriptUrl,
  ]);
  const lectureLabel = useMemo(() => {
    if (lectureNumber !== undefined && lectureNumber !== null) {
      return `Lecture ${lectureNumber}`;
    }

    return "Lecture";
  }, [lectureNumber]);
  const { messages, sendMessage, threadId, streamState, streamError } =
    useChatThread(lessonId, lectureLabel);
  const chatScrollRef = useRef<ChatScrollHandle>(null);
  const transcriptWindow = useTranscriptWindow(lessonId, videoTimeSec);

  const transcriptPayload = useMemo(
    () => ({
      startSec: transcriptWindow.startSec,
      endSec: transcriptWindow.endSec,
      lines: transcriptWindow.segments.map((segment) => segment.textNormalized),
    }),
    [
      transcriptWindow.endSec,
      transcriptWindow.segments,
      transcriptWindow.startSec,
    ],
  );

  const codePayload = useMemo(
    () => ({
      language: codeSnapshot?.language ?? "unknown",
      codeHash: codeSnapshot?.codeHash,
      code: codeSnapshot?.code,
      fileName: codeSnapshot?.fileName,
    }),
    [codeSnapshot],
  );

  useEffect((): void => {
    onThreadChange?.(threadId);
  }, [onThreadChange, threadId]);

  const handleSend = useCallback(
    (content: string): void => {
      void sendMessage(content, {
        videoTimeSec,
        transcript: transcriptPayload,
        code: codePayload,
        lesson: {
          title: lesson?.title,
          lectureNumber: lectureNumber ?? undefined,
          subtitlesUrl: lesson?.subtitlesUrl,
          transcriptUrl: lesson?.transcriptUrl,
        },
        lastError: lastRunError ?? undefined,
      });

      // Instant scroll to bottom so user sees their message
      requestAnimationFrame(() => {
        chatScrollRef.current?.scrollToBottom();
      });
    },
    [
      codePayload,
      lastRunError,
      lectureNumber,
      lesson?.subtitlesUrl,
      lesson?.title,
      lesson?.transcriptUrl,
      sendMessage,
      transcriptPayload,
      videoTimeSec,
    ],
  );

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(videoTimeSec / 60);
    const seconds = Math.floor(videoTimeSec % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [videoTimeSec]);

  const contextStripLabel = useMemo(() => {
    const parts: string[] = [];
    if (lectureNumber !== undefined && lectureNumber !== null) {
      parts.push(`Lecture ${lectureNumber}`);
    }
    parts.push(formattedTime);
    if (codeSnapshot) {
      const lang = (codeSnapshot.language ?? "unknown").toUpperCase();
      const fileLabel = codeSnapshot.fileName ?? lang;
      parts.push(`${fileLabel}${codeSnapshot.codeHash ? " (modified)" : ""}`);
    }
    return parts.join(" │ ");
  }, [lectureNumber, formattedTime, codeSnapshot]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Assistant
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtras}
          <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
            Live
          </span>
        </div>
      </header>
      <div className="border-b border-border-muted bg-surface-muted px-4 py-1.5">
        <p className="truncate text-[11px] font-medium tracking-wide text-text-muted">
          {contextStripLabel}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <ChatScroll ref={chatScrollRef}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onSeek={onSeek} />
          ))}
        </ChatScroll>
        {streamError ? (
          <div className="rounded-lg border border-status-warning/25 bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
            {streamError}
          </div>
        ) : null}
        <ChatComposer
          onSend={handleSend}
          disabled={streamState === "streaming"}
        />
      </div>
    </section>
  );
};

export { AiPane };
