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
          className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-workspace-accent bg-surface text-workspace-accent shadow-lg shadow-workspace-accent/20 transition-all hover:scale-110 hover:bg-workspace-accent hover:text-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-workspace-accent focus-visible:ring-offset-2"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={18} weight="bold" />
        </button>
      ) : null}
    </div>
  );
};

export { ChatScroll };
