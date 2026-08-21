import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton — avoids exhausting Postgres connections
// from hot-reload re-creating the client on every module reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
