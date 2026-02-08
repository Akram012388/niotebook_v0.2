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

const NiotepadEntryComponent = memo(function NiotepadEntryComponent({
  entry,
  onSeek,
}: NiotepadEntryProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateEntry = useNiotepadStore((s) => s.updateEntry);
  const deleteEntry = useNiotepadStore((s) => s.deleteEntry);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  // --- Edit handlers ---
  const handleStartEdit = useCallback(() => {
    setEditContent(entry.content);
    setIsEditing(true);
  }, [entry.content]);

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

  // --- Video entry header ---
  const isVideoEntry =
    entry.source === "video" && entry.videoTimeSec !== null;
  const lectureTitle = entry.metadata.lectureTitle;

  return (
    <div className="group relative border-t border-border-muted pt-2 pb-3" data-niotepad-entry>
      {/* Delete button -- top-right, visible on hover */}
      {!isEditing && (
        <button
          type="button"
          onClick={() => deleteEntry(entry.id)}
          className="absolute right-1 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded text-text-subtle opacity-0 transition-opacity hover:bg-surface-muted hover:text-foreground group-hover:opacity-100"
          aria-label="Delete entry"
        >
          <span className="text-xs leading-none">&times;</span>
        </button>
      )}

      {/* Entry content */}
      <div className="pr-4">
        {/* Video entry: clickable header + summary */}
        {isVideoEntry && !isEditing && (
          <button
            type="button"
            onClick={handleSeek}
            className="cursor-pointer text-left text-sm leading-6 text-accent decoration-accent/40 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1"
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
            className="w-full appearance-none resize-none bg-transparent px-0 text-sm leading-6 text-foreground"
            style={{ border: "none", outline: "none", boxShadow: "none" }}
            rows={Math.max(2, editContent.split("\n").length)}
          />
        ) : (
          <div
            className="nio-markdown cursor-text text-sm leading-6 text-foreground"
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
