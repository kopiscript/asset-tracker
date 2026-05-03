/**
 * lib/user-sync.ts
 * Ensures a User row exists in our database for the currently logged-in
 * Clerk user. Call this at the top of any API route or server action that
 * needs to reference the current user in the database.
 */
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Gets or creates the database User record for the signed-in Clerk user.
 * Returns null if no user is signed in.
 */
export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@unknown.com`;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    null;

  // upsert: create if not found, update email/name if found
  const dbUser = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name },
    create: { clerkId: clerkUser.id, email, name },
  });

  return dbUser;
}
