import { prisma } from "@/lib/db/prisma";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Every mutating design route must call this before touching the row.
 * Ownership is re-checked server-side on every request — never inferred
 * from a client-supplied flag or trusted from a prior page load.
 */
export async function requireDesignOwner(designId: string, userId: string) {
  const design = await prisma.design.findUnique({ where: { id: designId } });
  if (!design) throw new NotFoundError("Design not found");
  if (design.userId !== userId) throw new ForbiddenError("You do not own this design");
  return design;
}
