"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactElement, ReactNode } from "react";
import { convexClient } from "../infra/convexClient";

type ProvidersProps = {
  children: ReactNode;
};

const Providers = ({ children }: ProvidersProps): ReactElement => {
  if (!convexClient) {
    return <>{children}</>;
  }

  const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!isClerkEnabled) {
    return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
  }

  return (
    <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
};

export { Providers };
