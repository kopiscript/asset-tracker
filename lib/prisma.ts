/**
 * lib/prisma.ts
 * Exports a single shared PrismaClient instance.
 * Prisma 7 requires a driver adapter — we use PrismaPg for PostgreSQL.
 * In development, a global variable prevents creating too many connections
 * when Next.js hot-reloads the server.
 */
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local and .env — see README for instructions."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Use a global variable in development to preserve the client across hot-reloads
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
