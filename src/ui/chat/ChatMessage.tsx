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
    <div
      className={`group flex flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`max-w-[80%] rounded-xl border px-3 py-2 text-sm leading-6 ${
            isUser
              ? "border-border bg-surface-muted text-foreground dark:bg-surface-strong"
              : "border-border bg-surface text-foreground"
          }`}
        >
          <p className="whitespace-pre-wrap" data-testid="chat-message">
            {message.content}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeek}
          className={`text-[11px] font-medium opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ${
            isUser
              ? "text-text-muted hover:text-foreground dark:text-text-subtle dark:hover:text-foreground"
              : "text-text-subtle hover:text-foreground dark:text-text-muted dark:hover:text-foreground"
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
