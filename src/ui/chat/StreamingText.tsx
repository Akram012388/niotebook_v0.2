"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

/**
 * Characters revealed per frame at 60 fps.
 * Higher = faster reveal. 2–3 gives a natural ChatGPT-like cadence.
 * When the pending buffer is large we accelerate to avoid falling behind.
 */
const BASE_CHARS_PER_FRAME = 2;
const MAX_CHARS_PER_FRAME = 12;
/** Once the pending buffer exceeds this, start accelerating. */
const ACCEL_THRESHOLD = 80;
/** Minimum interval (ms) between React state updates for markdown render. */
const RENDER_INTERVAL_MS = 50;

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

type StreamingTextHandle = {
  /** Append new token text to the pending buffer. */
  append: (text: string) => void;
  /** Returns the full revealed text so far (for handoff to markdown). */
  getText: () => string;
  /** Reset internal state for a new stream. */
  reset: () => void;
};

/**
 * High-performance streaming text renderer with live markdown.
 *
 * Tokens are pushed via the imperative `append()` handle. A RAF loop reveals
 * characters at a steady cadence. The revealed text is rendered through
 * ReactMarkdown so the user sees final typography (bold, code, lists, etc.)
 * throughout the stream — eliminating the layout shift at stream completion.
 *
 * React re-renders are throttled to ~20fps (every 50ms) to keep the main
 * thread responsive while still providing smooth visual updates.
 */
const StreamingText = forwardRef<StreamingTextHandle>(
  function StreamingText(_props, ref) {
    const dotsRef = useRef<HTMLSpanElement | null>(null);
    const cursorRef = useRef<HTMLSpanElement | null>(null);
    const rafRef = useRef<number | null>(null);

    // Mutable state — RAF loop reads/writes these without triggering renders
    const revealedRef = useRef(""); // text already revealed
    const pendingRef = useRef(""); // text waiting to be revealed
    const startedRef = useRef(false); // has first char been revealed?
    const lastRenderRef = useRef(0); // timestamp of last React state flush
    const dirtyRef = useRef(false); // true when revealed text changed since last render

    // React state — drives the markdown render, updated at throttled intervals
    const [displayText, setDisplayText] = useState("");

    // Store setDisplayText in a ref so the tick function (which only reads refs)
    // can trigger React renders without being wrapped in useCallback.
    const setDisplayTextRef = useRef(setDisplayText);
    setDisplayTextRef.current = setDisplayText;

    const tick = (): void => {
      const pending = pendingRef.current;

      if (pending.length === 0) {
        // Nothing to reveal — flush any remaining dirty text and stop the loop.
        // The loop restarts when append() adds new text.
        if (dirtyRef.current) {
          dirtyRef.current = false;
          lastRenderRef.current = performance.now();
          setDisplayTextRef.current(revealedRef.current);
        }
        rafRef.current = null;
        return;
      }

      // First text arriving — swap thinking dots for cursor
      if (!startedRef.current) {
        startedRef.current = true;
        if (dotsRef.current) dotsRef.current.style.display = "none";
        if (cursorRef.current) cursorRef.current.style.display = "inline-block";
      }

      // Adaptive speed: accelerate when buffer is large to prevent lag
      const chars = Math.min(
        pending.length,
        pending.length > ACCEL_THRESHOLD
          ? MAX_CHARS_PER_FRAME
          : BASE_CHARS_PER_FRAME,
      );

      pendingRef.current = pending.slice(chars);
      revealedRef.current += pending.slice(0, chars);
      dirtyRef.current = true;

      // Throttle React state updates to avoid excessive re-renders
      const now = performance.now();
      if (now - lastRenderRef.current >= RENDER_INTERVAL_MS) {
        dirtyRef.current = false;
        lastRenderRef.current = now;
        setDisplayTextRef.current(revealedRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
      // tick is stable (refs only) — run once on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        append(text: string) {
          const wasIdle = pendingRef.current.length === 0;
          pendingRef.current += text;
          // Restart the RAF loop if it was idle (stopped due to empty buffer)
          if (wasIdle && rafRef.current === null) {
            rafRef.current = requestAnimationFrame(tick);
          }
        },
        getText() {
          return revealedRef.current + pendingRef.current;
        },
        reset() {
          revealedRef.current = "";
          pendingRef.current = "";
          startedRef.current = false;
          dirtyRef.current = false;
          lastRenderRef.current = 0;
          setDisplayText("");
          if (dotsRef.current) dotsRef.current.style.display = "inline-flex";
          if (cursorRef.current) cursorRef.current.style.display = "none";
        },
      }),
      // tick is stable (reads only refs) — no need to recreate handle
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    return (
      <>
        {/* Thinking dots — visible until first token arrives */}
        <span ref={dotsRef} className="nio-thinking-dots" aria-label="Thinking">
          <span className="nio-thinking-dot" />
          <span className="nio-thinking-dot" />
          <span className="nio-thinking-dot" />
        </span>
        {displayText ? (
          <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
          >
            {displayText}
          </ReactMarkdown>
        ) : null}
        {/* Cursor — hidden until first token, then blinks at insertion point */}
        <span
          ref={cursorRef}
          className="nio-stream-cursor"
          style={{ display: "none" }}
          aria-hidden="true"
        />
      </>
    );
  },
);

export { StreamingText };
export type { StreamingTextHandle };
