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
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (me === null || me.role !== "admin") {
    router.replace("/");
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Access denied. Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export { AdminGuard };
