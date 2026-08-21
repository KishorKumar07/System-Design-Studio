import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError, NotFoundError } from "@/lib/security/authz";
import { RateLimitError } from "@/lib/security/rateLimit";
import { UnauthorizedError } from "@/lib/api/session";

/**
 * Central error → HTTP mapping so every route handles auth/validation/rate
 * limit failures the same way instead of ad hoc try/catch per route.
 */
export function apiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
  }
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof RateLimitError) {
    return NextResponse.json(
      { error: "Too many evaluation requests. Try again shortly.", retryAfterSeconds: err.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } },
    );
  }

  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
