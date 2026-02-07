import { memo, useMemo, type ReactElement } from "react";
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

/**
 * Close any open markdown constructs so react-markdown doesn't break
 * on partial streaming content. Handles unclosed code fences.
 */
const closePartialMarkdown = (text: string): string => {
  // Count triple-backtick fences (``` with optional language tag)
  const fencePattern = /^```/gm;
  const matches = text.match(fencePattern);
  const fenceCount = matches?.length ?? 0;

  // Odd fence count means one is unclosed — close it
  if (fenceCount % 2 !== 0) {
    return text + "\n```";
  }

  return text;
};

/**
 * Progressive markdown render — used during streaming AND after completion.
 * During streaming, unclosed code fences are auto-closed before rendering
 * so partial code blocks render correctly with syntax highlighting.
 */
const StreamingMarkdown = memo(function StreamingMarkdown({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  const safeContent = useMemo(
    () => (isStreaming ? closePartialMarkdown(content) : content),
    [content, isStreaming],
  );

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
      {safeContent}
    </ReactMarkdown>
  );
});

const ChatMessage = memo(function ChatMessage({
  message,
  onSeek,
}: ChatMessageProps): ReactElement {
  const isUser = message.role === "user";
  const isThinking = Boolean(message.isStreaming && !message.content);
  const isStreamingWithContent = Boolean(
    message.isStreaming && message.content,
  );

  const handleSeek = (): void => {
    onSeek?.(message.timestampSec);
  };

  return (
    <div
      className={`group flex flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      }`}
      style={
        message.isStreaming
          ? undefined
          : { contentVisibility: "auto", containIntrinsicSize: "auto 200px" }
      }
    >
      <div
        className={
          isUser ? "flex items-center gap-2 flex-row-reverse" : "w-full"
        }
      >
        {isThinking ? (
          <div className="flex items-center pl-1 py-2">
            <canvas
              className="nio-thinking-orb"
              width={80}
              height={80}
              style={{ width: 40, height: 40 }}
              aria-label="Assistant is thinking"
              role="img"
            />
          </div>
        ) : isUser ? (
          <div className="max-w-[80%] rounded-xl border px-3 py-2 text-sm leading-6 border-border bg-surface-muted text-foreground dark:bg-surface-strong">
            <p className="whitespace-pre-wrap" data-testid="chat-message">
              {message.content}
            </p>
          </div>
        ) : (
          <div
            className="nio-markdown w-full text-sm leading-6 text-foreground"
            data-testid="chat-message"
          >
            <StreamingMarkdown
              content={message.content}
              isStreaming={isStreamingWithContent}
            />
          </div>
        )}
        {message.badge ? (
          <button
            type="button"
            onClick={handleSeek}
            className={`text-[11px] font-medium opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 text-text-muted hover:text-foreground dark:text-text-subtle dark:hover:text-foreground ${isUser ? "" : "self-start"}`}
            aria-label={`Seek to ${message.badge}`}
          >
            {message.badge}
          </button>
        ) : null}
      </div>
    </div>
  );
});

export { ChatMessage };
