"use client";

import { type ReactElement, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { meRef } from "@/ui/auth/convexAuth";

type AdminGuardProps = {
  children: ReactNode;
};

const AdminGuard = ({ children }: AdminGuardProps): ReactElement => {
  const isE2ePreview = process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true";
  const me = useQuery(meRef);
  const router = useRouter();

  if (isE2ePreview) {
    return <>{children}</>;
  }

  if (me === undefined) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        {/* Spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  if (me === null || me.role !== "admin") {
    router.replace("/");
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Access denied</p>
          <p className="mt-1 text-xs text-text-muted">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export { AdminGuard };
