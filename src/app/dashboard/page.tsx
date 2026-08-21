import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AppNav } from "@/components/AppNav";
import { DashboardGrid } from "@/components/DashboardGrid";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const designs = await prisma.design.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { problem: { select: { title: true, slug: true, difficulty: true } } },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="dashboard" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your designs</h1>
          <Link href="/problems">
            <Button size="sm">
              <Plus size={15} />
              New design
            </Button>
          </Link>
        </div>

        <DashboardGrid designs={designs} />
      </main>
    </div>
  );
}
