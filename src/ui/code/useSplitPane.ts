/**
 * useSplitPane — hook for split-pane drag state, ratio, and localStorage persistence.
 */
import { useEffect, useRef, useState, type RefObject } from "react";

type UseSplitPaneOptions = {
  direction: "horizontal" | "vertical";
  initialSplit: number;
  /** Minimum size for the first pane in pixels. */
  minFirst: number;
  /** Maximum size for the first pane in pixels (optional). */
  maxFirst?: number;
  /** Minimum size for the second pane in pixels. */
  minSecond: number;
  /** Maximum size for the second pane in pixels (optional). */
  maxSecond?: number;
  storageKey?: string;
  containerRef?: RefObject<HTMLDivElement | null>;
  resetOnLoad?: "first" | "second";
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
  maxFirstPx?: number,
  maxSecondPx?: number,
): number {
  if (containerSize && containerSize > 0) {
    const minFirstRatio = minFirstPx / containerSize;
    const minSecondRatio = minSecondPx / containerSize;
    let lowerBound = minFirstRatio;
    let upperBound = 1 - minSecondRatio;

    if (typeof maxFirstPx === "number") {
      const maxFirstRatio = maxFirstPx / containerSize;
      upperBound = Math.min(upperBound, maxFirstRatio);
    }

    if (typeof maxSecondPx === "number") {
      const maxSecondRatio = maxSecondPx / containerSize;
      lowerBound = Math.max(lowerBound, 1 - maxSecondRatio);
    }

    if (lowerBound > upperBound) {
      return Math.min(Math.max(ratio, 0.05), 0.95);
    }

    return Math.min(Math.max(ratio, lowerBound), upperBound);
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

function takeResetGuard(
  storageKey: string | undefined,
  resetOnLoad: "first" | "second" | undefined,
): boolean {
  if (!storageKey || !resetOnLoad || typeof window === "undefined") {
    return false;
  }
  try {
    const key = `${storageKey}:reset-on-load`;
    if (sessionStorage.getItem(key) === "1") {
      return false;
    }
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

function useSplitPane({
  direction,
  initialSplit,
  minFirst,
  maxFirst,
  minSecond,
  maxSecond,
  storageKey,
  containerRef: externalContainerRef,
  resetOnLoad,
}: UseSplitPaneOptions): UseSplitPaneReturn {
  const [storedRatio] = useState<number | null>(() => loadRatio(storageKey));
  const storedRatioRef = useRef<number | null>(storedRatio);
  const initialSplitRef = useRef(initialSplit);
  const didApplyInitialSplitRef = useRef(false);
  const didResetRef = useRef(false);
  const [shouldResetOnLoad] = useState(() =>
    takeResetGuard(storageKey, resetOnLoad),
  );

  const [ratio, setRatio] = useState<number>(() => {
    if (storedRatio !== null) {
      return storedRatio;
    }
    if (initialSplit > 1) {
      return 0.2;
    }
    return initialSplit;
  });

  const [isDragging, setIsDragging] = useState(false);
  const internalContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;
  const hasExternalRef = Boolean(externalContainerRef);
  const ratioRef = useRef(ratio);

  const handleMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    setIsDragging(true);

    // Find the container (parent of the divider)
    const container =
      containerRef.current ?? (e.currentTarget as HTMLElement).parentElement;
    if (!container) return;
    if (!hasExternalRef && !internalContainerRef.current) {
      internalContainerRef.current = container as HTMLDivElement;
    }

    const isVertical = direction === "vertical";

    const onMouseMove = (moveEvent: MouseEvent): void => {
      const rect = container.getBoundingClientRect();
      const total = isVertical ? rect.height : rect.width;
      if (total === 0) return;

      const offset = isVertical
        ? moveEvent.clientY - rect.top
        : moveEvent.clientX - rect.left;

      const newRatio = clampRatio(
        offset / total,
        minFirst,
        minSecond,
        total,
        maxFirst,
        maxSecond,
      );
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
  };

  const handleDoubleClick = (): void => {
    const container = containerRef.current;
    const total = container
      ? direction === "vertical"
        ? container.getBoundingClientRect().height
        : container.getBoundingClientRect().width
      : undefined;
    const baseRatio =
      initialSplitRef.current > 1 && total
        ? initialSplitRef.current / total
        : initialSplitRef.current;
    const clamped = clampRatio(
      baseRatio,
      minFirst,
      minSecond,
      total,
      maxFirst,
      maxSecond,
    );
    setRatio(clamped);
    saveRatio(storageKey, clamped);
    window.dispatchEvent(new Event("resize"));
  };

  const keyStep = (delta: number): void => {
    const container = containerRef.current;
    const total = container
      ? direction === "vertical"
        ? container.getBoundingClientRect().height
        : container.getBoundingClientRect().width
      : undefined;
    const newRatio = clampRatio(
      ratioRef.current + delta,
      minFirst,
      minSecond,
      total,
      maxFirst,
      maxSecond,
    );
    setRatio(newRatio);
    saveRatio(storageKey, newRatio);
    window.dispatchEvent(new Event("resize"));
  };

  // Sync localStorage when ratio changes from external sources
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const total = direction === "vertical" ? rect.height : rect.width;
    if (shouldResetOnLoad && !didResetRef.current && total > 0) {
      const targetRatio =
        resetOnLoad === "first" ? minFirst / total : 1 - minSecond / total;
      const clamped = clampRatio(
        targetRatio,
        minFirst,
        minSecond,
        total,
        maxFirst,
        maxSecond,
      );
      didResetRef.current = true;
      if (clamped !== ratioRef.current) {
        const raf = window.requestAnimationFrame(() => {
          if (clamped === ratioRef.current) return;
          setRatio(clamped);
          saveRatio(storageKey, clamped);
          window.dispatchEvent(new Event("resize"));
        });
        return () => {
          window.cancelAnimationFrame(raf);
        };
      }
      return;
    }
    let baseRatio = ratioRef.current;
    if (
      !didApplyInitialSplitRef.current &&
      storedRatioRef.current === null &&
      initialSplitRef.current > 1 &&
      total > 0
    ) {
      baseRatio = initialSplitRef.current / total;
      didApplyInitialSplitRef.current = true;
    }
    const clamped = clampRatio(
      baseRatio,
      minFirst,
      minSecond,
      total,
      maxFirst,
      maxSecond,
    );
    if (clamped !== ratioRef.current) {
      const raf = window.requestAnimationFrame(() => {
        if (clamped === ratioRef.current) return;
        setRatio(clamped);
        saveRatio(storageKey, clamped);
        window.dispatchEvent(new Event("resize"));
      });
      return () => {
        window.cancelAnimationFrame(raf);
      };
    }
  }, [
    direction,
    minFirst,
    minSecond,
    maxFirst,
    maxSecond,
    storageKey,
    containerRef,
    resetOnLoad,
    shouldResetOnLoad,
  ]);

  return { ratio, isDragging, handleMouseDown, handleDoubleClick, keyStep };
}

export { useSplitPane };
export type { UseSplitPaneOptions, UseSplitPaneReturn };
