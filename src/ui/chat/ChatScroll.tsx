"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

type ChatScrollProps = {
  children: ReactNode;
};

const ChatScroll = ({ children }: ChatScrollProps): ReactElement => {
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

    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [children, atBottom]);

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
          className="absolute bottom-3 right-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
        >
          Scroll to bottom
        </button>
      ) : null}
    </div>
  );
};

export { ChatScroll };
