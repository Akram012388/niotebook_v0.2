"use client";

import { type ReactElement, type ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";

import { Wordmark } from "@/ui/brand/Wordmark";

type CoursesLayoutProps = {
  children: ReactNode;
};

export default function CoursesLayout({
  children,
}: CoursesLayoutProps): ReactElement {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3">
          <Wordmark height={22} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs text-text-muted transition hover:bg-surface"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
