import { prisma } from "./prisma";

// ── Internal helpers ───────────────────────────────────────────────────────

async function isSystemAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { usertype: true },
  });
  return user?.usertype === "admin" || user?.usertype === "system_admin";
}

/** Returns the user's role in an org, or null if not a member. */
export async function getOrgRole(
  userId: string,
  orgId: string
): Promise<string | null> {
  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

// ── Vehicle-level roles ────────────────────────────────────────────────────

/**
 * Returns the effective role a user has on a vehicle:
 *   "owner"  — org owner (full control)
 *   "admin"  — org admin with fleet access (read + write)
 *   "viewer" — org viewer with fleet access (read only)
 *   null     — no access
 *
 * System admins are treated as "owner" on every vehicle.
 */
export async function getEffectiveVehicleRole(
  userId: string,
  vehicleId: string
): Promise<"owner" | "admin" | "viewer" | null> {
  if (await isSystemAdmin(userId)) return "owner";

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: BigInt(vehicleId) },
    select: { orgId: true },
  });
  if (!vehicle?.orgId) return null;

  const orgRole = await getOrgRole(userId, vehicle.orgId);
  if (!orgRole) return null;
  // All org members (owner, admin, viewer) can access all vehicles in the org
  return orgRole as "owner" | "admin" | "viewer";
}

export async function canView(userId: string, vehicleId: string): Promise<boolean> {
  return (await getEffectiveVehicleRole(userId, vehicleId)) !== null;
}

export async function canEdit(userId: string, vehicleId: string): Promise<boolean> {
  const role = await getEffectiveVehicleRole(userId, vehicleId);
  return role === "owner" || role === "admin";
}

/** Only org owners can delete vehicles. */
export async function canDelete(userId: string, vehicleId: string): Promise<boolean> {
  const role = await getEffectiveVehicleRole(userId, vehicleId);
  return role === "owner";
}

// ── Org-level permissions ──────────────────────────────────────────────────

/** Can user manage org members and settings? (system_admin or org owner) */
export async function canManageOrg(userId: string, orgId: string): Promise<boolean> {
  if (await isSystemAdmin(userId)) return true;
  return (await getOrgRole(userId, orgId)) === "owner";
}

