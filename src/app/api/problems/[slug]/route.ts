import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/respond";
import { NotFoundError } from "@/lib/security/authz";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const problem = await prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundError("Problem not found");
    return NextResponse.json({ problem });
  } catch (err) {
    return apiError(err);
  }
}
