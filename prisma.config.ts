/**
 * prisma.config.ts
 * Configuration for the Prisma CLI (migrate, studio, generate, seed).
 *
 * Prisma 7 change: database URLs are configured HERE, not in schema.prisma.
 * The `datasource.url` below is used by: npx prisma migrate dev, prisma studio, etc.
 *
 * The runtime client (lib/prisma.ts) reads DATABASE_URL directly and passes
 * it to the PrismaPg adapter — that's the Prisma 7 way of connecting at runtime.
 *
 * ✏️ EDIT: Set DATABASE_URL in your .env file (see README).
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Reads DATABASE_URL from .env (loaded above by dotenv/config)
    url: process.env["DATABASE_URL"],
  },
});
