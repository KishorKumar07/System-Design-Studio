import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AppNav } from "@/components/AppNav";
import { StartDesignButton } from "@/components/StartDesignButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/Motion";

export const dynamic = "force-dynamic";

const DIFFICULTY_TONE = { EASY: "success", MEDIUM: "warning", HARD: "danger" } as const;

export default async function ProblemDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const problem = await prisma.problem.findUnique({ where: { slug } });
  if (!problem) notFound();

  const existingDesigns = await prisma.design.findMany({
    where: { userId: session!.user.id, problemId: problem.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, latestScore: true, updatedAt: true },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="problems" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8">
        <FadeIn>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-foreground-muted">{problem.category}</span>
            <Badge tone={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{problem.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground-muted">{problem.statement}</p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Section title="Functional requirements" items={problem.functionalRequirements} />
        </FadeIn>
        <FadeIn delay={0.08}>
          <Section title="Non-functional requirements" items={problem.nonFunctionalRequirements} />
        </FadeIn>
        <FadeIn delay={0.11}>
          <Section title="Constraints" items={problem.constraints} />
        </FadeIn>

        <FadeIn delay={0.15} className="mt-8">
          <StartDesignButton problemId={problem.id} />
        </FadeIn>

        {existingDesigns.length > 0 && (
          <FadeIn delay={0.2} className="mt-10">
            <h2 className="mb-3 text-sm font-semibold text-foreground-muted">Your attempts</h2>
            <ul className="flex flex-col gap-2">
              {existingDesigns.map((d) => (
                <li key={d.id}>
                  <Link href={`/designs/${d.id}`}>
                    <Card hoverable className="flex items-center justify-between px-4 py-3">
                      <span>{d.title}</span>
                      <Badge tone="accent">{d.latestScore ?? "—"}</Badge>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </FadeIn>
        )}
      </main>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-foreground-muted">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
