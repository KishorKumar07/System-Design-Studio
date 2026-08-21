import { prisma } from "@/lib/db/prisma";

const LIMIT_PER_HOUR = Number(process.env.EVAL_RATE_LIMIT_PER_HOUR ?? 10);
const WINDOW_MS = 60 * 60 * 1000;

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Evaluation rate limit exceeded");
    this.name = "RateLimitError";
  }
}

/**
 * DB-backed sliding-window limiter on EvaluationLog — deliberately not Redis.
 * Each graded submission costs real LLM money; this is the guardrail that
 * stops a scripted loop (or a single impatient user mashing "evaluate") from
 * turning into an open-ended bill. One extra indexed query per evaluation
 * request is a fine trade for not standing up a Redis instance for a v1.
 */
export async function assertEvaluationAllowed(userId: string): Promise<void> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const recent = await prisma.evaluationLog.findMany({
    where: { userId, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (recent.length >= LIMIT_PER_HOUR) {
    const oldest = recent[0].createdAt.getTime();
    const retryAfterMs = oldest + WINDOW_MS - Date.now();
    throw new RateLimitError(Math.max(1, Math.ceil(retryAfterMs / 1000)));
  }
}
