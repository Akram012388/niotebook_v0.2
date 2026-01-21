"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

type ChatComposerProps = {
  onSend?: (message: string) => void;
  transcriptContext?: string[];
};

const MAX_HEIGHT_PX = 140;

const ChatComposer = ({
  onSend,
  transcriptContext,
}: ChatComposerProps): ReactElement => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect((): void => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT_PX);
    textarea.style.height = `${nextHeight}px`;
  }, [value]);

  const handleSend = useCallback((): void => {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    const transcriptPayload = transcriptContext?.slice(0, 6).join(" ");
    const message = transcriptPayload
      ? `${trimmed}\n\n[Transcript]\n${transcriptPayload}`
      : trimmed;

    onSend?.(message);
    setValue("");
  }, [onSend, transcriptContext, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex items-end gap-3 rounded-2xl border border-border bg-transparent px-4 py-3 shadow-sm">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about the lesson..."
        className="min-h-[44px] max-h-[140px] flex-1 resize-none overflow-y-auto rounded-xl bg-surface-muted p-3 text-sm text-foreground outline-none placeholder:text-text-subtle"
      />
      <button
        type="button"
        onClick={handleSend}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
        aria-label="Send message"
      >
        ➜
      </button>
    </div>
  );
};

export { ChatComposer };
