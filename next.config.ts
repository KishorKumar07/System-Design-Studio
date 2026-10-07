import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Standalone output: the Docker runtime image only needs .next/standalone +
  // .next/static, not the full node_modules tree. Cuts the image from
  // ~700MB to ~200MB — matters on a 2GB EC2 instance.
  output: "standalone",

  // Pin the workspace root to this project — the parent Dragon Suite folder
  // has its own package-lock.json, which otherwise confuses Turbopack's
  // auto-detected root.
  turbopack: {
    root: path.join(__dirname),
  },
};

// Inert without SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN — the plugin
// just skips source map upload rather than failing the build, so this is
// safe to leave wired in for local dev and CI where those aren't set.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
