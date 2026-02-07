"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ArrowDown } from "@phosphor-icons/react";

type ChatScrollProps = {
  children: ReactNode;
  isStreaming?: boolean;
};

const ChatScroll = ({
  children,
  isStreaming = false,
}: ChatScrollProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const rafRef = useRef<number | null>(null);

  const handleScroll = useCallback((): void => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    const isAtBottom = distanceFromBottom < 40;
    atBottomRef.current = isAtBottom;
    setAtBottom(isAtBottom);
  }, []);

  // Auto-scroll when content grows ONLY when NOT streaming/revealing.
  // During AI response reveal, the learner reads from the top — they can
  // click the scroll-to-bottom button if they want to follow along.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Disable auto-scroll during streaming — let the user read from top
    if (isStreaming) return;

    const observer = new ResizeObserver(() => {
      if (!atBottomRef.current) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const anchor = anchorRef.current;
        if (!anchor) return;
        anchor.scrollIntoView({ block: "end", behavior: "smooth" });
      });
    });

    const content = container.firstElementChild as HTMLElement | null;
    if (content) {
      observer.observe(content);
    }

    return () => {
      observer.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isStreaming]);

  const handleScrollToBottom = useCallback((): void => {
    const anchor = anchorRef.current;

    if (!anchor) {
      return;
    }

    anchor.scrollIntoView({ block: "end", behavior: "smooth" });
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto pr-2"
        style={{ overflowAnchor: "none" }}
      >
        <div className="space-y-4">
          {children}
        </div>
        {/* Scroll anchor — always at the bottom of content */}
        <div ref={anchorRef} className="h-px" aria-hidden="true" />
      </div>
      {!atBottom ? (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm transition-all hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-1"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={14} weight="bold" />
        </button>
      ) : null}
    </div>
  );
};

export { ChatScroll };
