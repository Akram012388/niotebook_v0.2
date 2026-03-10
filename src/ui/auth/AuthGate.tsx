"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";
import { ClerkLoaded, SignedIn, SignedOut } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { AuthShell } from "./AuthShell";
import { useBootstrapUser } from "@/infra/useBootstrapUser";

type AuthGateProps = {
  children: ReactNode;
};

/**
 * Redirects unauthenticated users to /sign-in instead of rendering
 * an inline SignIn form. This prevents a redirect loop where the
 * embedded SignIn component's fallbackRedirectUrl points back to
 * the same page that contains the AuthGate.
 */
const RedirectToSignIn = (): ReactElement => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return (
    <AuthShell title="Redirecting" subtitle="Taking you to sign in...">
      <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-sm text-text-muted">
        Redirecting to sign in...
      </div>
    </AuthShell>
  );
};

const AuthGateWithClerk = ({ children }: AuthGateProps): ReactElement => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const bootstrap = useBootstrapUser(isAuthenticated);

  return (
    <ClerkLoaded>
      <SignedOut>
        <RedirectToSignIn />
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
