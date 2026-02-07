"use client";

import { PaperPlaneRight } from "@phosphor-icons/react";
import { useCallback, useRef, useState, type ReactElement } from "react";

type ChatComposerProps = {
  onSend?: (message: string) => void;
  disabled?: boolean;
};

const MAX_HEIGHT_PX = 140;

const ChatComposer = ({
  onSend,
  disabled = false,
}: ChatComposerProps): ReactElement => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT_PX);
    textarea.style.height = `${nextHeight}px`;
  };

  const handleSend = useCallback((): void => {
    if (disabled) {
      return;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    onSend?.(trimmed);
    setValue("");
  }, [disabled, onSend, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const isReady = value.trim().length > 0 && !disabled;

  return (
    <div className="flex items-end gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/40">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          resizeTextarea();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ask about the lesson..."
        className="chat-input min-h-[44px] max-h-[140px] flex-1 resize-none overflow-y-auto border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-text-subtle focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!isReady}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
          isReady
            ? "border-accent bg-accent text-white hover:opacity-90"
            : "border-border bg-surface-muted text-text-subtle"
        }`}
        aria-label="Send message"
      >
        <PaperPlaneRight size={14} weight="fill" />
      </button>
    </div>
  );
};

export { ChatComposer };
