"use client";

import type { ReactElement, ReactNode } from "react";
import { ClerkLoaded, SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { AuthShell } from "./AuthShell";
import { clerkAppearance } from "./clerkAppearance";
import { useBootstrapUser } from "@/infra/useBootstrapUser";

type AuthGateProps = {
  children: ReactNode;
};

const AuthGateWithClerk = ({ children }: AuthGateProps): ReactElement => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const bootstrap = useBootstrapUser(isAuthenticated);

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
            fallbackRedirectUrl="/"
          />
        </AuthShell>
      </SignedOut>
      <SignedIn>
        {isLoading || !isAuthenticated ? (
          <AuthShell
            title="Preparing your workspace"
            subtitle="Verifying your session with Convex."
          >
            <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-text-muted">
              Loading your workspace...
            </div>
          </AuthShell>
        ) : bootstrap.ready ? (
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
  const isE2ePreview = process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true";
  const isPreviewHost =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".vercel.app");

  if (isE2ePreview && isPreviewHost) {
    return <>{children}</>;
  }

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
