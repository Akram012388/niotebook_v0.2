"use client";

import { type ReactElement, type ReactNode } from "react";
import { Wordmark } from "@/ui/brand/Wordmark";

interface SiteNavProps {
  /** Right-side content (theme toggle, auth links, etc.) */
  children: ReactNode;
  /** Where the wordmark links to — defaults to "/" */
  wordmarkHref?: string;
  /** Accessible label for the nav landmark */
  ariaLabel?: string;
}

export function SiteNav({
  children,
  wordmarkHref = "/",
  ariaLabel = "Site navigation",
}: SiteNavProps): ReactElement {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed top-0 left-0 right-0 z-50 flex h-[72px] items-center justify-between px-4 sm:px-6 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--background) 80%, transparent)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Wordmark height={40} href={wordmarkHref} />
      <div className="flex items-center gap-2 sm:gap-3">{children}</div>
    </nav>
  );
}
