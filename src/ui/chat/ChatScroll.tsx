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
  /** When true, runs a continuous smooth scroll loop (lerp interpolation). */
  isStreaming?: boolean;
};

type ChatScrollHandle = {
  scrollToBottom: () => void;
};

const BOTTOM_THRESHOLD = 60;
/** Lerp factor — higher = faster catch-up. 0.22 gives smooth ChatGPT-like follow. */
const SCROLL_LERP = 0.22;
/** Minimum scroll step in px — prevents sub-pixel stalling on slow char reveals. */
const MIN_SCROLL_STEP = 1;

const ChatScroll = forwardRef<ChatScrollHandle, ChatScrollProps>(
  function ChatScroll({ children, isStreaming = false }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [atBottom, setAtBottom] = useState(true);
    const atBottomRef = useRef(true);
    const lerpRafRef = useRef<number | null>(null);
    /** True when the user actively scrolled up during streaming. */
    const userScrolledAwayRef = useRef(false);
    const prevScrollTopRef = useRef(0);

    const handleScroll = useCallback((): void => {
      const el = containerRef.current;
      if (!el) return;
      const distFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      const bottom = distFromBottom < BOTTOM_THRESHOLD;
      atBottomRef.current = bottom;
      setAtBottom(bottom);

      // Lerp only ever increases scrollTop. Any decrease = user scrolled up.
      if (el.scrollTop < prevScrollTopRef.current - 2) {
        userScrolledAwayRef.current = true;
      }
      if (bottom) {
        userScrolledAwayRef.current = false;
      }
      prevScrollTopRef.current = el.scrollTop;
    }, []);

    // Lerp scroll loop — runs continuously during streaming.
    // Each frame, interpolates scrollTop toward scrollHeight by SCROLL_LERP factor.
    // This creates buttery smooth following: content grows in small text-node
    // increments, scroll smoothly catches up each frame. No discrete jumps.
    useEffect(() => {
      if (!isStreaming) {
        // Not streaming — cancel any running loop
        if (lerpRafRef.current !== null) {
          cancelAnimationFrame(lerpRafRef.current);
          lerpRafRef.current = null;
        }
        // Snap to bottom on stream end — guard on userScrolledAwayRef (not
        // atBottomRef) because the lerp's incremental scrolling leaves
        // atBottomRef transiently false even while actively following.
        if (!userScrolledAwayRef.current) {
          const el = containerRef.current;
          if (el) {
            el.scrollTop = el.scrollHeight;
            // Second snap after React commits the StreamingText → Markdown
            // DOM swap, which can momentarily change content height.
            requestAnimationFrame(() => {
              el.scrollTop = el.scrollHeight;
            });
          }
        }
        userScrolledAwayRef.current = false;
        return;
      }

      // New stream — reset scroll-away tracking so lerp follows from start
      userScrolledAwayRef.current = false;

      const tick = (): void => {
        const el = containerRef.current;
        if (!el || userScrolledAwayRef.current) {
          lerpRafRef.current = requestAnimationFrame(tick);
          return;
        }

        const target = el.scrollHeight - el.clientHeight;
        const diff = target - el.scrollTop;

        if (diff > 0.5) {
          el.scrollTop += Math.max(diff * SCROLL_LERP, MIN_SCROLL_STEP);
        }

        lerpRafRef.current = requestAnimationFrame(tick);
      };

      lerpRafRef.current = requestAnimationFrame(tick);

      return () => {
        if (lerpRafRef.current !== null) {
          cancelAnimationFrame(lerpRafRef.current);
          lerpRafRef.current = null;
        }
      };
    }, [isStreaming]);

    // Fallback: ResizeObserver for non-streaming content changes (new messages
    // loading from Convex, initial render). Only active when NOT streaming
    // (the lerp loop handles streaming).
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const content = container.firstElementChild as HTMLElement | null;
      if (!content) return;

      const observer = new ResizeObserver(() => {
        if (isStreaming || !atBottomRef.current) return;
        container.scrollTop = container.scrollHeight;
      });

      observer.observe(content);
      return () => observer.disconnect();
    }, [isStreaming]);

    // Imperative snap — used by parent (AiPane) when streaming placeholder mounts.
    // Must be instant so the lerp loop takes over cleanly with no smooth-scroll race.
    const scrollToBottom = useCallback((): void => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      atBottomRef.current = true;
      setAtBottom(true);
      userScrolledAwayRef.current = false;
    }, []);

    useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom]);

    // Button click — smooth scroll + re-engage auto-follow
    const handleScrollToBottom = useCallback((): void => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      atBottomRef.current = true;
      setAtBottom(true);
      userScrolledAwayRef.current = false;
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
