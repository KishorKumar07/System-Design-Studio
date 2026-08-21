"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { diagramNodeStyle } from "@/lib/palette";
import type { DiagramEdge, DiagramNode } from "@/lib/validation/design.schema";

export function ReadOnlyCanvas({ nodes, edges }: { nodes: DiagramNode[]; edges: DiagramEdge[] }) {
  const { resolvedTheme } = useTheme();

  const flowNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    position: n.position,
    data: { label: n.label },
    style: diagramNodeStyle(n.category),
  }));

  const flowEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    markerStart: e.direction === "two-way" ? { type: MarkerType.ArrowClosed } : undefined,
  }));

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border">
      <ReactFlowProvider>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          colorMode={resolvedTheme === "light" ? "light" : "dark"}
          fitView
        >
          <Background
            variant={BackgroundVariant.Dots}
            color={resolvedTheme === "light" ? "#b8b8c2" : "#454552"}
            gap={20}
            size={2}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
