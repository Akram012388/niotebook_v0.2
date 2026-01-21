"use client";

import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll } from "../chat/ChatScroll";
import { useChatThread } from "../chat/useChatThread";
import { useTranscriptWindow } from "../transcript/useTranscriptWindow";
import type { ChatMessage as ChatMessageType } from "../chat/chatTypes";

type AiPaneProps = {
  lessonId: string;
  onSeek?: (timestampSec: number) => void;
  videoTimeSec?: number;
  onThreadChange?: (threadId: string | null) => void;
  headerExtras?: ReactElement;
};

const AiPane = ({
  lessonId,
  onSeek,
  videoTimeSec = 0,
  onThreadChange,
  headerExtras,
}: AiPaneProps): ReactElement => {
  const { messages, sendMessage, threadId } = useChatThread(lessonId);
  const transcriptWindow = useTranscriptWindow(lessonId, videoTimeSec);

  const displayMessages = useMemo<ChatMessageType[]>(() => {
    if (messages.length === 0) {
      return [];
    }

    return messages.map((message) => ({
      id: message.id as unknown as string,
      role: message.role,
      content: message.content,
      badge: `Lesson • ${Math.floor(message.videoTimeSec / 60)}:${Math.floor(
        message.videoTimeSec % 60,
      )
        .toString()
        .padStart(2, "0")}`,
      timestampSec: message.videoTimeSec,
    }));
  }, [messages]);

  useEffect((): void => {
    onThreadChange?.(threadId);
  }, [onThreadChange, threadId]);

  const handleSend = useCallback(
    (content: string): void => {
      void sendMessage(content, videoTimeSec);
    },
    [sendMessage, videoTimeSec],
  );

  const handleSeek = useCallback(
    (timestampSec: number): void => {
      onSeek?.(timestampSec);
    },
    [onSeek],
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col rounded-2xl border border-border bg-surface">
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
        <ChatScroll>
          {displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSeek={handleSeek}
            />
          ))}
        </ChatScroll>
        <ChatComposer
          onSend={handleSend}
          transcriptContext={transcriptWindow.segments.map(
            (segment) => segment.textNormalized,
          )}
        />
      </div>
    </section>
  );
};

export { AiPane };
