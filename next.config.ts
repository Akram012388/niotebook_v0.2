import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

const sentryBuildOptions = {
  silent: true
};

export default withSentryConfig(nextConfig, sentryBuildOptions);
