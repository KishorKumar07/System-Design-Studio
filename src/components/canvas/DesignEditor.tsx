"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Blocks, Globe, Lock, PanelRightOpen, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { ComponentPalette } from "./ComponentPalette";
import { CapacityForm } from "./CapacityForm";
import { EvaluationResults } from "./EvaluationResults";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { diagramNodeStyle, type PaletteItem } from "@/lib/palette";
import type { CapacityInputs, DiagramEdge, DiagramNode } from "@/lib/validation/design.schema";
import type { Evaluation } from "@/lib/ai/schema";

interface NodeData extends Record<string, unknown> {
  label: string;
  category: DiagramNode["category"];
}

interface DesignEditorProps {
  designId: string;
  problemTitle: string;
  initialTitle: string;
  initialNodes: DiagramNode[];
  initialEdges: DiagramEdge[];
  initialCapacity: Partial<CapacityInputs>;
  initialIsPublic: boolean;
}

function toFlowNode(n: DiagramNode): Node {
  return {
    id: n.id,
    position: n.position,
    data: { label: n.label, category: n.category },
    type: "default",
    style: diagramNodeStyle(n.category),
  };
}

function toFlowEdge(e: DiagramEdge): Edge {
  const twoWay = e.direction === "two-way";
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    data: { direction: e.direction },
    markerEnd: { type: MarkerType.ArrowClosed },
    markerStart: twoWay ? { type: MarkerType.ArrowClosed } : undefined,
  };
}

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function isCapacityComplete(c: Partial<CapacityInputs>): c is CapacityInputs {
  return (
    typeof c.expectedQps === "number" &&
    typeof c.readWriteRatio === "string" &&
    c.readWriteRatio.length > 0 &&
    typeof c.dataVolumeGb === "number"
  );
}

