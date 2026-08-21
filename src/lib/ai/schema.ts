import { z } from "zod";

const criterion = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().max(400),
});

export const connectionFeedbackSchema = z.object({
  connection: z.string().max(160),
  status: z.enum(["sound", "questionable", "incorrect"]),
  note: z.string().max(300),
});

// The model's raw JSON is parsed through this schema before it ever reaches
// the client or the DB — an LLM response that doesn't validate is treated as
// a failed call and falls back to the deterministic scorer, never surfaced
// as-is. This is the guardrail against malformed/hallucinated-shape output.
export const evaluationSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  verdict: z.string().max(240),
  criteria: z.object({
    completeness: criterion,
    scalability: criterion,
    reliability: criterion,
    security: criterion,
    costEfficiency: criterion,
  }),
  strengths: z.array(z.string().max(240)).max(5),
  weaknesses: z.array(z.string().max(240)).max(5),
  missingComponents: z.array(z.string().max(120)).max(5),
  suggestions: z.array(z.string().max(240)).max(5),
  connectionFeedback: z.array(connectionFeedbackSchema).max(12),
  // capacity checkpoint — cross-checks the diagram against the QPS/storage
  // numbers the user committed to before grading; this is what turns
  // "AI likes boxes" into an actual reasoning check.
  capacityCheck: z.object({
    consistent: z.boolean(),
    note: z.string().max(300),
  }),
});

export type Evaluation = z.infer<typeof evaluationSchema>;
