"use client";

import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll } from "../chat/ChatScroll";
import { useChatThread } from "../chat/useChatThread";
import { useTranscriptWindow } from "../transcript/useTranscriptWindow";
import type { ChatMessage as ChatMessageType } from "../chat/chatTypes";
import type { CodeSnapshotSummary } from "../../domain/resume";

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
  const { messages, sendMessage, threadId, streamState, streamError } =
    useChatThread(lessonId);
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
      });
    },
    [codePayload, sendMessage, transcriptPayload, videoTimeSec],
  );

  const handleSeek = useCallback(
    (timestampSec: number): void => {
      onSeek?.(timestampSec);
    },
    [onSeek],
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Assistant</p>
          <p className="text-xs text-text-muted">Stay synced to this lesson</p>
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
