"use client";

import {
  forwardRef,
  useCallback,
  useState,
  type ReactElement,
} from "react";

// Same content padding as NiotepadEntry
const CONTENT_PL = 56;
const CONTENT_PR = 16;

interface NiotepadComposerProps {
  onSubmit: (content: string) => void;
  entryCount: number;
}

const NiotepadComposer = forwardRef<HTMLTextAreaElement, NiotepadComposerProps>(
  function NiotepadComposer(
    { onSubmit, entryCount },
    ref,
  ): ReactElement {
    const [value, setValue] = useState("");

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const trimmed = value.trim();
          if (trimmed) {
            onSubmit(trimmed);
            setValue("");
            // Reset textarea height
            const ta = e.currentTarget;
            ta.style.height = "auto";
          }
        }
      },
      [value, onSubmit],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        // Auto-resize
        const ta = e.target;
        ta.style.height = "auto";
        ta.style.height = `${ta.scrollHeight}px`;
      },
      [],
    );

    return (
      <div
        style={{
          paddingLeft: CONTENT_PL,
          paddingRight: CONTENT_PR,
          minHeight: 240,
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={entryCount === 0 ? "Write a note..." : "Add a note..."}
          className="w-full resize-none border-none bg-transparent p-0 text-sm text-foreground placeholder:text-text-subtle outline-none"
          style={{
            fontFamily: "var(--font-body)",
            lineHeight: "24px",
          }}
          aria-label="Write a new note"
          aria-describedby="composer-instructions"
          rows={1}
        />
        <p id="composer-instructions" className="sr-only">
          Press Enter to save your note. Press Shift+Enter for a new line.
        </p>
      </div>
    );
  },
);

export { NiotepadComposer };
