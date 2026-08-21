import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/api/session";
import { apiError } from "@/lib/api/respond";

// Governance: account deletion actually removes the user's data (cascades
// to Design/DesignAttempt/EvaluationLog/Account/Session via the schema's
// onDelete: Cascade) rather than a soft "deactivate" flag.
export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
