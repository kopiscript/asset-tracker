import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageFleet, getOrgRole } from "@/lib/permissions";

// POST /api/orgs/[id]/fleets/[fleetId]/members/[userId] — grant fleet access (owner only)
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets/[fleetId]/members/[userId]">
) {
  const { id: orgId, fleetId, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageFleet(dbUser.id, fleetId))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  // Target user must already be an org member (admin or viewer)
  const targetOrgRole = await getOrgRole(targetUserId, orgId);
  if (!targetOrgRole || targetOrgRole === "owner") {
    return Response.json(
      { data: null, error: "User must be an org admin or viewer to be granted fleet access." },
      { status: 400 }
    );
  }

  try {
    await prisma.fleetMember.create({ data: { fleetId, userId: targetUserId } });
    return Response.json({ data: { fleetId, userId: targetUserId }, error: null }, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return Response.json({ data: { fleetId, userId: targetUserId }, error: null });
    }
    console.error("[POST /api/orgs/[id]/fleets/[fleetId]/members/[userId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/orgs/[id]/fleets/[fleetId]/members/[userId] — revoke fleet access (owner only)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets/[fleetId]/members/[userId]">
) {
  const { fleetId, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageFleet(dbUser.id, fleetId))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.fleetMember.delete({
      where: { fleetId_userId: { fleetId, userId: targetUserId } },
    });
    return Response.json({ data: { fleetId, userId: targetUserId }, error: null });
  } catch (e) {
    console.error("[DELETE /api/orgs/[id]/fleets/[fleetId]/members/[userId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
