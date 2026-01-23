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
const isProd = process.env.NODE_ENV === "production";
const allowPreviewBypass =
  process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW === "true" ||
  process.env.NIOTEBOOK_E2E_PREVIEW === "true";

if (
  isProd &&
  process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS === "true" &&
  !allowPreviewBypass
) {
  throw new Error(
    "NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS is not allowed in production.",
  );
}

if (!convexUrl && process.env.NEXT_PUBLIC_DISABLE_CONVEX !== "true") {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required.");
}

const convexClient = convexUrl
  ? new ConvexReactClient(convexUrl, { expectAuth: false })
  : new ConvexReactClient("http://localhost:3210", { expectAuth: false });

if (convexClient) {
  enableDevAuthBypass(convexClient as ConvexClientWithAdminAuth);
}

export { convexClient };
