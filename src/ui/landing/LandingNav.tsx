"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { type ReactElement } from "react";
import { SiteNav } from "@/ui/shared/SiteNav";
import { ThemeToggle } from "@/ui/shared/ThemeToggle";

export function LandingNav(): ReactElement {
  const { isSignedIn } = useAuth();

  return (
    <SiteNav ariaLabel="Main">
      <ThemeToggle />
      {isSignedIn === true ? (
        <Link
          href="/courses"
          className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2"
        >
          Courses
        </Link>
      ) : (
        <Link
          href="/sign-in"
          className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2"
        >
          Sign in
        </Link>
      )}
    </SiteNav>
  );
}
