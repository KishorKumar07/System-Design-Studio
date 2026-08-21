"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StaggerList, StaggerItem } from "@/components/ui/Motion";

interface ProblemRow {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
}

const DIFFICULTY_TONE = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "danger",
} as const;

export function ProblemsGrid({ problems }: { problems: ProblemRow[] }) {
  return (
    <StaggerList className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {problems.map((p) => (
        <StaggerItem key={p.id}>
          <Link href={`/problems/${p.slug}`}>
            <Card hoverable className="flex h-full flex-col gap-2 p-5">
              <span className="text-sm text-foreground-muted">{p.category}</span>
              <span className="font-medium">{p.title}</span>
              <Badge tone={DIFFICULTY_TONE[p.difficulty as keyof typeof DIFFICULTY_TONE] ?? "neutral"}>
                {p.difficulty}
              </Badge>
            </Card>
          </Link>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
