"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";
import { useVideoDisplayTime } from "../layout/WorkspaceGrid";

type SelectionPushResult = {
  /** Currently selected text (empty string if no selection). */
  selectedText: string;
  /** Bounding rect of the selection end — use for tooltip positioning. */
  selectionRect: DOMRect | null;
  /** Whether a valid selection is active inside the container. */
  isActive: boolean;
  /** Push the current selection to niotepad. */
  pushToNiotepad: () => void;
  /** Brief confirmation flag (true for ~1.5s after push). */
  showConfirmation: boolean;
};

function useSelectionPush(
  containerRef: RefObject<HTMLDivElement | null>,
  lessonId: string,
  lectureTitle: string,
): SelectionPushResult {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoTimeSec = useVideoDisplayTime();

  const isActive = selectedText.length > 0;

  const clearSelection = useCallback(() => {
    setSelectedText("");
    setSelectionRect(null);
  }, []);

  const pushToNiotepad = useCallback(() => {
    if (!selectedText) return;

    const store = useNiotepadStore.getState();
    const pageId = store.getOrCreatePage(lessonId, lectureTitle);
    store.addEntry({
      source: "chat",
      content: selectedText,
      pageId,
      videoTimeSec,
      metadata: { lectureTitle },
    });

    // Clear selection
    window.getSelection()?.removeAllRanges();
    clearSelection();

    // Show confirmation
    setShowConfirmation(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setShowConfirmation(false);
      confirmTimerRef.current = null;
    }, 1500);
  }, [selectedText, lessonId, lectureTitle, videoTimeSec, clearSelection]);

  // Listen for selection changes within the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelectionChange = (): void => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        clearSelection();
        return;
      }

      const range = selection.getRangeAt(0);
      // Ensure selection is within our container
      if (!container.contains(range.commonAncestorContainer)) {
        clearSelection();
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        clearSelection();
        return;
      }

      setSelectedText(text);
      setSelectionRect(range.getBoundingClientRect());
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef, clearSelection]);

  // Keyboard shortcut: Cmd/Ctrl+Shift+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (
        e.key.toLowerCase() === "n" &&
        e.shiftKey &&
        (e.metaKey || e.ctrlKey) &&
        isActive
      ) {
        e.preventDefault();
        pushToNiotepad();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, pushToNiotepad]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  return {
    selectedText,
    selectionRect,
    isActive,
    pushToNiotepad,
    showConfirmation,
  };
}

export { useSelectionPush };
export type { SelectionPushResult };
