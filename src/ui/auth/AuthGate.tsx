"use client";

import type { ReactElement, ReactNode } from "react";
import { ClerkLoaded, SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { AuthShell } from "./AuthShell";
import { clerkAppearance } from "./clerkAppearance";
import { useBootstrapUser } from "@/infra/useBootstrapUser";

type AuthGateProps = {
  children: ReactNode;
};

const AuthGateWithClerk = ({ children }: AuthGateProps): ReactElement => {
  const bootstrap = useBootstrapUser();

  return (
    <ClerkLoaded>
      <SignedOut>
        <AuthShell
          title="Welcome back"
          subtitle="Niotebook alpha is invite-only. Use the email code from your invite to sign in."
        >
          <SignIn
            appearance={clerkAppearance}
            routing="hash"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
          />
        </AuthShell>
      </SignedOut>
      <SignedIn>
        {bootstrap.ready ? (
          <>{children}</>
        ) : (
          <AuthShell
            title="Preparing your workspace"
            subtitle={
              bootstrap.error
                ? "We hit a snag preparing your session. Refresh to try again."
                : "Syncing your account and loading the workspace."
            }
          >
            <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-text-muted">
              {bootstrap.error ? bootstrap.error : "Loading your workspace..."}
            </div>
          </AuthShell>
        )}
      </SignedIn>
    </ClerkLoaded>
  );
};

const AuthGate = ({ children }: AuthGateProps): ReactElement => {
  const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const isProd = process.env.NODE_ENV === "production";

  if (!isClerkEnabled) {
    if (isProd) {
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
