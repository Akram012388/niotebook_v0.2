import { ConvexReactClient } from "convex/react";
import { enableDevAuthBypass } from "./devAuth";

type ConvexClientWithAdminAuth = ConvexReactClient & {
  setAdminAuth: (
    token: string,
    identity: {
      subject: string;
      issuer: string;
      email?: string;
    },
  ) => void;
};

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl && process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required.");
}

const convexClient = convexUrl
  ? new ConvexReactClient(convexUrl, { expectAuth: false })
  : new ConvexReactClient("http://localhost:3210", { expectAuth: false });

/**
 * Called by DevAuthBypassProvider after the server-only NIOTEBOOK_DEV_AUTH_BYPASS
 * env var has been injected into the client via React context. This defers the
 * bypass setup until after the RSC renders and provides the flag.
 */
const applyDevAuthBypass = (bypassEnabled: boolean): void => {
  enableDevAuthBypass(convexClient as ConvexClientWithAdminAuth, bypassEnabled);
};

export { convexClient, applyDevAuthBypass };
