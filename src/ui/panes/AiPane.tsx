"use client";

import { useCallback, useState, type ReactElement } from "react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll } from "../chat/ChatScroll";
import { MOCK_MESSAGES } from "../chat/mockMessages";
import type { ChatMessage as ChatMessageType } from "../chat/chatTypes";

type AiPaneProps = {
  onSeek?: (timestampSec: number) => void;
};

const AiPane = ({ onSeek }: AiPaneProps): ReactElement => {
  const [messages, setMessages] = useState<ChatMessageType[]>(MOCK_MESSAGES);

  const handleSend = useCallback(
    (content: string): void => {
      const nextMessage: ChatMessageType = {
        id: `${messages.length + 1}`,
        role: "user",
        content,
        badge: "Lesson • 14:02",
        timestampSec: 842,
      };

      setMessages((prev) => [...prev, nextMessage]);
    },
    [messages.length],
  );

  const handleSeek = useCallback(
    (timestampSec: number): void => {
      onSeek?.(timestampSec);
      setMessages((prev) =>
        prev.map((message) =>
          message.timestampSec === timestampSec
            ? { ...message, badge: `${message.badge} ✓` }
            : message,
        ),
      );
    },
    [onSeek],
  );

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Assistant</p>
          <p className="text-xs text-text-muted">Stay synced to this lesson</p>
        </div>
        <span className="rounded-full border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-text-muted">
          Live
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ChatScroll>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSeek={handleSeek}
            />
          ))}
        </ChatScroll>
        <ChatComposer onSend={handleSend} />
      </div>
    </section>
  );
};

export { AiPane };
