import { describe, it, expect } from "vitest";
import { saveDesignSchema, diagramNodeSchema, capacityInputsSchema } from "./design.schema";

const validNode = { id: "n1", type: "app-server", label: "App Server", category: "compute", position: { x: 0, y: 0 } };

describe("diagramNodeSchema", () => {
  it("accepts a well-formed node", () => {
    expect(diagramNodeSchema.safeParse(validNode).success).toBe(true);
  });

  it("rejects a category outside the fixed palette", () => {
    const result = diagramNodeSchema.safeParse({ ...validNode, category: "quantum-flux-capacitor" });
    expect(result.success).toBe(false);
  });

  it("rejects a label over the 120-char cap", () => {
    const result = diagramNodeSchema.safeParse({ ...validNode, label: "x".repeat(121) });
    expect(result.success).toBe(false);
  });
});

describe("saveDesignSchema", () => {
  it("accepts a minimal valid design with no edges or capacity", () => {
    const result = saveDesignSchema.safeParse({ title: "My design", nodes: [validNode], edges: [] });
    expect(result.success).toBe(true);
  });

  it("caps nodes at 60 — a 61-node payload is rejected", () => {
    const nodes = Array.from({ length: 61 }, (_, i) => ({ ...validNode, id: `n${i}` }));
    const result = saveDesignSchema.safeParse({ title: "Too big", nodes, edges: [] });
    expect(result.success).toBe(false);
  });

  it("defaults an edge's direction to one-way when omitted", () => {
    const result = saveDesignSchema.safeParse({
      title: "Edge defaults",
      nodes: [validNode, { ...validNode, id: "n2" }],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.edges[0].direction).toBe("one-way");
    }
  });
});

describe("capacityInputsSchema", () => {
  it("rejects a negative expectedQps", () => {
    const result = capacityInputsSchema.safeParse({ expectedQps: -1, readWriteRatio: "10:1", dataVolumeGb: 5 });
    expect(result.success).toBe(false);
  });

  it("accepts realistic scale numbers", () => {
    const result = capacityInputsSchema.safeParse({ expectedQps: 5000, readWriteRatio: "100:1", dataVolumeGb: 200 });
    expect(result.success).toBe(true);
  });
});
