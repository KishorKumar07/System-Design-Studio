import * as Sentry from "@sentry/nextjs";

// Client-side DSN must be NEXT_PUBLIC_-prefixed to be exposed to the
// browser bundle. dsn: undefined is a safe no-op without a Sentry account.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});

// Required for the SDK to instrument client-side route transitions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
