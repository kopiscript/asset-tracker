import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";

// GET /api/admin/users — all users with their org memberships.
// Requires usertype = "admin" or "system_admin".
export async function GET() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  if (dbUser.usertype !== "admin" && dbUser.usertype !== "system_admin") {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id:        true,
        name:      true,
        email:     true,
        usertype:  true,
        createdAt: true,
        orgMemberships: {
          select: {
            role: true,
            org: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = users.map((u) => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      usertype:  u.usertype,
      createdAt: u.createdAt?.toISOString() ?? null,
      orgCount:  u.orgMemberships.length,
      orgs:      u.orgMemberships.map((m) => ({
        id:   m.org.id,
        name: m.org.name,
        role: m.role,
      })),
    }));

    return Response.json({ data, error: null });
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
