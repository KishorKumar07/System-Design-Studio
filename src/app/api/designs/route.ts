import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/api/session";
import { apiError } from "@/lib/api/respond";
import { NotFoundError } from "@/lib/security/authz";

const createDesignSchema = z.object({ problemId: z.string().min(1).max(64) });

export async function GET() {
  try {
    const userId = await requireUserId();
    const designs = await prisma.design.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        isPublic: true,
        latestScore: true,
        latestVerdict: true,
        updatedAt: true,
        problem: { select: { slug: true, title: true, difficulty: true } },
      },
    });
    return NextResponse.json({ designs });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { problemId } = createDesignSchema.parse(await req.json());

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundError("Problem not found");

    const design = await prisma.design.create({
      data: {
        userId,
        problemId,
        title: `${problem.title} — attempt`,
        nodes: [],
        edges: [],
      },
    });

    return NextResponse.json({ design }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
