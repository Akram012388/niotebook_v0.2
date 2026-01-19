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

const enableDevAuthBypass = (client: ConvexClientWithAdminAuth): void => {
  if (process.env.NODE_ENV === "production") {
    if (
      process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS === "true" &&
      process.env.NIOTEBOOK_E2E_PREVIEW !== "true"
    ) {
      throw new Error(
        "NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS is not allowed in production.",
      );
    }

    if (process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS === "true") {
      client.setAdminAuth("dev-bypass", {
        subject: "local-dev",
        issuer: "niotebook",
        email: "dev@niotebook.local",
      });
    }

    return;
  }

  if (process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS !== "true") {
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
