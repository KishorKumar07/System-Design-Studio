import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Surfaces errors thrown during rendering/data-fetching that Next.js
// catches internally — without this, those never reach Sentry at all.
export const onRequestError = Sentry.captureRequestError;
