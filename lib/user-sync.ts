/**
 * lib/user-sync.ts
 * Returns the database User for the currently signed-in session.
 * With NextAuth credentials, users are created at sign-up — no sync needed.
 * Call this at the top of any API route or server action that needs the DB user.
 */
import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function getOrCreateDbUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
