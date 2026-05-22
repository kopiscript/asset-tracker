import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg, getOrgRole } from "@/lib/permissions";

// GET /api/orgs/[id]
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  try {
    const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
    const userRole = isAdmin ? "owner" : await getOrgRole(dbUser.id, id);
    if (!userRole) return Response.json({ data: null, error: "Not found" }, { status: 404 });

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, vehicles: true } },
      },
    });
    if (!org) return Response.json({ data: null, error: "Not found" }, { status: 404 });

    return Response.json({
      data: {
        id: org.id, name: org.name, createdAt: org.createdAt.toISOString(),
        userRole, memberCount: org._count.members,
        vehicleCount: org._count.vehicles,
      },
      error: null,
    });
  } catch (e) {
    console.error("[GET /api/orgs/[id]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// PATCH /api/orgs/[id] — rename org (owner only)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageOrg(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ data: null, error: "Name is required." }, { status: 400 });
  }

  try {
    const org = await prisma.organization.update({ where: { id }, data: { name: body.name.trim() } });
    return Response.json({ data: { id: org.id, name: org.name }, error: null });
  } catch (e) {
    console.error("[PATCH /api/orgs/[id]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/orgs/[id] — delete org and all its fleets/vehicles (owner only)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageOrg(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.organization.delete({ where: { id } });
    return Response.json({ data: { id }, error: null });
  } catch (e) {
    console.error("[DELETE /api/orgs/[id]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
