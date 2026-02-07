import {
  memo,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
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

/** Full markdown render — only used for completed/revealed messages. */
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

/** Chars per tick for the post-stream typewriter reveal. */
const REVEAL_CHARS_PER_TICK = 3;
const REVEAL_TICK_MS = 12;

/**
 * Smooth typewriter reveal — runs AFTER the full response has been
 * received from the AI provider. Characters are revealed incrementally
 * as plain text, then once fully revealed the markdown is parsed once.
 *
 * The RAF loop runs once on mount and reads the latest content length
 * from a ref so it never resets the cursor when content grows.
 */
function RevealContent({
  content,
  onRevealDone,
}: {
  content: string;
  onRevealDone: () => void;
}): ReactElement {
  const [visible, setVisible] = useState(0);
  const onDoneRef = useRef(onRevealDone);
  const contentLenRef = useRef(content.length);
  const cursorRef = useRef(0);

  useEffect(() => {
    onDoneRef.current = onRevealDone;
  }, [onRevealDone]);

  // Keep content length ref in sync whenever content grows
  useEffect(() => {
    contentLenRef.current = content.length;
  }, [content.length]);

  useEffect(() => {
    // Nothing to reveal yet — wait for content to arrive
    if (contentLenRef.current === 0) {
      onDoneRef.current();
      return;
    }

    let raf: number | null = null;
    let last = performance.now();

    const tick = (now: number): void => {
      const target = contentLenRef.current;
      const elapsed = now - last;
      if (elapsed >= REVEAL_TICK_MS) {
        const chars = Math.max(
          REVEAL_CHARS_PER_TICK,
          Math.floor((elapsed / REVEAL_TICK_MS) * REVEAL_CHARS_PER_TICK),
        );
        // Guard: clamp cursor in case content ever shrinks
        cursorRef.current = Math.min(cursorRef.current + chars, target);
        setVisible(cursorRef.current);
        last = now;

        if (cursorRef.current >= target) {
          onDoneRef.current();
          return;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return <span className="whitespace-pre-wrap">{content.slice(0, visible)}</span>;
}

/**
 * Wrapper that handles the two phases of assistant message display:
 * - Stream just finished (`wasStreaming`): smooth typewriter reveal of plain text
 * - Fully revealed (or historical message): full markdown render
 *
 * While streaming, the parent renders the thinking dot instead of this component.
 */
const AssistantContent = memo(function AssistantContent({
  content,
  wasStreaming,
}: {
  content: string;
  wasStreaming?: boolean;
}) {
  const [revealed, setRevealed] = useState(!wasStreaming);

  const handleRevealDone = (): void => {
    setRevealed(true);
  };

  return (
    <div
      className="nio-markdown w-full text-sm leading-6 text-foreground"
      data-testid="chat-message"
    >
      {!revealed ? (
        <RevealContent content={content} onRevealDone={handleRevealDone} />
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
  // Show thinking dot only while waiting for buffer threshold
  const isThinking = Boolean(
    message.isStreaming && !message.isRevealing,
  );
  const isActive = message.isStreaming || message.isRevealing;

  const handleSeek = (): void => {
    onSeek?.(message.timestampSec);
  };

  return (
    <div
      className={`group flex flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      }`}
      style={
        isActive
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
              className="nio-thinking h-2.5 w-2.5 rounded-full bg-accent opacity-70"
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
            wasStreaming={message.wasStreaming}
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
