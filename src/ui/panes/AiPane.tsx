"use client";

import {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useQuery } from "convex/react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll, type ChatScrollHandle } from "../chat/ChatScroll";
import { useChatThread } from "../chat/useChatThread";
import { useSelectionPush } from "../chat/useSelectionPush";
import type { StreamingTextHandle } from "../chat/StreamingText";
import { useTranscriptWindow } from "../transcript/useTranscriptWindow";
import type { CodeSnapshotSummary } from "../../domain/resume";
import { getLessonRef } from "../content/convexContent";
import { resolveLectureNumber } from "../../domain/lectureNumber";
import { useVideoDisplayTime } from "../layout/WorkspaceGrid";
import { useTerminalStore } from "../code/terminal/useTerminalStore";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";

// ── Selection push tooltip ────────────────────────────────────
type SelectionTooltipProps = {
  top: number;
  left: number;
  onPush: () => void;
  showConfirmation: boolean;
};

function SelectionTooltip({
  top,
  left,
  onPush,
  showConfirmation,
}: SelectionTooltipProps): ReactElement {
  return (
    <button
      type="button"
      onClick={showConfirmation ? undefined : onPush}
      className="absolute z-20 flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text-muted shadow-md transition-colors hover:bg-surface-muted hover:text-foreground"
      style={{ top, left }}
      aria-label="Push selection to niotepad"
    >
      {showConfirmation ? (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Pushed
        </>
      ) : (
        <>
          <span className="font-semibold text-accent">N</span>
          Push to N
        </>
      )}
    </button>
  );
}

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
  const {
    messages,
    sendMessage,
    threadId,
    streamState,
    streamError,
    onStreamTokenRef,
  } = useChatThread(lessonId, lectureLabel);
  const chatScrollRef = useRef<ChatScrollHandle>(null);
  const streamingTextRef = useRef<StreamingTextHandle>(null);
  const [chatMessagesElement, setChatMessagesElement] =
    useState<HTMLDivElement | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    chatMessagesRef.current = chatMessagesElement;
  }, [chatMessagesElement]);
  const {
    isActive: selectionActive,
    selectionRect,
    pushToNiotepad,
    showConfirmation,
  } = useSelectionPush(chatMessagesRef, lessonId, lectureLabel);

  // Wire the streaming token callback to the StreamingText component
  useEffect(() => {
    onStreamTokenRef.current = (token: string) => {
      streamingTextRef.current?.append(token);
    };
    return () => {
      onStreamTokenRef.current = null;
    };
  }, [onStreamTokenRef]);

  // Scroll to bottom when the streaming placeholder message appears.
  // The placeholder is added inside the async sendMessage (after Convex calls),
  // so the scrollToBottom in handleSend fires too early. This catches the moment
  // the placeholder actually enters the DOM.
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (
      messages.length > prevMsgCountRef.current &&
      streamState === "streaming"
    ) {
      chatScrollRef.current?.scrollToBottom();
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, streamState]);
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

  // ── Bookmark to niotepad ────────────────────────────────
  const [bookmarkConfirm, setBookmarkConfirm] = useState(false);
  const bookmarkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBookmark = useCallback((): void => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant?.content) return;

    const store = useNiotepadStore.getState();
    const pageId = store.getOrCreatePage(lessonId, lectureLabel);
    store.addEntry({
      source: "chat",
      content: lastAssistant.content,
      pageId,
      videoTimeSec,
      metadata: {
        chatMessageId: lastAssistant.id,
        lectureTitle: lectureLabel,
      },
    });

    setBookmarkConfirm(true);
    if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current);
    bookmarkTimerRef.current = setTimeout(() => {
      setBookmarkConfirm(false);
      bookmarkTimerRef.current = null;
    }, 1500);
  }, [messages, lessonId, lectureLabel, videoTimeSec]);

  useEffect(() => {
    return () => {
      if (bookmarkTimerRef.current) clearTimeout(bookmarkTimerRef.current);
    };
  }, []);

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
    <section className="flex h-full min-h-0 w-full flex-col bg-surface" data-help-target="chat">
      <header className="flex h-14 items-center justify-between border-b border-border-muted px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Assistant
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleBookmark}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Bookmark last response to niotepad"
          >
            {bookmarkConfirm ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7L6 10L11 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3.5 2.5H10.5V12L7 9.5L3.5 12V2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
            Live
          </span>
          {headerExtras}
        </div>
      </header>
      <div className="border-b border-border-muted bg-surface-muted px-4 py-1.5">
        <p className="truncate text-[11px] font-medium tracking-wide text-text-muted">
          {contextStripLabel}
        </p>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div
          ref={setChatMessagesElement}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ChatScroll
            ref={chatScrollRef}
            isStreaming={streamState === "streaming"}
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSeek={onSeek}
                streamingTextRef={
                  message.isStreaming ? streamingTextRef : undefined
                }
              />
            ))}
          </ChatScroll>
        </div>
        {(selectionActive || showConfirmation) &&
        selectionRect &&
        chatMessagesElement
          ? (() => {
              const containerRect = chatMessagesElement.getBoundingClientRect();
              const tooltipTop = selectionRect.bottom - containerRect.top + 4;
              const tooltipLeft = Math.max(
                0,
                Math.min(
                  selectionRect.left +
                    selectionRect.width / 2 -
                    containerRect.left -
                    48,
                  containerRect.width - 96,
                ),
              );
              return (
                <SelectionTooltip
                  top={tooltipTop}
                  left={tooltipLeft}
                  onPush={pushToNiotepad}
                  showConfirmation={showConfirmation}
                />
              );
            })()
          : null}
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
