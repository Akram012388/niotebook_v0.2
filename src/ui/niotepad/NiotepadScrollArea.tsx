"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

// Binder geometry (tighter than NotebookFrame for panel context)
const RAIL_W = 2;
const RAIL_GAP = 2;
const BINDER_LEFT = 12;
const HOLE_D = 6;
const HOLE_SPACING = 12;

interface NiotepadScrollAreaProps {
  children: ReactNode;
  onPaperClick: () => void;
}

function NiotepadScrollArea({
  children,
  onPaperClick,
}: NiotepadScrollAreaProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevChildCountRef = useRef(0);

  // Check reduced motion preference for scroll behavior
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent): void => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Count direct children to detect new entries
    const currentCount = el.children.length;
    if (currentCount > prevChildCountRef.current) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: reducedMotionRef.current ? "instant" : "smooth",
      });
    }
    prevChildCountRef.current = currentCount;
  });

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only trigger paper click if the click target is the scroll area itself
      // (not an entry or the composer)
      if (e.target === e.currentTarget) {
        onPaperClick();
      }
    },
    [onPaperClick],
  );

  // Binder strip dimensions
  const containerW = RAIL_W * 2 + RAIL_GAP;
  const holeR = HOLE_D / 2;

  // CSS mask that punches transparent circles (same technique as NotebookFrame)
  const stripMask = {
    WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
    maskImage: `radial-gradient(circle at 50% 50%, transparent ${holeR}px, white ${holeR + 0.5}px)`,
    WebkitMaskSize: `100% ${HOLE_SPACING}px`,
    maskSize: `100% ${HOLE_SPACING}px`,
    WebkitMaskRepeat: "repeat-y",
    maskRepeat: "repeat-y",
  } as React.CSSProperties;

  const binderInset = {
    left: BINDER_LEFT,
    top: 0,
    bottom: 0,
    width: containerW,
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Binder rails layer */}
      <div
        className="pointer-events-none absolute z-[1]"
        aria-hidden="true"
        style={binderInset}
      >
        <div
          className="absolute inset-y-0"
          style={{ left: 0, width: RAIL_W, background: "var(--foreground)" }}
        />
        <div
          className="absolute inset-y-0"
          style={{ right: 0, width: RAIL_W, background: "var(--foreground)" }}
        />
      </div>

      {/* Binder mask strip (punches holes to reveal rails) */}
      <div
        className="pointer-events-none absolute z-[2]"
        aria-hidden="true"
        style={{
          ...binderInset,
          ...stripMask,
          background: "var(--niotepad-paper)",
        }}
      />

      {/* Scrollable ruled paper */}
      <div
        ref={scrollRef}
        id="niotepad-entries"
        role="region"
        aria-label="Notes"
        className="niotepad-scroll relative z-[3] h-full overflow-y-auto"
        style={{
          backgroundColor: "var(--niotepad-paper)",
          backgroundImage: [
            // Horizontal ruled lines at 24px intervals
            `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent calc(24px - 1px),
              var(--niotepad-ruled) calc(24px - 1px),
              var(--niotepad-ruled) 24px
            )`,
            // Left margin line
            `linear-gradient(
              to right,
              transparent 47px,
              var(--niotepad-margin) 47px,
              var(--niotepad-margin) 48px,
              transparent 48px
            )`,
          ].join(", "),
          backgroundAttachment: "local",
        }}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

export { NiotepadScrollArea };
