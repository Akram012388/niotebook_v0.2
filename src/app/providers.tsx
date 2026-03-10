"use client";

import { ConvexProvider } from "convex/react";
import dynamic from "next/dynamic";
import type { ReactElement, ReactNode } from "react";
import { useDevAuthBypass } from "@/infra/dev/devAuthBypassContext";
import { convexClient } from "../infra/convexClient";

type ProvidersProps = {
  children: ReactNode;
};

// Lazy-loaded: avoids pulling @clerk/nextjs into the server bundle when
// Clerk isn't used (e.g. dev auth bypass, E2E, or missing publishable key).
const ConvexWithClerk = dynamic(() => import("./ConvexWithClerk"));

const Providers = ({ children }: ProvidersProps): ReactElement => {
  // Read bypass flag from context (set by DevAuthBypassProvider in layout.tsx)
  // instead of NEXT_PUBLIC_ env var, which may not reach the client bundle.
  const isDevBypass = useDevAuthBypass();

  if (!convexClient) {
    return <>{children}</>;
  }

  // When dev auth bypass is active, use plain ConvexProvider so that
  // setAdminAuth from the bypass flow is not overridden by Clerk's
  // token management inside ConvexProviderWithClerk.
  const isClerkEnabled =
    !isDevBypass && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!isClerkEnabled) {
    return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
  }

  return <ConvexWithClerk>{children}</ConvexWithClerk>;
};

export { Providers };
