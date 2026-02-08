"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";

/** Minimum characters to show the push tooltip. */
const MIN_SELECTION_LENGTH = 3;

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  text: string;
};

const HIDDEN: TooltipState = { visible: false, x: 0, y: 0, text: "" };

/**
 * Detects text selections within a container and provides state for a
 * floating "Push to Niotepad" tooltip.
 *
 * The hook listens to `selectionchange` on document but only activates
 * when the selection's anchor node is inside `containerRef`.
 */
function useSelectionPush(
  containerRef: React.RefObject<HTMLElement | null>,
  lessonId: string | undefined,
) {
  const [tooltip, setTooltip] = useState<TooltipState>(HIDDEN);
  const [pushed, setPushed] = useState(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleSelectionChange = (): void => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setTooltip(HIDDEN);
        return;
      }

      const container = containerRef.current;
      if (!container) {
        setTooltip(HIDDEN);
        return;
      }

      // Check if the selection's anchor is within our container
      const anchorNode = selection.anchorNode;
      if (!anchorNode || !container.contains(anchorNode)) {
        setTooltip(HIDDEN);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < MIN_SELECTION_LENGTH) {
        setTooltip(HIDDEN);
        return;
      }

      // Get position from the last range's bounding rect
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Position the tooltip above-right of the selection end,
      // relative to the container
      setTooltip({
        visible: true,
        x: Math.min(
          rect.right - containerRect.left,
          containerRect.width - 40,
        ),
        y: rect.top - containerRect.top - 8,
        text,
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef]);

  const handlePush = useCallback((): void => {
    if (!tooltip.text || !lessonId) return;

    useNiotepadStore.getState().addEntry({
      source: "chat",
      content: tooltip.text,
      lessonId,
      videoTimeSec: null,
      metadata: {},
    });

    // Show checkmark briefly before hiding
    setPushed(true);
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      setPushed(false);
      setTooltip(HIDDEN);
      // Clear the browser selection
      window.getSelection()?.removeAllRanges();
    }, 600);
  }, [tooltip.text, lessonId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, []);

  return { tooltip, pushed, handlePush };
}

export { useSelectionPush };
export type { TooltipState };
