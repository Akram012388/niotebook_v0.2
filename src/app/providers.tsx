"use client";

import { ConvexProvider } from "convex/react";
import type { ReactElement, ReactNode } from "react";
import { convexClient } from "../infra/convexClient";

type ProvidersProps = {
  children: ReactNode;
};

const Providers = ({ children }: ProvidersProps): ReactElement => {
  if (!convexClient) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
};

export { Providers };