function EditorInner({
  designId,
  problemTitle,
  initialTitle,
  initialNodes,
  initialEdges,
  initialCapacity,
  initialIsPublic,
}: DesignEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.map(toFlowNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toFlowEdge));
  const [capacity, setCapacity] = useState<Partial<CapacityInputs>>(initialCapacity);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...connection, id: nextId("edge"), data: { direction: "one-way" }, markerEnd: { type: MarkerType.ArrowClosed } },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edge.id) return e;
          const nextDirection = e.data?.direction === "two-way" ? "one-way" : "two-way";
          return {
            ...e,
            data: { direction: nextDirection },
            markerEnd: { type: MarkerType.ArrowClosed },
            markerStart: nextDirection === "two-way" ? { type: MarkerType.ArrowClosed } : undefined,
          };
        }),
      );
    },
    [setEdges],
  );

  const placeItem = useCallback(
    (item: PaletteItem, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: nextId("node"),
        position,
        data: { label: item.label, category: item.category },
        type: "default",
        style: diagramNodeStyle(item.category),
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/json");
      if (!raw || !rfInstance || !wrapperRef.current) return;
      const item: PaletteItem = JSON.parse(raw);

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
      placeItem(item, position);
    },
    [rfInstance, placeItem],
  );

  function toPayload() {
    const diagramNodes: DiagramNode[] = nodes.map((n) => ({
      id: n.id,
      type: (n.type as string) ?? "default",
      label: (n.data as NodeData).label,
      category: (n.data as NodeData).category,
      position: n.position,
    }));
    const diagramEdges: DiagramEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: typeof e.label === "string" ? e.label : undefined,
      direction: (e.data?.direction as "one-way" | "two-way") ?? "one-way",
    }));
    return {
      title,
      nodes: diagramNodes,
      edges: diagramEdges,
      capacityInputs: isCapacityComplete(capacity) ? capacity : undefined,
    };
  }

  async function save() {
    setSaving(true);
    setStatusMsg(null);
    const res = await fetch(`/api/designs/${designId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload()),
    });
    setSaving(false);
    setStatusMsg(res.ok ? "Saved" : "Save failed");
  }

  async function evaluate() {
    setEvaluating(true);
    setStatusMsg(null);
    setSidebarOpen(true);
    const res = await fetch(`/api/designs/${designId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload()),
    });
    const body = await res.json();
    setEvaluating(false);

    if (!res.ok) {
      setStatusMsg(body.error ?? "Evaluation failed");
      return;
    }
    setEvaluation(body.evaluation);
  }

  async function togglePublish() {
    const next = !isPublic;
    const res = await fetch(`/api/designs/${designId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    if (res.ok) setIsPublic(next);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-border-strong">/</span>
          <span className="truncate text-sm text-foreground-muted">{problemTitle}</span>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mx-1 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none transition-colors hover:border-border focus:border-accent"
        />

        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {statusMsg && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden text-xs text-foreground-subtle sm:inline"
              >
                {statusMsg}
              </motion.span>
            )}
          </AnimatePresence>

          <button
            onClick={togglePublish}
            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground"
          >
            {isPublic ? <Globe size={12} /> : <Lock size={12} />}
            {isPublic ? "Public" : "Private"}
          </button>
          {isPublic && (
            <Link href={`/d/${designId}`} target="_blank" className="hidden text-xs text-accent hover:text-accent-hover sm:inline">
              View
            </Link>
          )}

          <Button variant="secondary" size="sm" onClick={save} loading={saving}>
            {!saving && "Save"}
          </Button>
          <Button size="sm" onClick={evaluate} loading={evaluating}>
            {!evaluating && (
              <>
                <Sparkles size={13} />
                Evaluate
              </>
            )}
          </Button>

          <ThemeToggle />

          <button
            onClick={() => setPaletteOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground-muted lg:hidden"
            aria-label="Toggle components"
          >
            <Blocks size={15} />
          </button>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground-muted lg:hidden"
            aria-label="Toggle details"
          >
            {sidebarOpen ? <PanelRightOpen size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Palette — static column on large screens, slide-over drawer below */}
        <div className="hidden w-56 shrink-0 border-r border-border lg:block">
          <ComponentPalette />
        </div>
        <AnimatePresence>
          {paletteOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPaletteOpen(false)}
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-background lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-border p-3">
                  <span className="text-sm font-medium">Components</span>
                  <button onClick={() => setPaletteOpen(false)} className="text-foreground-muted">
                    <X size={16} />
                  </button>
                </div>
                <ComponentPalette />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div ref={wrapperRef} className="flex-1" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onInit={setRfInstance}
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
            <MiniMap
              pannable
              zoomable
              nodeColor={() => (resolvedTheme === "light" ? "#7c3aed" : "#8b5cf6")}
              maskColor="rgba(0,0,0,0.35)"
            />
          </ReactFlow>
        </div>

        {/* Sidebar — static column on large screens, slide-over drawer below */}
        <div className="hidden w-80 shrink-0 flex-col overflow-hidden border-l border-border lg:flex">
          <CapacityForm value={capacity} onChange={setCapacity} />
          <div className="flex-1 overflow-y-auto">
            <SidebarBody evaluation={evaluation} evaluating={evaluating} />
          </div>
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-y-0 right-0 z-40 flex w-80 max-w-[85vw] flex-col border-l border-border bg-background lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-border p-3">
                  <span className="text-sm font-medium">Details</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-foreground-muted">
                    <X size={16} />
                  </button>
                </div>
                <CapacityForm value={capacity} onChange={setCapacity} />
                <div className="flex-1 overflow-y-auto">
                  <SidebarBody evaluation={evaluation} evaluating={evaluating} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SidebarBody({ evaluation, evaluating }: { evaluation: Evaluation | null; evaluating: boolean }) {
  if (evaluating) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="h-6 w-24 animate-shimmer rounded bg-gradient-to-r from-surface-strong via-surface to-surface-strong" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-3 w-full animate-shimmer rounded bg-gradient-to-r from-surface-strong via-surface to-surface-strong" />
        ))}
      </div>
    );
  }
  if (evaluation) return <EvaluationResults evaluation={evaluation} />;
  return (
    <p className="p-4 text-xs text-foreground-subtle">
      Build your diagram, fill in the capacity checkpoint, then click Evaluate.
    </p>
  );
}

export function DesignEditor(props: DesignEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
