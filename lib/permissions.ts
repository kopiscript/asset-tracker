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

  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId: vehicle.orgId } },
    select: { role: true, vehicleAccess: { select: { vehicleId: true } } },
  });
  if (!member) return null;

  // Viewers with an allowlist can only see their granted vehicles
  if (member.role === "viewer" && member.vehicleAccess.length > 0) {
    const allowed = member.vehicleAccess.some((a) => a.vehicleId === BigInt(vehicleId));
    if (!allowed) return null;
  }

  return member.role as "owner" | "admin" | "viewer";
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

// ── Vehicle list visibility ─────────────────────────────────────────────────

/**
 * Builds the vehicle-visibility filter for a NON-admin user, honouring the
 * per-viewer `vehicleAccess` allowlist: a viewer WITH allowlist rows sees only
 * those vehicles; owners, admins, and unrestricted viewers see every vehicle in
 * their orgs.
 *
 * Returns Prisma `OR` clauses for a `Vehicle` where-filter plus an orgId→role
 * map, or `null` when the user belongs to no orgs (treat as an empty list).
 *
 * This is the single source of truth for list-level access. Any page or route
 * that renders a set of vehicles MUST use it — system admins are the only
 * callers allowed to bypass it (they see all vehicles).
 */
export async function getAccessibleVehicleFilter(userId: string) {
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    select: { orgId: true, role: true, vehicleAccess: { select: { vehicleId: true } } },
  });
  if (memberships.length === 0) return null;

  const orClauses = memberships.map((m) =>
    m.role === "viewer" && m.vehicleAccess.length > 0
      ? { orgId: m.orgId, id: { in: m.vehicleAccess.map((a) => a.vehicleId) } }
      : { orgId: m.orgId }
  );
  const orgRoleMap = new Map(memberships.map((m) => [m.orgId, m.role]));
  return { orClauses, orgRoleMap };
}

