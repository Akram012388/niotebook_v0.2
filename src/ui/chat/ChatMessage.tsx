import { memo, type ReactElement, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ChatMessage as ChatMessageType } from "./chatTypes";
import { StreamingText, type StreamingTextHandle } from "./StreamingText";

type ChatMessageProps = {
  message: ChatMessageType;
  onSeek?: (timestampSec: number) => void;
  /** Ref to the StreamingText imperative handle (only for the active streaming message). */
  streamingTextRef?: RefObject<StreamingTextHandle | null>;
};

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

/** Full markdown render — used only for completed (non-streaming) messages. */
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

const ChatMessage = memo(function ChatMessage({
  message,
  onSeek,
  streamingTextRef,
}: ChatMessageProps): ReactElement {
  const isUser = message.role === "user";

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
        {isUser ? (
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
            {message.isStreaming ? (
              <StreamingText ref={streamingTextRef} />
            ) : (
              <RenderedMarkdown content={message.content} />
            )}
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
