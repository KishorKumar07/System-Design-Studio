import { notFound } from "next/navigation";
import Link from "next/link";
import { Boxes, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { ReadOnlyCanvas } from "@/components/canvas/ReadOnlyCanvas";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/Motion";
import type { DiagramEdge, DiagramNode } from "@/lib/validation/design.schema";
import type { Evaluation } from "@/lib/ai/schema";

// Always reflect the current isPublic/unpublish state — never serve a stale
// static snapshot of what might now be a private design.
export const dynamic = "force-dynamic";

const DIFFICULTY_TONE = { EASY: "success", MEDIUM: "warning", HARD: "danger" } as const;

// Public route, no auth. Scoped to isPublic: true directly in the query —
// there is no code path here that can return a private design.
export default async function PublicDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const design = await prisma.design.findFirst({
    where: { id, isPublic: true },
    include: { problem: { select: { title: true, difficulty: true } }, user: { select: { name: true } } },
  });
  if (!design) notFound();

  const evaluation = design.latestEvaluation as unknown as Evaluation | null;

  return (
    <div className="flex flex-1 flex-col">
      <nav className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Boxes size={17} />
          </span>
          Architect
        </Link>
        <ThemeToggle />
      </nav>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-20 sm:px-8">
        <FadeIn>
          <div className="mb-2 flex items-center gap-2 text-sm text-foreground-muted">
            <span>{design.problem.title}</span>
            <Badge tone={DIFFICULTY_TONE[design.problem.difficulty]}>{design.problem.difficulty}</Badge>
            <span>· by {design.user.name ?? "Anonymous"}</span>
          </div>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">{design.title}</h1>
        </FadeIn>

        <FadeIn delay={0.05}>
          <ReadOnlyCanvas
            nodes={(design.nodes as unknown as DiagramNode[]) ?? []}
            edges={(design.edges as unknown as DiagramEdge[]) ?? []}
          />
        </FadeIn>

        {evaluation && (
          <FadeIn delay={0.1}>
            <Card className="mt-6 p-6">
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-4xl font-semibold">{evaluation.overallScore}</span>
                <span className="text-foreground-subtle">/ 100</span>
              </div>
              <p className="mb-4 text-foreground-muted">{evaluation.verdict}</p>
              <p className="flex items-center gap-1.5 text-xs text-foreground-subtle">
                <ShieldAlert size={13} />
                AI-generated feedback — a review aid, not an authoritative assessment.
              </p>
            </Card>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
