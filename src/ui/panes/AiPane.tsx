"use client";

import { useCallback, useState, type ReactElement } from "react";
import { ChatComposer } from "../chat/ChatComposer";
import { ChatMessage } from "../chat/ChatMessage";
import { ChatScroll } from "../chat/ChatScroll";
import { MOCK_MESSAGES } from "../chat/mockMessages";
import type { ChatMessage as ChatMessageType } from "../chat/chatTypes";

const AiPane = (): ReactElement => {
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

  const handleSeek = useCallback((timestampSec: number): void => {
    setMessages((prev) =>
      prev.map((message) =>
        message.timestampSec === timestampSec
          ? { ...message, badge: `${message.badge} ✓` }
          : message,
      ),
    );
  }, []);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Assistant</p>
          <p className="text-xs text-slate-500">Stay synced to this lesson</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
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
