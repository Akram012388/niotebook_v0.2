"use client";

import {
  memo,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactElement,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { NiotepadEntry as NiotepadEntryType } from "../../domain/niotepad";
import { useNiotepadStore } from "../../infra/niotepad/useNiotepadStore";

interface NiotepadEntryProps {
  entry: NiotepadEntryType;
  onSeek?: (timestampSec: number) => void;
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

function formatVideoTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Swipe threshold in pixels to trigger delete. */
const SWIPE_THRESHOLD = 80;

const NiotepadEntryComponent = memo(function NiotepadEntryComponent({
  entry,
  onSeek,
}: NiotepadEntryProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateEntry = useNiotepadStore((s) => s.updateEntry);
  const deleteEntry = useNiotepadStore((s) => s.deleteEntry);

  // --- Swipe-to-delete state ---
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const swipingRef = useRef(false);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  // --- Edit handlers ---
  const handleStartEdit = useCallback(() => {
    if (isSwiping) return;
    setEditContent(entry.content);
    setIsEditing(true);
  }, [entry.content, isSwiping]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== entry.content) {
      updateEntry(entry.id, { content: trimmed });
    }
    setIsEditing(false);
  }, [editContent, entry.content, entry.id, updateEntry]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      }
      if (e.key === "Escape") {
        setIsEditing(false);
      }
    },
    [handleSaveEdit],
  );

  // --- Video seek ---
  const handleSeek = useCallback(() => {
    if (entry.videoTimeSec !== null) {
      onSeek?.(entry.videoTimeSec);
    }
  }, [onSeek, entry.videoTimeSec]);

  // --- Swipe-to-delete handlers ---
  const handleSwipeStart = useCallback(
    (clientX: number) => {
      if (isEditing) return;
      startXRef.current = clientX;
      swipingRef.current = false;
    },
    [isEditing],
  );

  const handleSwipeMove = useCallback((clientX: number) => {
    const delta = clientX - startXRef.current;
    // Only track left swipes (negative delta)
    if (delta < -4) {
      swipingRef.current = true;
      setIsSwiping(true);
      setSwipeDelta(Math.min(0, delta));
    }
  }, []);

  const handleSwipeEnd = useCallback(() => {
    if (swipeDelta < -SWIPE_THRESHOLD) {
      deleteEntry(entry.id);
    } else {
      setSwipeDelta(0);
    }
    // Delay clearing isSwiping so click handler ignores the release
    requestAnimationFrame(() => {
      setIsSwiping(false);
      swipingRef.current = false;
    });
  }, [swipeDelta, deleteEntry, entry.id]);

  // Touch event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleSwipeStart(e.touches[0].clientX);
    },
    [handleSwipeStart],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleSwipeMove(e.touches[0].clientX);
    },
    [handleSwipeMove],
  );

  const onTouchEnd = useCallback(() => {
    handleSwipeEnd();
  }, [handleSwipeEnd]);

  // Mouse event handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      handleSwipeStart(e.clientX);
    },
    [handleSwipeStart],
  );

  useEffect(() => {
    if (startXRef.current === 0 && !swipingRef.current) return;

    function onMouseMove(e: MouseEvent) {
      handleSwipeMove(e.clientX);
    }

    function onMouseUp() {
      handleSwipeEnd();
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleSwipeMove, handleSwipeEnd]);

  // --- Video entry header ---
  const isVideoEntry =
    entry.source === "video" && entry.videoTimeSec !== null;
  const lectureTitle = (
    entry.metadata as { lectureTitle?: string }
  ).lectureTitle;

  return (
    <div className="relative mb-6 overflow-hidden" data-niotepad-entry>
      {/* Delete strip — revealed behind entry on swipe */}
      {swipeDelta < 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 px-4 text-sm font-medium text-white"
          style={{ width: Math.abs(swipeDelta) }}
          aria-hidden="true"
        >
          {Math.abs(swipeDelta) > SWIPE_THRESHOLD ? "Delete" : ""}
        </div>
      )}

      {/* Entry content — slides left on swipe */}
      <div
        className="relative bg-surface px-4"
        style={{
          transform: swipeDelta < 0 ? `translateX(${swipeDelta}px)` : undefined,
          transition: isSwiping ? "none" : "transform 200ms ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {/* Video entry: clickable header + summary */}
        {isVideoEntry && !isEditing && (
          <button
            type="button"
            onClick={handleSeek}
            className="cursor-pointer text-sm leading-[28px] text-accent decoration-accent/40 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1"
            aria-label={`Seek to ${formatVideoTime(entry.videoTimeSec!)}`}
          >
            {lectureTitle
              ? `${lectureTitle} \u2014 ${formatVideoTime(entry.videoTimeSec!)}`
              : `Video \u2014 ${formatVideoTime(entry.videoTimeSec!)}`}
          </button>
        )}

        {/* Content body */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleEditKeyDown}
            className="w-full appearance-none resize-none bg-transparent px-0 text-sm leading-[28px] text-foreground"
            style={{ border: "none", outline: "none", boxShadow: "none" }}
            rows={Math.max(2, editContent.split("\n").length)}
          />
        ) : (
          <div
            className="nio-markdown cursor-text text-sm leading-[28px] text-foreground"
            onClick={handleStartEdit}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleStartEdit();
            }}
            aria-label="Click to edit entry"
          >
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
            >
              {entry.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

export { NiotepadEntryComponent as NiotepadEntry };
