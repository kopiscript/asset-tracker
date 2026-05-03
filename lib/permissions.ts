/**
 * lib/permissions.ts
 * Helper functions that check what actions a user can perform on a vehicle.
 * Always use these in API routes to enforce access control.
 *
 * Roles (from least to most powerful):
 *   viewer  → can only view
 *   editor  → can view + edit vehicle details
 *   owner   → can view + edit + share + delete
 */
import { prisma } from "./prisma";

/** Returns the role string for a user on a vehicle, or null if no access. */
export async function getRole(
  userId: string,
  vehicleId: string
): Promise<string | null> {
  const access = await prisma.vehicleAccess.findUnique({
    where: { vehicleId_userId: { vehicleId, userId } },
    select: { role: true },
  });
  return access?.role ?? null;
}

/** Can the user view this vehicle? (viewer, editor, or owner) */
export async function canView(
  userId: string,
  vehicleId: string
): Promise<boolean> {
  const role = await getRole(userId, vehicleId);
  return role !== null;
}

/** Can the user edit this vehicle's details? (editor or owner) */
export async function canEdit(
  userId: string,
  vehicleId: string
): Promise<boolean> {
  const role = await getRole(userId, vehicleId);
  return role === "editor" || role === "owner";
}

/** Can the user manage who has access? (owner only) */
export async function canShare(
  userId: string,
  vehicleId: string
): Promise<boolean> {
  const role = await getRole(userId, vehicleId);
  return role === "owner";
}

/** Can the user delete this vehicle? (owner only) */
export async function canDelete(
  userId: string,
  vehicleId: string
): Promise<boolean> {
  const role = await getRole(userId, vehicleId);
  return role === "owner";
}
