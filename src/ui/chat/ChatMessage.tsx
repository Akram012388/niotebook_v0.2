import { memo, useEffect, useRef, useState, type ReactElement } from "react";
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

/** Full markdown render — only used for completed messages. */
const RenderedMarkdown = memo(function RenderedMarkdown({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
    >
      {content}
    </ReactMarkdown>
  );
});

/** Chars per frame to emit — tuned for ~60fps smooth typewriter feel. */
const CHARS_PER_TICK = 2;
const TICK_MS = 16;

/**
 * During streaming we render plain text with a blinking cursor.
 * Characters are revealed incrementally for a smooth typewriter effect
 * similar to the Claude app, instead of chunking by SSE batches.
 */
function StreamingContent({ content }: { content: string }): ReactElement {
  const [visible, setVisible] = useState(0);
  const targetRef = useRef(content.length);

  useEffect(() => {
    targetRef.current = content.length;
  }, [content.length]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = (): void => {
      setVisible((prev) => {
        const target = targetRef.current;
        if (prev >= target) return prev;
        const next = Math.min(prev + CHARS_PER_TICK, target);
        timer = setTimeout(tick, TICK_MS);
        return next;
      });
    };

    timer = setTimeout(tick, TICK_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <p className="whitespace-pre-wrap">
      {content.slice(0, visible)}
      <span
        className="ml-0.5 inline-block h-4 w-[2px] align-text-bottom bg-workspace-accent"
        style={{ animation: "blink 1s step-end infinite" }}
        aria-hidden="true"
      />
    </p>
  );
}

const AssistantContent = memo(function AssistantContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <div
      className="nio-markdown w-full text-sm leading-6 text-foreground"
      data-testid="chat-message"
    >
      {isStreaming ? (
        <StreamingContent content={content} />
      ) : (
        <RenderedMarkdown content={content} />
      )}
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
      style={
        message.isStreaming
          ? undefined
          : { contentVisibility: "auto", containIntrinsicSize: "auto 80px" }
      }
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
          <AssistantContent
            content={message.content}
            isStreaming={message.isStreaming}
          />
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
