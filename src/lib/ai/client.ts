import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const GEMINI_MODEL = "gemini-3.6-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30_000;
// Retries here compound with evaluate.ts's own outer retry-on-bad-JSON loop
// (2 full generations). Kept to 1 retry so the worst case stays bounded
// (~180s: 2 outer attempts x (2 Gemini tries + 1 Groq try) x 30s) instead of
// spending the whole budget hammering the same provider — a second,
// independent provider (Groq) is worth reaching faster than a 3rd same-
// provider retry.
const MAX_RETRIES = 1;

// Approximate list pricing, per 1M tokens — for the cost/usage governance
// ledger only, not billing-critical. Verify against each provider's current
// pricing page before treating these as authoritative.
export const PRICING_USD_PER_1M = {
  gemini: { input: 0.3, output: 2.5 },
  groq: { input: 0.59, output: 0.79 },
} as const;

export type AiProvider = "gemini" | "groq";

export class AiCallError extends Error {}

export interface AiCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  provider: AiProvider;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new AiCallError("AI call timed out")), ms)),
  ]);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _gemini: GoogleGenerativeAI | null = null;
function getGemini(): GoogleGenerativeAI {
  if (!_gemini) _gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  return _gemini;
}

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

async function callGemini(prompt: string): Promise<AiCallResult> {
  const model = getGemini().getGenerativeModel({ model: GEMINI_MODEL });
  const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
  const text = result.response.text().trim();
  const usage = result.response.usageMetadata;
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    provider: "gemini",
  };
}

async function callGroq(prompt: string): Promise<AiCallResult> {
  const completion = await withTimeout(
    getGroq().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
    TIMEOUT_MS,
  );
  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  return {
    text,
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
    provider: "groq",
  };
}

/**
 * Gemini is primary; Groq is the API-level fallback when Gemini errors out
 * or exhausts its retries (rate limit, outage, timeout) — a second live
 * provider buys real availability, not just a retry against the same
 * failure. If both fail, the caller (`evaluate.ts`) drops to the
 * deterministic scorer rather than surfacing an error to the user.
 */
export async function callModel(prompt: string): Promise<AiCallResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) await sleep(300 * 2 ** attempt);
    }
  }
  console.warn(`[ai] Gemini failed after ${MAX_RETRIES + 1} attempts, falling back to Groq: ${String(lastError)}`);

  try {
    return await callGroq(prompt);
  } catch (err) {
    throw new AiCallError(`Both Gemini and Groq failed. Gemini: ${String(lastError)}. Groq: ${String(err)}`);
  }
}
