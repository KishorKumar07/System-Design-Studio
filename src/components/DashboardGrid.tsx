"use client";

import Link from "next/link";
import { Boxes, Globe, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StaggerList, StaggerItem, FadeIn } from "@/components/ui/Motion";

interface DesignRow {
  id: string;
  title: string;
  isPublic: boolean;
  latestScore: number | null;
  problem: { title: string; difficulty: string };
}

function scoreTone(score: number | null) {
  if (score === null) return "neutral" as const;
  if (score >= 75) return "success" as const;
  if (score >= 45) return "warning" as const;
  return "danger" as const;
}

export function DashboardGrid({ designs }: { designs: DesignRow[] }) {
  if (designs.length === 0) {
    return (
      <FadeIn className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Boxes size={20} />
        </span>
        <p className="text-foreground-muted">
          No designs yet. <Link href="/problems" className="font-medium text-accent hover:text-accent-hover">Pick a problem</Link> to get started.
        </p>
      </FadeIn>
    );
  }

  return (
    <StaggerList className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {designs.map((d) => (
        <StaggerItem key={d.id}>
          <Link href={`/designs/${d.id}`}>
            <Card hoverable className="flex items-center justify-between p-5">
              <div className="min-w-0">
                <p className="truncate font-medium">{d.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-muted">
                  {d.problem.title}
                  <span className="text-foreground-subtle">·</span>
                  {d.problem.difficulty}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-foreground-subtle">
                  {d.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  {d.isPublic ? "Public" : "Private"}
                </div>
              </div>
              <Badge tone={scoreTone(d.latestScore)}>{d.latestScore ?? "—"}</Badge>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
