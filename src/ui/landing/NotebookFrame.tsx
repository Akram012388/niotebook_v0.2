"use client";

import { type ReactElement, type ReactNode } from "react";

interface NotebookFrameProps {
  children: ReactNode;
  /** Additional CSS classes for the outer container */
  className?: string;
}

/**
 * A subtle notebook-page wrapper for landing page sections.
 * Rounded container on `bg-surface` with a gentle shadow and a thin left
 * "margin line" positioned 28px from the left edge — a quiet nod to the brand
 * name without going full skeuomorphic.
 */
export function NotebookFrame({
  children,
  className = "",
}: NotebookFrameProps): ReactElement {
  return (
    <div
      className={`relative rounded-2xl bg-surface shadow-sm overflow-hidden ${className}`}
    >
      {/* Notebook margin line — the brand "wink" */}
      <div
        className="absolute top-0 bottom-0 left-7 w-[2px] bg-border-muted pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative px-8 sm:px-12 md:px-16 py-10 sm:py-14">
        {children}
      </div>
    </div>
  );
}
