import type { ReactElement } from "react";
import type { ChatMessage as ChatMessageType } from "./chatTypes";

type ChatMessageProps = {
  message: ChatMessageType;
  onSeek?: (timestampSec: number) => void;
};

const ChatMessage = ({ message, onSeek }: ChatMessageProps): ReactElement => {
  const isUser = message.role === "user";

  const handleSeek = (): void => {
    onSeek?.(message.timestampSec);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "border-border bg-surface-strong text-surface-strong-foreground"
            : "border-border bg-surface text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap" data-testid="chat-message">
          {message.content}
        </p>
        <button
          type="button"
          onClick={handleSeek}
          className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ${
            isUser
              ? "border-accent-border text-accent-muted hover:text-accent-foreground"
              : "border-border text-text-muted hover:text-foreground"
          }`}
          aria-label={`Seek to ${message.badge}`}
        >
          {message.badge}
        </button>
      </div>
    </div>
  );
};

export { ChatMessage };
