import * as Sentry from "@sentry/nextjs";

// dsn: undefined makes this a safe no-op — no account required for local
// dev or CI. Set SENTRY_DSN once you have a Sentry project to enable it.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});
