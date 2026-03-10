"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactElement, ReactNode } from "react";
import { convexClient } from "../infra/convexClient";
import { AuthTokenContext } from "../infra/auth/authTokenContext";

type ConvexWithClerkProps = {
  children: ReactNode;
};

function AuthTokenProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  return <AuthTokenContext value={getToken}>{children}</AuthTokenContext>;
}

export default function ConvexWithClerk({
  children,
}: ConvexWithClerkProps): ReactElement {
  return (
    <ConvexProviderWithClerk client={convexClient!} useAuth={useAuth}>
      <AuthTokenProvider>{children}</AuthTokenProvider>
    </ConvexProviderWithClerk>
  );
}
