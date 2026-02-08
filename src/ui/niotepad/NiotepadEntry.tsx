"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
import ReactMarkdown from "react-markdown";
import { X } from "@phosphor-icons/react";
import type { NiotepadEntryData } from "@/domain/niotepad";

// Content left padding: past binder (12+2+2+2=18) + margin line (48) + gap (8) = 56px
const CONTENT_PL = 56;
const CONTENT_PR = 16;
const SWIPE_THRESHOLD = 80;

interface NiotepadEntryProps {
  entry: NiotepadEntryData;
  isEditing: boolean;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, content: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onSeek?: (timestampSec: number) => void;
}

/** Format seconds as MM:SS */
function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format millisecond timestamp as short date+time (e.g., "Feb 8, 2:34 PM") */
function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

const entryAppearSpring = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 350,
    damping: 25,
    mass: 0.5,
    opacity: { delay: 0.05 },
    y: { delay: 0.05 },
  },
};

const entryAppearInstant = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.01 },
};

const NiotepadEntry = memo(
  function NiotepadEntry({
    entry,
    isEditing,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onSeek,
  }: NiotepadEntryProps): ReactElement {
    const prefersReducedMotion = useReducedMotion();
    const entryAppear = prefersReducedMotion
      ? entryAppearInstant
      : entryAppearSpring;
    const [editValue, setEditValue] = useState(entry.content);
    const [isDeleting, setIsDeleting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Swipe state
    const dragX = useMotionValue(0);
    // Map drag offset to delete strip opacity (0 at rest, 1 at threshold)
    const deleteStripOpacity = useTransform(
      dragX,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
    );

    // Track if this is a horizontal swipe vs vertical scroll
    const dragDirectionRef = useRef<"none" | "horizontal" | "vertical">("none");

    // Auto-focus and auto-resize textarea when entering edit mode
    useEffect(() => {
      if (isEditing && textareaRef.current) {
        const ta = textareaRef.current;
        ta.focus();
        ta.selectionStart = ta.value.length;
        ta.selectionEnd = ta.value.length;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
      }
    }, [isEditing]);

    const handleSave = useCallback(() => {
      const trimmed = editValue.trim();
      if (trimmed && trimmed !== entry.content) {
        onSaveEdit(entry.id, trimmed);
      } else {
        onCancelEdit();
      }
    }, [editValue, entry.content, entry.id, onSaveEdit, onCancelEdit]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancelEdit();
        }
      },
      [handleSave, onCancelEdit],
    );

    const handleTextareaChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditValue(e.target.value);
        const ta = e.target;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
      },
      [],
    );

    const handleClick = useCallback(() => {
      if (!isEditing) {
        onStartEdit(entry.id);
      }
    }, [isEditing, onStartEdit, entry.id]);

    const handleSeek = useCallback(() => {
      if (entry.videoTimeSec != null && onSeek) {
        onSeek(entry.videoTimeSec);
      }
    }, [entry.videoTimeSec, onSeek]);

    // Swipe handlers
    const handleDragStart = useCallback(() => {
      dragDirectionRef.current = "none";
    }, []);

    const handleDrag = useCallback(
      (_: unknown, info: PanInfo) => {
        if (dragDirectionRef.current === "none") {
          const absX = Math.abs(info.offset.x);
          const absY = Math.abs(info.offset.y);
          // Determine direction: if vertical movement is greater, treat as scroll
          if (absY > absX) {
            dragDirectionRef.current = "vertical";
          } else {
            dragDirectionRef.current = "horizontal";
          }
        }

        if (dragDirectionRef.current === "vertical") {
          // Reset to 0 so the entry doesn't slide
          dragX.set(0);
        }
      },
      [dragX],
    );

    const handleDragEnd = useCallback(
      (_: unknown, info: PanInfo) => {
        if (
          dragDirectionRef.current === "horizontal" &&
          info.offset.x < -SWIPE_THRESHOLD
        ) {
          if (prefersReducedMotion) {
            // Instant delete -- skip collapse animation
            onDelete(entry.id);
          } else {
            setIsDeleting(true);
          }
        }
        dragDirectionRef.current = "none";
      },
      [prefersReducedMotion, onDelete, entry.id],
    );

    const handleDeleteClick = useCallback(() => {
      setIsDeleting(true);
    }, []);

    // Trigger actual delete after collapse animation
    const handleAnimationComplete = useCallback(() => {
      if (isDeleting) {
        onDelete(entry.id);
      }
    }, [isDeleting, onDelete, entry.id]);

    const isVideo = entry.source === "video";
    const isCode = entry.source === "code";
    const isChat = entry.source === "chat";

    // Build accessible label with content preview
    const contentPreview =
      entry.content.length > 50
        ? entry.content.slice(0, 50).trimEnd() + "\u2026"
        : entry.content;
    const entryAriaLabel = `${entry.source} note: ${contentPreview}`;

    return (
      <motion.article
        layout
        aria-label={entryAriaLabel}
        {...entryAppear}
        animate={
          isDeleting
            ? { opacity: 0, height: 0, marginBottom: 0 }
            : entryAppear.animate
        }
        transition={
          isDeleting
            ? prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  type: "spring" as const,
                  stiffness: 300,
                  damping: 25,
                  opacity: { duration: 0.15 },
                  height: { delay: 0.05, duration: 0.2 },
                }
            : entryAppear.transition
        }
        onAnimationComplete={handleAnimationComplete}
        className="group relative mb-[24px] overflow-hidden text-sm text-foreground"
      >
        {/* Delete strip (revealed behind entry on swipe) */}
        <motion.div
          className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-status-error text-white"
          style={{ opacity: deleteStripOpacity }}
          aria-hidden="true"
        >
          <X size={18} weight="bold" />
        </motion.div>

        {/* Timestamp + delete on hover */}
        <span
          className="absolute right-8 top-1 z-10 select-none text-[10px] opacity-0 transition-opacity group-hover:opacity-60"
          style={{ color: "var(--niotepad-text-subtle)", lineHeight: "20px" }}
          aria-hidden="true"
        >
          {formatDate(entry.createdAt)}
        </span>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute right-2 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-status-error/10 hover:text-status-error group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/40"
          style={{ color: "var(--niotepad-text-subtle)" }}
          aria-label="Delete note"
        >
          <X size={12} weight="bold" />
        </button>

        {/* Swipeable content layer */}
        <motion.div
          drag={isEditing ? false : "x"}
          dragConstraints={{ left: -120, right: 0 }}
          dragElastic={0.2}
          dragMomentum={false}
          dragPropagation={false}
          style={{
            x: dragX,
            paddingLeft: CONTENT_PL,
            paddingRight: CONTENT_PR,
            // Let browser handle vertical scroll; FM handles horizontal drag
            touchAction: "pan-y",
          }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="relative select-none"
        >
          {/* Video entry header */}
          {isVideo && entry.metadata.lectureTitle && (
            <button
              type="button"
              onClick={handleSeek}
              className="block text-left text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
              style={{ lineHeight: "24px" }}
            >
              {entry.metadata.lectureTitle}
              {entry.videoTimeSec != null && (
                <span
                  className="ml-1 font-normal"
                  style={{ color: "var(--niotepad-text-muted)" }}
                >
                  &mdash; {formatTimestamp(entry.videoTimeSec)}
                </span>
              )}
            </button>
          )}

          {/* Code entry header */}
          {isCode && (
            <span
              className="block text-sm font-semibold text-accent"
              style={{ lineHeight: "24px" }}
              aria-hidden="true"
            >
              Code
              {entry.metadata.filePath && (
                <span
                  className="ml-1 font-normal"
                  style={{ color: "var(--niotepad-text-muted)" }}
                >
                  &mdash; {entry.metadata.filePath.split("/").pop()}
                </span>
              )}
            </span>
          )}

          {/* Chat entry header */}
          {isChat && (
            <span
              className="block text-sm font-semibold text-accent"
              style={{ lineHeight: "24px" }}
              aria-hidden="true"
            >
              Assistant
            </span>
          )}

          {/* Content: edit mode or render mode */}
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="niotepad-composer w-full resize-none border-none bg-transparent p-0 text-sm text-foreground outline-none"
              style={{
                fontFamily: "var(--font-body)",
                lineHeight: "24px",
              }}
              aria-label="Edit note"
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick();
                }
              }}
              className="cursor-text"
              aria-label="Click to edit this note"
            >
              {isCode || isChat ? (
                <div
                  style={{
                    lineHeight: "24px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {entry.content}
                </div>
              ) : (
                <div
                  className="nio-markdown"
                  style={{ lineHeight: "24px" }}
                >
                  <ReactMarkdown>{entry.content}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.article>
    );
  },
  (prev, next) =>
    prev.entry.id === next.entry.id &&
    prev.entry.updatedAt === next.entry.updatedAt &&
    prev.isEditing === next.isEditing &&
    prev.onDelete === next.onDelete,
);

export { NiotepadEntry };
