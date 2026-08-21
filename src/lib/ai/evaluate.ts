import type { Problem } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { callModel, PRICING_USD_PER_1M, type AiCallResult } from "@/lib/ai/client";
import { buildEvaluationPrompt } from "@/lib/ai/prompt";
import { safeParseJson } from "@/lib/ai/parseJson";
import { evaluationSchema, type Evaluation } from "@/lib/ai/schema";
import { buildFallbackEvaluation } from "@/lib/ai/fallback";
import type { CapacityInputs, DiagramEdge, DiagramNode } from "@/lib/validation/design.schema";

// A "successful" API call (good HTTP status) can still come back with
// malformed or off-schema JSON — LLM output isn't deterministic, and this
// happens in practice, not just in theory. Retrying the whole generation
// once is worth it: it's a fresh sample from the model, not a repeat of the
// same broken output. Only fall back to the deterministic scorer if two
// full generations in a row fail to produce valid output.
const MAX_GENERATION_ATTEMPTS = 2;

function estimateCostUsd(provider: "gemini" | "groq", inputTokens: number, outputTokens: number): number {
  const rate = PRICING_USD_PER_1M[provider];
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

async function attemptEvaluation(prompt: string): Promise<{ evaluation: Evaluation; call: AiCallResult }> {
  const call = await callModel(prompt);

  const parsed = safeParseJson(call.text);
  if (parsed === null) {
    console.error(`[ai] (${call.provider}) response was not parseable JSON. Raw text:`, call.text);
    throw new Error("Model response was not valid JSON");
  }

  const validated = evaluationSchema.safeParse(parsed);
  if (!validated.success) {
    console.error(`[ai] (${call.provider}) response failed schema validation:`, validated.error.issues);
    console.error("[ai] parsed object was:", JSON.stringify(parsed, null, 2));
    throw new Error("Model response failed schema validation");
  }

  return { evaluation: validated.data, call };
}

/**
 * Runs the graded evaluation for a diagram. Never throws for a "the AI
 * failed" reason — falls back to the deterministic scorer instead, so a
 * provider outage degrades quality rather than availability. Every attempt
 * (success or fallback) is logged to EvaluationLog, which is what
 * `assertEvaluationAllowed` counts against for rate limiting and what backs
 * the per-user cost/usage governance view.
 */
export async function evaluateDesign(
  userId: string,
  designId: string | null,
  problem: Problem,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  capacity: CapacityInputs | undefined,
): Promise<Evaluation> {
  const prompt = buildEvaluationPrompt(problem, nodes, edges, capacity);

  let evaluation: Evaluation | null = null;
  let promptTokens = 0;
  let completionTokens = 0;
  let provider: "gemini" | "groq" = "gemini";
  let succeeded = false;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const result = await attemptEvaluation(prompt);
      evaluation = result.evaluation;
      promptTokens = result.call.inputTokens;
      completionTokens = result.call.outputTokens;
      provider = result.call.provider;
      succeeded = true;
      break;
    } catch (err) {
      console.error(`[ai] generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} failed:`, err);
    }
  }

  const fallbackUsed = evaluation === null;
  if (evaluation === null) {
    evaluation = buildFallbackEvaluation(problem, nodes, edges, capacity);
  }

  await prisma.evaluationLog.create({
    data: {
      userId,
      designId: designId ?? undefined,
      provider,
      promptTokens,
      completionTokens,
      costUsd: estimateCostUsd(provider, promptTokens, completionTokens),
      succeeded,
      fallbackUsed,
    },
  });

  return evaluation;
}
