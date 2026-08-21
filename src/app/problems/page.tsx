import { prisma } from "@/lib/db/prisma";
import { AppNav } from "@/components/AppNav";
import { ProblemsGrid } from "@/components/ProblemsGrid";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const problems = await prisma.problem.findMany({
    select: { id: true, slug: true, title: true, difficulty: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="problems" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Problems</h1>
        <ProblemsGrid problems={problems} />
      </main>
    </div>
  );
}
