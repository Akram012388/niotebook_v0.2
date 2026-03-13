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

// NIOTEBOOK_E2E_PREVIEW enables stub AI responses and relaxed auth for E2E
// test environments. It must never reach a real production deployment.
if (
  process.env.NIOTEBOOK_E2E_PREVIEW === "true" &&
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL_ENV !== "preview"
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
      {
        // CSP: unsafe-inline required by Next.js for inline <script> hydration
        // markers; unsafe-eval required by Pyodide WASM and by the JS sandbox
        // iframe that executes user code on the same origin. Both are scoped to
        // script-src only. youtube.com and s.ytimg.com are required by the
        // YouTube IFrame API: the bootstrapper (/iframe_api) loads from
        // youtube.com and dynamically injects player scripts from s.ytimg.com
        // into the parent page context.
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.clerk.accounts.dev https://www.youtube.com https://s.ytimg.com https://sql.js.org https://webr.r-wasm.org",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://*.ytimg.com",
          "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.clerk.accounts.dev https://generativelanguage.googleapis.com https://api.groq.com https://api.openai.com https://api.anthropic.com https://*.public.blob.vercel-storage.com https://cdn.jsdelivr.net",
          "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com",
          "worker-src 'self' blob:",
          "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
        ].join("; "),
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
