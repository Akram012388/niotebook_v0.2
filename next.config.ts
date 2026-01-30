import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // COOP/COEP ONLY on the sandbox iframe route — NOT globally.
        // This enables SharedArrayBuffer for @wasmer/sdk without
        // breaking Clerk, Convex, YouTube, or Sentry in the main app.
        source: "/editor-sandbox",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

const sentryBuildOptions = {
  silent: true
};

export default withSentryConfig(nextConfig, sentryBuildOptions);
