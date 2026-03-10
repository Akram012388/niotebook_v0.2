"use client";

import { useCallback, type ReactElement } from "react";
import { useClerk } from "@clerk/nextjs";

export default function ClerkSignOutButton(): ReactElement {
  const { signOut } = useClerk();

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2"
    >
      Sign out
    </button>
  );
}
