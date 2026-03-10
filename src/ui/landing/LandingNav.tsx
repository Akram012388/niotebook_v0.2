"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { type ReactElement } from "react";
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
import { SiteNav } from "@/ui/shared/SiteNav";
import { ThemeToggle } from "@/ui/shared/ThemeToggle";

// Lazy-load the auth-aware link to avoid pulling @clerk/nextjs when bypass is active.
const ClerkAuthLink = dynamic(() => import("./ClerkAuthLink"));

export function LandingNav(): ReactElement {
  const isDevBypass = useDevAuthBypass();

  return (
    <SiteNav ariaLabel="Main">
      <ThemeToggle />
      {isDevBypass ? (
        <Link
          href="/courses"
          className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2"
        >
          Courses
        </Link>
      ) : (
        <ClerkAuthLink />
      )}
    </SiteNav>
  );
}
