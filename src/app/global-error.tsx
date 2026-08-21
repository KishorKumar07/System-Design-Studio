"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// App Router's designated catch-all for errors thrown anywhere in the tree,
// including the root layout — Next.js only invokes this for errors that
// escape every other error.tsx boundary. It replaces the whole document,
// so it renders its own <html>/<body> rather than composing with layout.tsx.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#09090b", color: "#f5f5f7", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#a6a6b0", maxWidth: 420 }}>
            An unexpected error occurred. It has been reported — try again or head back to the dashboard.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
