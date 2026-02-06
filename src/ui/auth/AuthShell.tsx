"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { Wordmark } from "@/ui/brand/Wordmark";
import { NotebookFrame } from "@/ui/shared/NotebookFrame";
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
    <div className="flex items-start gap-8">
      <div className="w-full max-w-md">{children}</div>
      {isDesktop && (
        <div className="hidden w-full max-w-sm md:block">{sideContent}</div>
      )}
    </div>
  ) : (
    <div className="w-full max-w-md">{children}</div>
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Top bar — matches LandingNav pattern */}
      <nav
        aria-label="Auth navigation"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--background) 80%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Wordmark height={40} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{
              background: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          >
            &larr; Home
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-md text-sm text-text-muted">{subtitle}</p>
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
