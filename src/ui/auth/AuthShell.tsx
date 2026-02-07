"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { NotebookFrame } from "@/ui/shared/NotebookFrame";
import { SiteNav } from "@/ui/shared/SiteNav";
import { ThemeToggle } from "@/ui/shared/ThemeToggle";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Optional side panel content (e.g. BootSequence), shown on md+ alongside children */
  sideContent?: ReactNode;
}

const AuthShell = ({
  title,
  subtitle,
  children,
  sideContent,
}: AuthShellProps): ReactElement => {
  const isDesktop = useIsDesktop();

  const innerContent = sideContent ? (
    <div className="flex items-stretch gap-8">
      <div className="w-full max-w-md">{children}</div>
      {isDesktop && (
        <div className="hidden w-full max-w-sm md:flex">{sideContent}</div>
      )}
    </div>
  ) : (
    <div className="w-full max-w-md">{children}</div>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Top bar — shared SiteNav component */}
      <SiteNav ariaLabel="Auth navigation">
        <ThemeToggle />
        <Link
          href="/"
          className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2"
        >
          &larr; Home
        </Link>
      </SiteNav>

      {/* Main content — z-[2] to sit above the nio-pattern grid (z-1) */}
      <div className="relative z-[2] mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
          ) : null}
        </div>

        {isDesktop ? (
          <NotebookFrame>{innerContent}</NotebookFrame>
        ) : (
          innerContent
        )}
      </div>
    </div>
  );
};

const MQ = "(min-width: 640px)";

function subscribeDesktop(callback: () => void): () => void {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getDesktopSnapshot(): boolean {
  return window.matchMedia(MQ).matches;
}

function getDesktopServerSnapshot(): boolean {
  return false;
}

/** SSR-safe media query hook using useSyncExternalStore. */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot,
  );
}

export { AuthShell };
