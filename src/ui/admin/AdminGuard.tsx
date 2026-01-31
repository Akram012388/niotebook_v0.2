"use client";

import { type ReactElement, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { meRef } from "@/ui/auth/convexAuth";

type AdminGuardProps = {
  children: ReactNode;
};

const AdminGuard = ({ children }: AdminGuardProps): ReactElement => {
  const me = useQuery(meRef);
  const router = useRouter();

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
