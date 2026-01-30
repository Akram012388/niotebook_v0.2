/**
 * useSplitPane — hook for split-pane drag state, ratio, and localStorage persistence.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type UseSplitPaneOptions = {
  direction: "horizontal" | "vertical";
  initialSplit: number;
  minFirst: number;
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

function clampRatio(
  ratio: number,
  minFirst: number,
  minSecond: number,
): number {
  return Math.min(Math.max(ratio, minFirst), 1 - minSecond);
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
    return stored !== null
      ? clampRatio(stored, minFirst, minSecond)
      : initialSplit;
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

        const newRatio = clampRatio(offset / total, minFirst, minSecond);
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
    const clamped = clampRatio(initialSplit, minFirst, minSecond);
    setRatio(clamped);
    saveRatio(storageKey, clamped);
    window.dispatchEvent(new Event("resize"));
  }, [initialSplit, minFirst, minSecond, storageKey]);

  const keyStep = useCallback(
    (delta: number) => {
      const newRatio = clampRatio(ratioRef.current + delta, minFirst, minSecond);
      setRatio(newRatio);
      saveRatio(storageKey, newRatio);
      window.dispatchEvent(new Event("resize"));
    },
    [minFirst, minSecond, storageKey],
  );

  // Sync localStorage when ratio changes from external sources
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  return { ratio, isDragging, handleMouseDown, handleDoubleClick, keyStep };
}

export { useSplitPane };
export type { UseSplitPaneOptions, UseSplitPaneReturn };
