import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/api/session";
import { apiError } from "@/lib/api/respond";
import { requireDesignOwner } from "@/lib/security/authz";

const publishSchema = z.object({ isPublic: z.boolean() });

// Minimal moderation lever for v1: the owner is the only one who can flip
// this, and unpublishing takes the design out of the public read path in
// GET /api/designs/[id] immediately (see the isPublic check there).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await requireDesignOwner(id, userId);

    const { isPublic } = publishSchema.parse(await req.json());
    const design = await prisma.design.update({ where: { id }, data: { isPublic } });

    return NextResponse.json({ design });
  } catch (err) {
    return apiError(err);
  }
}
