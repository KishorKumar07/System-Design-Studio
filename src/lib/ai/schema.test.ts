import { describe, it, expect } from "vitest";
import { evaluationSchema } from "./schema";

function criterion(score: number) {
  return { score, feedback: "ok" };
}

const validPayload = {
  overallScore: 74,
  verdict: "Solid baseline.",
  criteria: {
    completeness: criterion(70),
    scalability: criterion(75),
    reliability: criterion(68),
    security: criterion(80),
    costEfficiency: criterion(85),
  },
  strengths: ["Good caching"],
  weaknesses: ["No read replicas"],
  missingComponents: ["Key generation service"],
  suggestions: ["Add replicas"],
  connectionFeedback: [{ connection: "A -> B", status: "sound", note: "fine" }],
  capacityCheck: { consistent: false, note: "QPS undercalculated" },
};

describe("evaluationSchema", () => {
  it("accepts a well-formed evaluation matching the exact prompt contract", () => {
    expect(evaluationSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects an overallScore outside 0-100 — this is what forces a fallback on a hallucinated score", () => {
    const result = evaluationSchema.safeParse({ ...validPayload, overallScore: 140 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid connectionFeedback status enum value", () => {
    const result = evaluationSchema.safeParse({
      ...validPayload,
      connectionFeedback: [{ connection: "A -> B", status: "excellent", note: "fine" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing the capacityCheck field entirely", () => {
    const withoutCapacityCheck: Record<string, unknown> = { ...validPayload };
    delete withoutCapacityCheck.capacityCheck;
    expect(evaluationSchema.safeParse(withoutCapacityCheck).success).toBe(false);
  });
});
