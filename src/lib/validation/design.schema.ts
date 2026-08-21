import { z } from "zod";

// Hard caps on everything user-controlled that ends up either (a) in an LLM
// prompt or (b) rendered on a public share page. Both are the two places
// unbounded/unsanitized user text turns into a real problem (prompt
// injection and stored XSS respectively) — capping size here is the cheapest
// guardrail available and it's enforced server-side, never trusted from the
// client.
export const NODE_CATEGORIES = [
  "client-edge",
  "networking",
  "compute",
  "data",
  "messaging",
  "storage",
  "ops",
] as const;

export const diagramNodeSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  category: z.enum(NODE_CATEGORIES),
  position: z.object({ x: z.number(), y: z.number() }),
});

export const diagramEdgeSchema = z.object({
  id: z.string().min(1).max(64),
  source: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  label: z.string().max(120).optional(),
  direction: z.enum(["one-way", "two-way"]).default("one-way"),
});

export const capacityInputsSchema = z.object({
  expectedQps: z.number().int().nonnegative().max(10_000_000_000),
  readWriteRatio: z.string().max(32),
  dataVolumeGb: z.number().nonnegative().max(1_000_000_000),
  notes: z.string().max(500).optional(),
});

export const saveDesignSchema = z.object({
  title: z.string().trim().min(1).max(120),
  nodes: z.array(diagramNodeSchema).max(60),
  edges: z.array(diagramEdgeSchema).max(150),
  capacityInputs: capacityInputsSchema.optional(),
});

export type DiagramNode = z.infer<typeof diagramNodeSchema>;
export type DiagramEdge = z.infer<typeof diagramEdgeSchema>;
export type CapacityInputs = z.infer<typeof capacityInputsSchema>;
export type SaveDesignInput = z.infer<typeof saveDesignSchema>;
