"use client";

import dynamic from "next/dynamic";
import type { ReactElement, ReactNode } from "react";
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
import { AuthShell } from "./AuthShell";

type AuthGateProps = {
  children: ReactNode;
};

// Lazy-loaded: avoids pulling @clerk/nextjs into the server bundle when
// Clerk isn't used (e.g. dev auth bypass, E2E, or missing publishable key).
const AuthGateWithClerk = dynamic(() => import("./AuthGateWithClerk"));

const AuthGate = ({ children }: AuthGateProps): ReactElement => {
  const isDevBypass = useDevAuthBypass();
  const isClerkEnabled =
    !isDevBypass && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const isProd = process.env.NODE_ENV === "production";

  if (!isClerkEnabled) {
    if (isProd && !isDevBypass) {
      return (
        <AuthShell
          title="Auth is not configured"
          subtitle="Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign-in."
        >
          <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-text-muted">
            Clerk keys are required before the workspace can load.
          </div>
        </AuthShell>
      );
    }
    return <>{children}</>;
  }

  return <AuthGateWithClerk>{children}</AuthGateWithClerk>;
};

export { AuthGate };
