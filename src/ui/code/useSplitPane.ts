/**
 * useSplitPane — hook for split-pane drag state, ratio, and localStorage persistence.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type UseSplitPaneOptions = {
  direction: "horizontal" | "vertical";
  initialSplit: number;
  /** Minimum size for the first pane in pixels. */
  minFirst: number;
  /** Minimum size for the second pane in pixels. */
  minSecond: number;
  storageKey?: string;
};

type UseSplitPaneReturn = {
  ratio: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleDoubleClick: () => void;
  keyStep: (delta: number) => void;
};

/**
 * Clamp a ratio given pixel-based minimums and the total container size.
 * When containerSize is unknown (0), falls back to 0..1 range.
 */
function clampRatio(
  ratio: number,
  minFirstPx: number,
  minSecondPx: number,
  containerSize?: number,
): number {
  if (containerSize && containerSize > 0) {
    const minFirstRatio = minFirstPx / containerSize;
    const minSecondRatio = minSecondPx / containerSize;
    return Math.min(Math.max(ratio, minFirstRatio), 1 - minSecondRatio);
  }
  // Fallback: treat as small ratios to avoid locking panes
  return Math.min(Math.max(ratio, 0.05), 0.95);
}

function loadRatio(storageKey: string | undefined): number | null {
  if (!storageKey) return null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveRatio(storageKey: string | undefined, ratio: number): void {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, String(ratio));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function useSplitPane({
  direction,
  initialSplit,
  minFirst,
  minSecond,
  storageKey,
}: UseSplitPaneOptions): UseSplitPaneReturn {
  const [ratio, setRatio] = useState<number>(() => {
    const stored = loadRatio(storageKey);
    // On initial render we don't have container size, so trust the stored/initial value
    return stored ?? initialSplit;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const ratioRef = useRef(ratio);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      // Find the container (parent of the divider)
      const container = (e.currentTarget as HTMLElement).parentElement;
      if (!container) return;
      containerRef.current = container;

      const isVertical = direction === "vertical";

      const onMouseMove = (moveEvent: MouseEvent): void => {
        const rect = container.getBoundingClientRect();
        const total = isVertical ? rect.height : rect.width;
        if (total === 0) return;

        const offset = isVertical
          ? moveEvent.clientY - rect.top
          : moveEvent.clientX - rect.left;

        const newRatio = clampRatio(offset / total, minFirst, minSecond, total);
        setRatio(newRatio);
      };

      const onMouseUp = (): void => {
        setIsDragging(false);
        saveRatio(storageKey, ratioRef.current);
        // Dispatch resize so xterm fitAddon and CM6 reflow
        window.dispatchEvent(new Event("resize"));
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [direction, minFirst, minSecond, storageKey],
  );

  const handleDoubleClick = useCallback(() => {
    const container = containerRef.current;
    const total = container
      ? (direction === "vertical" ? container.getBoundingClientRect().height : container.getBoundingClientRect().width)
      : undefined;
    const clamped = clampRatio(initialSplit, minFirst, minSecond, total);
    setRatio(clamped);
    saveRatio(storageKey, clamped);
    window.dispatchEvent(new Event("resize"));
  }, [direction, initialSplit, minFirst, minSecond, storageKey]);

  const keyStep = useCallback(
    (delta: number) => {
      const container = containerRef.current;
      const total = container
        ? (direction === "vertical" ? container.getBoundingClientRect().height : container.getBoundingClientRect().width)
        : undefined;
      const newRatio = clampRatio(ratioRef.current + delta, minFirst, minSecond, total);
      setRatio(newRatio);
      saveRatio(storageKey, newRatio);
      window.dispatchEvent(new Event("resize"));
    },
    [direction, minFirst, minSecond, storageKey],
  );

  // Sync localStorage when ratio changes from external sources
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  return { ratio, isDragging, handleMouseDown, handleDoubleClick, keyStep };
}

export { useSplitPane };
export type { UseSplitPaneOptions, UseSplitPaneReturn };
