import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getOrgRole } from "@/lib/permissions";

// GET /api/orgs/[id]/members/[userId]/vehicle-access
// Returns the vehicle allowlist for a viewer member (owner or admin only).
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/members/[userId]/vehicle-access">
) {
  const { id: orgId, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const isSystemAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  const callerRole = isSystemAdmin ? "owner" : await getOrgRole(dbUser.id, orgId);
  if (callerRole !== "owner" && callerRole !== "admin") {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: targetUserId, orgId } },
    select: { id: true, role: true, vehicleAccess: { select: { vehicleId: true } } },
  });
  if (!member) return Response.json({ data: null, error: "Member not found" }, { status: 404 });

  return Response.json({
    data: {
      restricted: member.vehicleAccess.length > 0,
      vehicleIds: member.vehicleAccess.map((a) => a.vehicleId.toString()),
    },
    error: null,
  });
}

// PUT /api/orgs/[id]/members/[userId]/vehicle-access
// Replaces the viewer's vehicle allowlist. Empty array = unrestricted (sees all).
// Only works for viewer-role members. Caller must be owner or admin.
export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/members/[userId]/vehicle-access">
) {
  const { id: orgId, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const isSystemAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  const callerRole = isSystemAdmin ? "owner" : await getOrgRole(dbUser.id, orgId);
  if (callerRole !== "owner" && callerRole !== "admin") {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  const member = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: targetUserId, orgId } },
    select: { id: true, role: true },
  });
  if (!member) return Response.json({ data: null, error: "Member not found" }, { status: 404 });
  if (member.role !== "viewer") {
    return Response.json({ data: null, error: "Vehicle access lists only apply to viewers." }, { status: 400 });
  }

  let body: { vehicleIds?: unknown };
  try { body = await request.json(); } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.vehicleIds)) {
    return Response.json({ data: null, error: "vehicleIds must be an array." }, { status: 400 });
  }

  const rawIds = body.vehicleIds as unknown[];
  if (!rawIds.every((v) => typeof v === "string")) {
    return Response.json({ data: null, error: "vehicleIds must be strings." }, { status: 400 });
  }
  const vehicleIds = rawIds as string[];

  // Validate that all vehicleIds belong to this org
  if (vehicleIds.length > 0) {
    const count = await prisma.vehicle.count({
      where: { id: { in: vehicleIds.map(BigInt) }, orgId },
    });
    if (count !== vehicleIds.length) {
      return Response.json({ data: null, error: "One or more vehicles do not belong to this org." }, { status: 400 });
    }
  }

  try {
    // Clear existing allowlist (deleteMany not supported in HTTP mode — use raw)
    await prisma.$executeRawUnsafe(
      `DELETE FROM viewer_vehicle_access WHERE member_id = $1`,
      member.id
    );

    // Insert new entries one by one
    for (const vehicleIdStr of vehicleIds) {
      await prisma.viewerVehicleAccess.create({
        data: { memberId: member.id, vehicleId: BigInt(vehicleIdStr) },
      });
    }

    return Response.json({
      data: { restricted: vehicleIds.length > 0, vehicleIds },
      error: null,
    });
  } catch (e) {
    console.error("[PUT /api/orgs/[id]/members/[userId]/vehicle-access]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
