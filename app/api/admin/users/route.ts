/**
 * app/api/admin/users/route.ts
 * GET — all registered users with their vehicle summary.
 * Requires usertype = "admin".
 */
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";

export async function GET() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  if (dbUser.usertype !== "admin") {
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
        accesses: {
          select: {
            role: true,
            vehicle: { select: { id: true, name: true, plateNumber: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = users.map((u) => ({
      id:           u.id,
      name:         u.name,
      email:        u.email,
      usertype:     u.usertype,
      createdAt:    u.createdAt?.toISOString() ?? null,
      vehicleCount: u.accesses.length,
      vehicles:     u.accesses.map((a) => ({
        id:          a.vehicle.id.toString(),
        name:        a.vehicle.name,
        plateNumber: a.vehicle.plateNumber,
        role:        a.role,
      })),
    }));

    return Response.json({ data, error: null });
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
