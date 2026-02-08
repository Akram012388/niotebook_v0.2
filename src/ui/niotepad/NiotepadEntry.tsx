"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { NiotepadEntryData } from "@/domain/niotepad";

// Content left padding: past binder (12+2+2+2=18) + margin line (48) + gap (8) = 56px
const CONTENT_PL = 56;
const CONTENT_PR = 16;

interface NiotepadEntryProps {
  entry: NiotepadEntryData;
  isEditing: boolean;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, content: string) => void;
  onCancelEdit: () => void;
  onSeek?: (timestampSec: number) => void;
}

/** Format seconds as MM:SS */
function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const entryAppear = {
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

const NiotepadEntry = memo(
  function NiotepadEntry({
    entry,
    isEditing,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onSeek,
  }: NiotepadEntryProps): ReactElement {
    const [editValue, setEditValue] = useState(entry.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus and auto-resize textarea when entering edit mode
    useEffect(() => {
      if (isEditing && textareaRef.current) {
        const ta = textareaRef.current;
        ta.focus();
        // Move cursor to end
        ta.selectionStart = ta.value.length;
        ta.selectionEnd = ta.value.length;
        // Auto-size
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
        // Auto-resize
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

    const isVideo = entry.source === "video";

    return (
      <motion.article
        layout
        aria-label="Note entry"
        {...entryAppear}
        style={{
          paddingLeft: CONTENT_PL,
          paddingRight: CONTENT_PR,
          lineHeight: "24px",
        }}
        className="relative py-0.5 text-sm text-foreground"
      >
        {/* Video entry header */}
        {isVideo && entry.metadata.lectureTitle && (
          <button
            type="button"
            onClick={handleSeek}
            className="mb-0.5 block text-left text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            style={{ lineHeight: "24px" }}
          >
            {entry.metadata.lectureTitle}
            {entry.videoTimeSec != null && (
              <span className="ml-1 font-normal text-text-muted">
                &mdash; {formatTimestamp(entry.videoTimeSec)}
              </span>
            )}
          </button>
        )}

        {/* Content: edit mode or render mode */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full resize-none border-none bg-transparent p-0 text-sm text-foreground outline-none"
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
            <div className="nio-markdown" style={{ lineHeight: "24px" }}>
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </motion.article>
    );
  },
  (prev, next) =>
    prev.entry.id === next.entry.id &&
    prev.entry.updatedAt === next.entry.updatedAt &&
    prev.isEditing === next.isEditing,
);

export { NiotepadEntry };
