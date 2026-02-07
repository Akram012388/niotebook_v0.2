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

const BOTTOM_THRESHOLD = 60;

const ChatScroll = forwardRef<ChatScrollHandle, ChatScrollProps>(
  function ChatScroll({ children }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = useState(true);
    const atBottomRef = useRef(true);

    const checkAtBottom = useCallback((el: HTMLElement): boolean => {
      return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    }, []);

    const handleScroll = useCallback((): void => {
      const el = containerRef.current;
      if (!el) return;
      const bottom = checkAtBottom(el);
      atBottomRef.current = bottom;
      setAtBottom(bottom);
    }, [checkAtBottom]);

    // Scroll-follow via synchronous callback — no RAF delay.
    // ResizeObserver fires once per frame (part of rendering pipeline).
    // MutationObserver catches text changes that don't alter box size.
    // Both scroll immediately so content + scroll update paint in the same frame.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const content = container.firstElementChild as HTMLElement | null;
      if (!content) return;

      const scrollToEnd = (): void => {
        if (!atBottomRef.current) return;
        container.scrollTop = container.scrollHeight;
      };

      const resizeObs = new ResizeObserver(scrollToEnd);
      resizeObs.observe(content);

      const mutationObs = new MutationObserver(scrollToEnd);
      mutationObs.observe(content, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        resizeObs.disconnect();
        mutationObs.disconnect();
      };
    }, []);

    const scrollToBottom = useCallback((): void => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      atBottomRef.current = true;
      setAtBottom(true);
    }, []);

    useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

    const handleScrollToBottom = useCallback((): void => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      atBottomRef.current = true;
      setAtBottom(true);
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
