"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowDown } from "@phosphor-icons/react";

type ChatScrollProps = {
  children: ReactNode;
};

type ChatScrollHandle = {
  scrollToBottom: () => void;
};

const ChatScroll = forwardRef<ChatScrollHandle, ChatScrollProps>(
  function ChatScroll({ children }, ref) {
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
      const isAtBottom = distanceFromBottom < 60;
      atBottomRef.current = isAtBottom;
      setAtBottom(isAtBottom);
    }, []);

    // Auto-scroll when content grows if user is at bottom.
    // Works during streaming AND non-streaming — the atBottom guard
    // ensures we only auto-follow when the user hasn't scrolled up.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

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
    }, []);

    const scrollToBottom = useCallback((): void => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      // Immediate scroll (no smooth) so user sees their message instantly
      anchor.scrollIntoView({ block: "end", behavior: "instant" as ScrollBehavior });
      atBottomRef.current = true;
      setAtBottom(true);
    }, []);

    useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

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
          <div className="space-y-4 pb-4">
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
  },
);

export { ChatScroll };
export type { ChatScrollHandle };
