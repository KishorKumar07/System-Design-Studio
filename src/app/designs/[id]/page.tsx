import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { DesignEditor } from "@/components/canvas/DesignEditor";
import type { CapacityInputs, DiagramEdge, DiagramNode } from "@/lib/validation/design.schema";

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const design = await prisma.design.findUnique({
    where: { id },
    include: { problem: { select: { title: true } } },
  });
  if (!design) notFound();
  if (design.userId !== session!.user.id) redirect("/dashboard");

  return (
    <DesignEditor
      designId={design.id}
      problemTitle={design.problem.title}
      initialTitle={design.title}
      initialNodes={(design.nodes as unknown as DiagramNode[]) ?? []}
      initialEdges={(design.edges as unknown as DiagramEdge[]) ?? []}
      initialCapacity={(design.capacityInputs as unknown as Partial<CapacityInputs>) ?? {}}
      initialIsPublic={design.isPublic}
    />
  );
}
