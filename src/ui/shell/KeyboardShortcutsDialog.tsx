"use client";

import { useCallback, useEffect, type ReactElement } from "react";
import { Keyboard, X } from "@phosphor-icons/react";

type ShortcutEntry = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  shortcuts: ShortcutEntry[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Layout",
    shortcuts: [
      { keys: ["1"], description: "Single pane" },
      { keys: ["2"], description: "Split view (two panes)" },
      { keys: ["3"], description: "Triple view (all panes)" },
    ],
  },
  {
    title: "Panes",
    shortcuts: [
      { keys: ["V"], description: "Show video" },
      { keys: ["C"], description: "Show code editor" },
      { keys: ["A"], description: "Show AI assistant (split view)" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["?"], description: "Toggle this dialog" },
    ],
  },
];

type KeyboardShortcutsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const KeyBadge = ({ label }: { label: string }): ReactElement => (
  <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground shadow-sm">
    {label}
  </kbd>
);

const KeyboardShortcutsDialog = ({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps): ReactElement | null => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-black/30"
        aria-label="Close shortcuts dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="relative z-10 w-full max-w-[380px] rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Keyboard size={16} weight="regular" />
            Keyboard shortcuts
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-surface-muted p-1.5 text-text-muted transition hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <X size={14} weight="regular" />
          </button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {group.title}
              </div>
              <div className="flex flex-col gap-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span className="text-xs text-text-muted">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <KeyBadge key={key} label={key} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { KeyboardShortcutsDialog };
