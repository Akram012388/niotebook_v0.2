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

/** Full markdown render — used for completed messages. */
const RenderedMarkdown = memo(function RenderedMarkdown({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
      {content}
    </ReactMarkdown>
  );
});

/**
 * Assistant message display:
 * - While streaming: show plain text as tokens arrive (immediate, no buffer)
 * - After stream completes: parse and render full markdown
 */
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
        <span className="whitespace-pre-wrap">{content}</span>
      ) : (
        <RenderedMarkdown content={content} />
      )}
    </div>
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
          <div className="flex items-center pl-4 py-2">
            <div className="relative flex items-center justify-center">
              {/* Pulse rings (background layers) */}
              <span
                className="nio-thinking-ring-1 absolute h-2.5 w-2.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span
                className="nio-thinking-ring-2 absolute h-2.5 w-2.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span
                className="nio-thinking-ring-3 absolute h-2.5 w-2.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              {/* Core dot (foreground) */}
              <span
                className="nio-thinking relative h-2.5 w-2.5 rounded-full bg-accent opacity-70"
                aria-hidden="true"
              />
            </div>
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
            isStreaming={isStreamingWithContent}
          />
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
