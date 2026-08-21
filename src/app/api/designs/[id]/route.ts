import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/api/session";
import { apiError } from "@/lib/api/respond";
import { requireDesignOwner, NotFoundError } from "@/lib/security/authz";
import { saveDesignSchema } from "@/lib/validation/design.schema";
import { auth } from "@/lib/auth";

// Public read: an authenticated non-owner or anonymous visitor may only ever
// read a design that is explicitly isPublic — this is a separate query path
// from the owner fetch below, not the same query gated by a client flag.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const design = await prisma.design.findUnique({
      where: { id },
      include: { problem: true },
    });
    if (!design) throw new NotFoundError("Design not found");

    const isOwner = session?.user?.id === design.userId;
    if (!isOwner && !design.isPublic) throw new NotFoundError("Design not found");

    return NextResponse.json({ design, isOwner });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await requireDesignOwner(id, userId);

    const body = saveDesignSchema.parse(await req.json());

    const design = await prisma.design.update({
      where: { id },
      data: {
        title: body.title,
        nodes: body.nodes,
        edges: body.edges,
        capacityInputs: body.capacityInputs ?? undefined,
      },
    });

    return NextResponse.json({ design });
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await requireDesignOwner(id, userId);

    await prisma.design.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
