import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { AppNav } from "@/components/AppNav";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/Motion";

export const dynamic = "force-dynamic";

function thirtyDaysAgo(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export default async function AccountPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, usageLast30d] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    prisma.evaluationLog.aggregate({
      where: { userId, createdAt: { gte: thirtyDaysAgo() } },
      _sum: { costUsd: true },
      _count: true,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="account" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Account</h1>

        <FadeIn>
          <Card className="mb-4 p-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-foreground-muted">Name</dt>
                <dd className="mt-1 font-medium">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-foreground-muted">Email</dt>
                <dd className="mt-1 font-medium">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-foreground-muted">Member since</dt>
                <dd className="mt-1 font-medium">{user?.createdAt.toLocaleDateString()}</dd>
              </div>
            </dl>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className="mb-6 p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground-muted">
              AI evaluation usage (last 30 days)
            </h2>
            <div className="flex items-baseline gap-6">
              <div>
                <p className="text-2xl font-semibold">{usageLast30d._count}</p>
                <p className="text-xs text-foreground-muted">evaluation{usageLast30d._count === 1 ? "" : "s"}</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">${(usageLast30d._sum.costUsd?.toNumber() ?? 0).toFixed(4)}</p>
                <p className="text-xs text-foreground-muted">estimated cost</p>
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="mb-2 text-sm font-semibold text-foreground-muted">Danger zone</h2>
          <DeleteAccountButton />
        </FadeIn>
      </main>
    </div>
  );
}
