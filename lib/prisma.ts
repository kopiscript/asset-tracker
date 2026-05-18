/**
 * lib/prisma.ts
 * Exports a single shared PrismaClient instance for Neon (PostgreSQL).
 *
 * Uses PrismaNeonHttp (HTTP transport, not TCP).
 * Neon's HTTP endpoint lives on the DIRECT host (ep-xxx.region.neon.tech),
 * not the pooler host. HTTP wakes a sleeping Neon compute in ~1s transparently,
 * avoiding the 22s ETIMEDOUT that TCP connections produce on cold starts.
 *
 * DATABASE_URL must be the direct (non-pooler) connection string.
 */
import { PrismaClient } from "./generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env — see README for instructions."
    );
  }
  const adapter = new PrismaNeonHttp(connectionString, {});
  return new PrismaClient({ adapter });
}

// Preserve client across hot-reloads in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
