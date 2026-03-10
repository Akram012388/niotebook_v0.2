"use client";

import { useCallback, type ReactElement } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { TopNav } from "./TopNav";

export default function TopNavClerkBridge(): ReactElement {
  const { user } = useUser();
  const { signOut } = useClerk();
  const handleSignOut = useCallback(() => void signOut(), [signOut]);

  return (
    <TopNav
      userEmail={user?.primaryEmailAddress?.emailAddress ?? null}
      onSignOut={handleSignOut}
    />
  );
}
