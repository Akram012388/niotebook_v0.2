"use client";

import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { SiteNav } from "@/ui/shared/SiteNav";
import { ThemeToggle } from "@/ui/shared/ThemeToggle";

interface MobileGateProps {
  children: ReactNode;
}

/**
 * CSS-only mobile gate. Below the `lg` breakpoint (1024px), renders a
 * full-screen "best experienced on desktop" message with a link home.
 * Above `lg`, renders children unchanged. Zero JS overhead — pure CSS.
 *
 * Uses the same `lg` breakpoint as WorkspaceShell for consistency.
 */
export function MobileGate({ children }: MobileGateProps): ReactElement {
  return (
    <>
      {/* Desktop: render children as-is */}
      <div className="hidden lg:contents">{children}</div>

      {/* Mobile: full-screen gate message */}
      <div className="flex min-h-screen flex-col lg:hidden">
        <SiteNav ariaLabel="Navigation">
          <ThemeToggle />
        </SiteNav>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-medium text-text-muted">
            niotebook is best experienced on desktop
          </p>
          <Link
            href="/"
            className="mt-4 text-sm text-accent hover:underline transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
