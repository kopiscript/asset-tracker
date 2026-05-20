import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";

// GET /api/orgs — list all orgs the current user is a member of
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  try {
    const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";

    if (isAdmin) {
      const orgs = await prisma.organization.findMany({
        include: {
          _count: { select: { members: true, vehicles: true, fleets: true } },
        },
        orderBy: { createdAt: "asc" },
      });
      return Response.json({
        data: orgs.map((o) => ({
          id: o.id, name: o.name, createdAt: o.createdAt.toISOString(),
          userRole: "owner",
          memberCount: o._count.members,
          vehicleCount: o._count.vehicles,
          fleetCount: o._count.fleets,
        })),
        error: null,
      });
    }

    const memberships = await prisma.orgMember.findMany({
      where: { userId: dbUser.id },
      include: {
        org: {
          include: { _count: { select: { members: true, vehicles: true, fleets: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({
      data: memberships.map((m) => ({
        id: m.org.id, name: m.org.name, createdAt: m.org.createdAt.toISOString(),
        userRole: m.role,
        memberCount: m.org._count.members,
        vehicleCount: m.org._count.vehicles,
        fleetCount: m.org._count.fleets,
      })),
      error: null,
    });
  } catch (e) {
    console.error("[GET /api/orgs]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/orgs — create a new org (current user becomes owner)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return Response.json({ data: null, error: "Organization name is required." }, { status: 400 });
  }

  try {
    const org = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        members: { create: { userId: dbUser.id, role: "owner" } },
      },
    });
    return Response.json({ data: { id: org.id, name: org.name, userRole: "owner" }, error: null }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/orgs]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
