import type { CSSProperties } from "react";
import type { DiagramNode } from "@/lib/validation/design.schema";

export interface PaletteItem {
  type: string;
  label: string;
  category: DiagramNode["category"];
}

export const PALETTE: Record<string, PaletteItem[]> = {
  "Client / Edge": [
    { type: "client-app", label: "Client App", category: "client-edge" },
    { type: "cdn", label: "CDN", category: "client-edge" },
    { type: "dns", label: "DNS", category: "client-edge" },
  ],
  Networking: [
    { type: "load-balancer", label: "Load Balancer", category: "networking" },
    { type: "api-gateway", label: "API Gateway", category: "networking" },
  ],
  Compute: [
    { type: "app-server", label: "App Server", category: "compute" },
    { type: "microservice", label: "Microservice", category: "compute" },
    { type: "serverless-fn", label: "Serverless Function", category: "compute" },
  ],
  Data: [
    { type: "sql-db", label: "SQL Database", category: "data" },
    { type: "nosql-db", label: "NoSQL Database", category: "data" },
    { type: "cache", label: "Cache", category: "data" },
    { type: "search-index", label: "Search Index", category: "data" },
  ],
  Messaging: [
    { type: "queue", label: "Message Queue", category: "messaging" },
    { type: "pubsub", label: "Pub/Sub", category: "messaging" },
  ],
  Storage: [{ type: "object-storage", label: "Object Storage", category: "storage" }],
  Ops: [
    { type: "auth-service", label: "Auth Service", category: "ops" },
    { type: "rate-limiter", label: "Rate Limiter", category: "ops" },
    { type: "monitoring", label: "Monitoring", category: "ops" },
  ],
};

export const CATEGORY_COLOR: Record<DiagramNode["category"], string> = {
  "client-edge": "#0ea5e9",
  networking: "#8b5cf6",
  compute: "#22c55e",
  data: "#f59e0b",
  messaging: "#ec4899",
  storage: "#64748b",
  ops: "#ef4444",
};

/** Shared React Flow node styling — used by both the editor and the
 * read-only public canvas so a design looks identical in both places. */
export function diagramNodeStyle(category: DiagramNode["category"]): CSSProperties {
  return {
    background: "var(--surface)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    borderLeftWidth: 4,
    borderLeftColor: CATEGORY_COLOR[category],
    borderRadius: 8,
    fontSize: 13,
    padding: "8px 12px",
  };
}
