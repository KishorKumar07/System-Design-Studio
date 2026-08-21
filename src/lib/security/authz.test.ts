import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: { design: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

// Imported after the mock so authz.ts picks up the mocked prisma module.
const { requireDesignOwner, NotFoundError, ForbiddenError } = await import("./authz");

describe("requireDesignOwner", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("throws NotFoundError when the design does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(requireDesignOwner("missing-id", "user-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when the design belongs to a different user", async () => {
    findUnique.mockResolvedValue({ id: "d1", userId: "someone-else" });
    await expect(requireDesignOwner("d1", "user-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns the design when the requesting user is the owner", async () => {
    const design = { id: "d1", userId: "user-1" };
    findUnique.mockResolvedValue(design);
    await expect(requireDesignOwner("d1", "user-1")).resolves.toBe(design);
  });
});
