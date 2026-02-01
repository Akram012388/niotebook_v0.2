import { memo, type ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ChatMessage as ChatMessageType } from "./chatTypes";

type ChatMessageProps = {
  message: ChatMessageType;
  onSeek?: (timestampSec: number) => void;
};

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

const AssistantContent = memo(function AssistantContent({
  content,
}: {
  content: string;
}) {
  return (
    <div
      className="nio-markdown w-full text-sm leading-6 text-foreground"
      data-testid="chat-message"
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

const ChatMessage = ({ message, onSeek }: ChatMessageProps): ReactElement => {
  const isUser = message.role === "user";
  const isThinking = Boolean(
    message.isStreaming && message.content.length === 0,
  );

  const handleSeek = (): void => {
    onSeek?.(message.timestampSec);
  };

  return (
    <div
      className={`group flex flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 80px" }}
    >
      <div
        className={
          isUser ? "flex items-center gap-2 flex-row-reverse" : "w-full"
        }
      >
        {isThinking ? (
          <div className="flex items-center pl-4 py-2">
            <span
              className="nio-thinking h-2.5 w-2.5 rounded-full bg-foreground opacity-70"
              aria-hidden="true"
            />
          </div>
        ) : isUser ? (
          <div className="max-w-[80%] rounded-xl border px-3 py-2 text-sm leading-6 border-border bg-surface-muted text-foreground dark:bg-surface-strong">
            <p className="whitespace-pre-wrap" data-testid="chat-message">
              {message.content}
            </p>
          </div>
        ) : (
          <AssistantContent content={message.content} />
        )}
        {isUser ? (
          <button
            type="button"
            onClick={handleSeek}
            className="text-[11px] font-medium opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 text-text-muted hover:text-foreground dark:text-text-subtle dark:hover:text-foreground"
            aria-label={`Seek to ${message.badge}`}
          >
            {message.badge}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export { ChatMessage };
