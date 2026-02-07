import { memo, useMemo, type ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ChatMessage as ChatMessageType } from "./chatTypes";
import { ThinkingOrb } from "./ThinkingOrb";

type ChatMessageProps = {
  message: ChatMessageType;
  onSeek?: (timestampSec: number) => void;
};

const remarkPlugins = [remarkGfm];
const rehypePluginsFull = [rehypeHighlight];
const rehypePluginsNone: [] = [];

/**
 * Close any open markdown constructs so react-markdown doesn't break
 * on partial streaming content. Handles unclosed code fences.
 */
const closePartialMarkdown = (text: string): string => {
  const fencePattern = /^```/gm;
  const matches = text.match(fencePattern);
  const fenceCount = matches?.length ?? 0;

  if (fenceCount % 2 !== 0) {
    return text + "\n```";
  }

  return text;
};

/**
 * Progressive markdown render.
 * During streaming: remarkGfm only (no syntax highlighting — saves 5-10ms/frame).
 * After completion: full rehype-highlight applied for syntax colors.
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

  // Skip rehype-highlight during streaming — it's expensive and runs every frame.
  // Syntax highlighting applies once the stream completes.
  const rehype = isStreaming ? rehypePluginsNone : rehypePluginsFull;

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehype}>
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
            <ThinkingOrb />
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
