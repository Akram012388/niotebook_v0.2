import { storageAdapter } from "./storageAdapter";

type ConvexClientWithAdminAuth = {
  setAdminAuth: (
    token: string,
    identity: {
      subject: string;
      issuer: string;
      email?: string;
    },
  ) => void;
};

const DEV_BYPASS_KEY = "niotebook.devAuthBypass";

const enableDevAuthBypass = (
  client: ConvexClientWithAdminAuth,
  bypassEnabled: boolean,
): void => {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  const isPreviewHost =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".vercel.app");
  if (process.env.NODE_ENV === "production") {
    if (
      bypassEnabled &&
      process.env.NEXT_PUBLIC_NIOTEBOOK_E2E_PREVIEW !== "true" &&
      process.env.NIOTEBOOK_E2E_PREVIEW !== "true" &&
      !isVercelPreview &&
      !isPreviewHost
    ) {
      throw new Error(
        "NIOTEBOOK_DEV_AUTH_BYPASS is not allowed in production.",
      );
    }

    if (bypassEnabled) {
      client.setAdminAuth("dev-bypass", {
        subject: "local-dev",
        issuer: "niotebook",
        email: "dev@niotebook.local",
      });
    }

    return;
  }

  if (!bypassEnabled) {
    return;
  }

  const token = storageAdapter.getItem(DEV_BYPASS_KEY);

  if (!token) {
    return;
  }

  client.setAdminAuth(token, {
    subject: "local-dev",
    issuer: "niotebook",
    email: "dev@niotebook.local",
  });
};

export { enableDevAuthBypass };
