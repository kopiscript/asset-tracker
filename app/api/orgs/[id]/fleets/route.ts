import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg, getOrgRole } from "@/lib/permissions";

// GET /api/orgs/[id]/fleets — list fleets in an org
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  const orgRole = isAdmin ? "owner" : await getOrgRole(dbUser.id, id);
  if (!orgRole) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });

  try {
    const fleets = await prisma.fleet.findMany({
      where: { orgId: id },
      include: {
        _count: { select: { vehicles: true, members: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({
      data: fleets.map((f) => ({
        id: f.id, name: f.name, orgId: f.orgId,
        createdAt: f.createdAt.toISOString(),
        vehicleCount: f._count.vehicles,
        memberCount: f._count.members,
      })),
      error: null,
    });
  } catch (e) {
    console.error("[GET /api/orgs/[id]/fleets]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/orgs/[id]/fleets — create a fleet (owner only)
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets">
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

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return Response.json({ data: null, error: "Fleet name is required." }, { status: 400 });
  }

  try {
    const fleet = await prisma.fleet.create({ data: { name: body.name.trim(), orgId: id } });
    return Response.json(
      { data: { id: fleet.id, name: fleet.name, orgId: fleet.orgId }, error: null },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/orgs/[id]/fleets]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
