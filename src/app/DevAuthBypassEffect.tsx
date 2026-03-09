"use client";

import { useEffect } from "react";
import { applyDevAuthBypass } from "@/infra/convexClient";

type DevAuthBypassEffectProps = {
  bypassEnabled: boolean;
};

/**
 * Client component that applies the dev auth bypass to the Convex client
 * once the server-injected flag is available. Runs exactly once on mount.
 */
export function DevAuthBypassEffect({
  bypassEnabled,
}: DevAuthBypassEffectProps) {
  useEffect(() => {
    applyDevAuthBypass(bypassEnabled);
  }, [bypassEnabled]);

  return null;
}
