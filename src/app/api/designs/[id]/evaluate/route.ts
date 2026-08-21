import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/api/session";
import { apiError } from "@/lib/api/respond";
import { requireDesignOwner, NotFoundError } from "@/lib/security/authz";
import { assertEvaluationAllowed } from "@/lib/security/rateLimit";
import { saveDesignSchema } from "@/lib/validation/design.schema";
import { evaluateDesign } from "@/lib/ai/evaluate";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const design = await requireDesignOwner(id, userId);

    // Rate limit BEFORE the (expensive) AI call, not after — the whole point
    // is to stop the spend, not just record that it happened.
    await assertEvaluationAllowed(userId);

    const body = saveDesignSchema.parse(await req.json());

    const problem = await prisma.problem.findUnique({ where: { id: design.problemId } });
    if (!problem) throw new NotFoundError("Problem not found");

    const evaluation = await evaluateDesign(userId, id, problem, body.nodes, body.edges, body.capacityInputs);

    const [, updatedDesign] = await prisma.$transaction([
      prisma.designAttempt.create({
        data: {
          designId: id,
          nodes: body.nodes,
          edges: body.edges,
          capacityInputs: body.capacityInputs ?? undefined,
          evaluation: evaluation as object,
          score: evaluation.overallScore,
        },
      }),
      prisma.design.update({
        where: { id },
        data: {
          title: body.title,
          nodes: body.nodes,
          edges: body.edges,
          capacityInputs: body.capacityInputs ?? undefined,
          latestScore: evaluation.overallScore,
          latestVerdict: evaluation.verdict,
          latestEvaluation: evaluation as object,
        },
      }),
    ]);

    return NextResponse.json({ evaluation, design: updatedDesign });
  } catch (err) {
    return apiError(err);
  }
}
