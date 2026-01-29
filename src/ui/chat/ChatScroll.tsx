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
  const [atBottom, setAtBottom] = useState(true);

  const handleScroll = useCallback((): void => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setAtBottom(distanceFromBottom < 40);
  }, []);

  useEffect((): void => {
    handleScroll();
  }, [handleScroll]);

  useEffect((): void => {
    if (!atBottom) {
      return;
    }

    const element = containerRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [children, atBottom, isStreaming]);

  const handleScrollToBottom = useCallback((): void => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full space-y-4 overflow-y-auto pr-2"
      >
        {children}
      </div>
      {!atBottom ? (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm transition hover:bg-surface-muted hover:text-foreground"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={16} weight="bold" />
        </button>
      ) : null}
    </div>
  );
};

export { ChatScroll };
