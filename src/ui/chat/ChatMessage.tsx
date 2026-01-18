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
        className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "border-slate-200 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <button
          type="button"
          onClick={handleSeek}
          className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
            isUser
              ? "border-white/20 text-white/70 hover:text-white"
              : "border-slate-200 text-slate-500 hover:text-slate-700"
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
