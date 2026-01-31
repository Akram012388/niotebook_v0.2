"use client";

import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { useQuery } from "convex/react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll } from "../chat/ChatScroll";
import { useChatThread } from "../chat/useChatThread";
import { useTranscriptWindow } from "../transcript/useTranscriptWindow";
import type { ChatMessage as ChatMessageType } from "../chat/chatTypes";
import type { CodeSnapshotSummary } from "../../domain/resume";
import { getLessonRef } from "../content/convexContent";
import { resolveLectureNumber } from "../../domain/lectureNumber";

type AiPaneProps = {
  lessonId: string;
  onSeek?: (timestampSec: number) => void;
  videoTimeSec?: number;
  onThreadChange?: (threadId: string | null) => void;
  headerExtras?: ReactElement;
  codeSnapshot?: CodeSnapshotSummary | null;
};

const AiPane = ({
  lessonId,
  onSeek,
  videoTimeSec = 0,
  onThreadChange,
  headerExtras,
  codeSnapshot = null,
}: AiPaneProps): ReactElement => {
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
  const transcriptWindow = useTranscriptWindow(lessonId, videoTimeSec);

  const displayMessages = useMemo<ChatMessageType[]>(
    () => messages,
    [messages],
  );

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
      });
    },
    [
      codePayload,
      lectureNumber,
      lesson?.subtitlesUrl,
      lesson?.title,
      lesson?.transcriptUrl,
      sendMessage,
      transcriptPayload,
      videoTimeSec,
    ],
  );

  const handleSeek = useCallback(
    (timestampSec: number): void => {
      onSeek?.(timestampSec);
    },
    [onSeek],
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Assistant</p>
        </div>
        <div className="flex items-center gap-2">
          {headerExtras}
          <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
            Live
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <ChatScroll isStreaming={streamState === "streaming"}>
          {displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSeek={handleSeek}
            />
          ))}
        </ChatScroll>
        {streamError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
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
