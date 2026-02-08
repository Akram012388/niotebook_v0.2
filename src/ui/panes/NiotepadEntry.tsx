"use client";

import {
  memo,
  useCallback,
  useMemo,
  useState,
  useRef,
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
  onSendToChat?: (content: string) => void;
  onInsertToEditor?: (content: string) => void;
}

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight];

const SOURCE_ICONS: Record<NiotepadEntryType["source"], string> = {
  chat: "\u{1F4AC}",
  code: "\u27E8\u27E9",
  video: "\u25B6",
  manual: "\u270E",
};

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatVideoTime(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const NiotepadEntryComponent = memo(function NiotepadEntryComponent({
  entry,
  onSeek,
  onSendToChat,
  onInsertToEditor,
}: NiotepadEntryProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateEntry = useNiotepadStore((s) => s.updateEntry);
  const deleteEntry = useNiotepadStore((s) => s.deleteEntry);

  const formattedTime = useMemo(
    () => timestampFormatter.format(entry.createdAt),
    [entry.createdAt],
  );

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

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

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(entry.content);
  }, [entry.content]);

  const handleDelete = useCallback(() => {
    deleteEntry(entry.id);
  }, [deleteEntry, entry.id]);

  const handleSendToChat = useCallback(() => {
    onSendToChat?.(entry.content);
  }, [onSendToChat, entry.content]);

  const handleInsertToEditor = useCallback(() => {
    onInsertToEditor?.(entry.content);
  }, [onInsertToEditor, entry.content]);

  const handleSeek = useCallback(() => {
    if (entry.videoTimeSec !== null) {
      onSeek?.(entry.videoTimeSec);
    }
  }, [onSeek, entry.videoTimeSec]);

  return (
    <div className="group relative border-b border-border/50 px-4 py-3">
      {/* Header line */}
      <div className="mb-1.5 flex items-center gap-2 text-xs text-text-muted">
        <span aria-label={entry.source} title={entry.source}>
          {SOURCE_ICONS[entry.source]}
        </span>
        <span>{formattedTime}</span>
        {entry.source === "video" && entry.videoTimeSec !== null && onSeek ? (
          <button
            type="button"
            onClick={handleSeek}
            className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-accent transition-colors hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label={`Seek to ${formatVideoTime(entry.videoTimeSec)}`}
          >
            {formatVideoTime(entry.videoTimeSec)}
          </button>
        ) : null}
      </div>

      {/* Content body */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleEditKeyDown}
          className="w-full resize-none rounded-lg border border-accent/30 bg-surface-muted px-3 py-2 text-sm leading-6 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
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

      {/* Hover action buttons */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-border bg-surface px-1 py-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          aria-label="Copy entry"
          title="Copy"
        >
          Copy
        </button>
        {onSendToChat ? (
          <button
            type="button"
            onClick={handleSendToChat}
            className="rounded px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
            aria-label="Send to chat"
            title="Send to chat"
          >
            Chat
          </button>
        ) : null}
        {onInsertToEditor ? (
          <button
            type="button"
            onClick={handleInsertToEditor}
            className="rounded px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
            aria-label="Insert to editor"
            title="Insert to editor"
          >
            Insert
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleDelete}
          className="rounded px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:text-status-error focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          aria-label="Delete entry"
          title="Delete"
        >
          Del
        </button>
      </div>
    </div>
  );
});

export { NiotepadEntryComponent as NiotepadEntry };
