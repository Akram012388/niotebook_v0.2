import type { ReactElement } from "react";
import type { ChatMessage as ChatMessageType } from "./chatTypes";

type ChatMessageProps = {
  message: ChatMessageType;
};

const ChatMessage = ({ message }: ChatMessageProps): ReactElement => {
  const isUser = message.role === "user";

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
          className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            isUser
              ? "border-white/20 text-white/70"
              : "border-slate-200 text-slate-500"
          }`}
        >
          {message.badge}
        </button>
      </div>
    </div>
  );
};

export { ChatMessage };
