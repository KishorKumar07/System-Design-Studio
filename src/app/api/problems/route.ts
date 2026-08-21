import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/respond";

export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
      select: { id: true, slug: true, title: true, difficulty: true, category: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ problems });
  } catch (err) {
    return apiError(err);
  }
}
