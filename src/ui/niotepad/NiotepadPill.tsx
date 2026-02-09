"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";

const NiotepadPill = (): ReactElement => {
  const isOpen = useNiotepadStore((s) => s.isOpen);
  const hasUnread = useNiotepadStore((s) => s.hasUnread);
  const pushSignal = useNiotepadStore((s) => s.pushSignal);
  const togglePanel = useNiotepadStore((s) => s.togglePanel);

  const [isPulsing, setIsPulsing] = useState(false);
  const prevSignalRef = useRef(pushSignal);

  // Trigger pulse animation when a push event occurs while panel is closed.
  useEffect(() => {
    const prev = prevSignalRef.current;
    prevSignalRef.current = pushSignal;

    if (pushSignal > 0 && pushSignal !== prev) {
      const raf = window.requestAnimationFrame(() => {
        setIsPulsing(true);
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [pushSignal]);

  const handleAnimationEnd = (): void => {
    setIsPulsing(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={togglePanel}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
          isOpen
            ? "border-accent bg-accent text-white shadow-sm"
            : "border-border bg-surface-muted text-text-muted hover:bg-surface hover:text-foreground"
        }`}
        aria-label={isOpen ? "Close niotepad" : "Open niotepad"}
        aria-pressed={isOpen}
        title="Niotepad (Cmd+J)"
      >
        N
        {hasUnread && !isOpen && (
          <span
            className="absolute -right-0.5 -top-0.5 h-[5px] w-[5px] rounded-full bg-accent"
            aria-hidden="true"
          />
        )}
      </button>
      {/* Ring pulse — sibling to button so box-shadow is never clipped */}
      {isPulsing && !isOpen && (
        <span
          className="niotepad-ring-pulse pointer-events-none absolute inset-0 rounded-full"
          aria-hidden="true"
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
};

export { NiotepadPill };
