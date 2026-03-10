import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

if (process.env.NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS === "true") {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[build] NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS must not be set in production builds. " +
        "This variable is deprecated — use NIOTEBOOK_DEV_AUTH_BYPASS (server-only) instead.",
    );
  }
  console.warn(
    "[build] NEXT_PUBLIC_NIOTEBOOK_DEV_AUTH_BYPASS is deprecated. " +
      "Rename it to NIOTEBOOK_DEV_AUTH_BYPASS in your .env.local. " +
      "The server-only variable will not be exposed to the client bundle.",
  );
}

if (
  process.env.NIOTEBOOK_DEV_AUTH_BYPASS === "true" &&
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "[build] NIOTEBOOK_DEV_AUTH_BYPASS must not be set in production builds. " +
      "Remove it from your environment before building.",
  );
}

if (
  process.env.NIOTEBOOK_E2E_PREVIEW === "true" &&
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "[build] NIOTEBOOK_E2E_PREVIEW must not be true in production builds.",
  );
}

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  async headers() {
    const globalHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains",
            },
          ]
        : []),
    ];

    return [
      {
        source: "/(.*)",
        headers: globalHeaders,
      },
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
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "framer-motion",
      "recharts",
    ],
  },
};

const sentryBuildOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourceMapsUploadOptions: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
};

export default bundleAnalyzer(withSentryConfig(nextConfig, sentryBuildOptions));
