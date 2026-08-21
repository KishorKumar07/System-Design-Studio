import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Every mutating/private route calls this first — never trust a
 * client-supplied user id. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}
