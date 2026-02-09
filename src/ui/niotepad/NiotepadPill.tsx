"use client";

import type { ReactElement } from "react";
import { useNiotepadStore } from "@/infra/niotepad/useNiotepadStore";

const NiotepadPill = (): ReactElement => {
  const isOpen = useNiotepadStore((s) => s.isOpen);
  const hasUnread = useNiotepadStore((s) => s.hasUnread);
  const togglePanel = useNiotepadStore((s) => s.togglePanel);

  return (
    <button
      type="button"
      onClick={togglePanel}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
        isOpen
          ? "border-accent bg-accent text-white shadow-sm"
          : "border-border bg-surface-muted text-text-muted hover:bg-surface hover:text-foreground"
      }`}
      aria-label={isOpen ? "Close niotepad" : "Open niotepad"}
      aria-pressed={isOpen}
      title="Niotepad (Cmd+J)"
    >
      N
      {hasUnread && !isOpen && (
        <span
          className="absolute -right-0.5 -top-0.5 h-[5px] w-[5px] rounded-full bg-accent"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export { NiotepadPill };
