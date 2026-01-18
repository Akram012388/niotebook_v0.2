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
};

const MAX_HEIGHT_PX = 140;

const ChatComposer = ({ onSend }: ChatComposerProps): ReactElement => {
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

    onSend?.(trimmed);
    setValue("");
  }, [onSend, value]);

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
    <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about the lesson..."
        className="min-h-[44px] max-h-[140px] flex-1 resize-none overflow-y-auto bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={handleSend}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
        aria-label="Send message"
      >
        ➜
      </button>
    </div>
  );
};

export { ChatComposer };
