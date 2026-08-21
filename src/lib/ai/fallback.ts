import type { Problem } from "@prisma/client";
import type { CapacityInputs, DiagramEdge, DiagramNode } from "@/lib/validation/design.schema";
import type { Evaluation } from "@/lib/ai/schema";

const CATEGORY_LABELS: Record<string, string> = {
  "client-edge": "Client/Edge (client app, CDN, DNS)",
  networking: "Networking (load balancer, API gateway)",
  compute: "Compute (app/web server, microservice)",
  data: "Data store (SQL/NoSQL DB, search index)",
  messaging: "Messaging (queue, pub/sub, event bus)",
  storage: "Object/blob storage",
  ops: "Ops (auth, monitoring, rate limiter)",
};

/** Deterministic, no-LLM scorer — used when the AI call fails or its output
 * doesn't validate. Coarse on purpose: it exists so a provider outage or a
 * malformed response never blocks a user from getting *some* feedback. */
export function buildFallbackEvaluation(
  problem: Problem,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  capacity: CapacityInputs | undefined,
): Evaluation {
  const categoriesPresent = new Set<string>(nodes.map((n) => n.category));
  const missing = Object.entries(CATEGORY_LABELS)
    .filter(([key]) => !categoriesPresent.has(key))
    .map(([, label]) => label)
    .slice(0, 5);

  const base = nodes.length === 0 ? 0 : Math.min(70, 20 + nodes.length * 5 + edges.length * 3);

  return {
    overallScore: base,
    verdict: nodes.length === 0
      ? "Empty diagram — nothing to evaluate yet."
      : "Automated scorer used (AI evaluation unavailable) — coarse estimate only.",
    criteria: {
      completeness: { score: base, feedback: `${nodes.length} component(s) covering ${categoriesPresent.size} of ${Object.keys(CATEGORY_LABELS).length} layers.` },
      scalability: { score: Math.max(0, base - 10), feedback: "Automated scorer cannot assess bottlenecks — AI review unavailable." },
      reliability: { score: Math.max(0, base - 10), feedback: "Automated scorer cannot assess redundancy — AI review unavailable." },
      security: { score: Math.max(0, base - 15), feedback: "Automated scorer cannot assess auth/exposure — AI review unavailable." },
      costEfficiency: { score: base, feedback: "Automated scorer cannot assess over/under-engineering — AI review unavailable." },
    },
    strengths: nodes.length > 0 ? [`Diagram includes ${nodes.length} component(s).`] : [],
    weaknesses: ["AI evaluation was unavailable — this is a coarse fallback score, not a full review."],
    missingComponents: missing,
    suggestions: ["Retry evaluation once the AI service is available for a full architectural review."],
    connectionFeedback: [],
    capacityCheck: {
      consistent: false,
      note: capacity
        ? "Capacity numbers were provided but could not be cross-checked without AI evaluation."
        : "No capacity numbers provided.",
    },
  };
}
