/**
 * app/api/admin/vehicles/route.ts
 * GET — all vehicles across all users with latest telemetry.
 * Requires usertype = "admin".
 */
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { deriveStatus } from "@/lib/status";

export async function GET() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  if (dbUser.usertype !== "admin") {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        telemetryRecords: {
          where: { latitude: { not: null }, longitude: { not: null } },
          orderBy: { timestampUtc: "desc" },
          take: 1,
          select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = vehicles.map((v) => {
      const latest = v.telemetryRecords[0] ?? null;
      return {
        id:          v.id.toString(),
        imei:        v.imei,
        name:        v.name,
        plateNumber: v.plateNumber,
        type:        v.type,
        driverName:  v.driverName,
        isActive:    v.isActive,
        latitude:    latest?.latitude  ?? null,
        longitude:   latest?.longitude ?? null,
        lastSeenAt:  latest?.timestampUtc?.toISOString() ?? null,
        speed:       latest?.speedKmh  ?? null,
        status:      deriveStatus(v.isActive, latest?.timestampUtc ?? null),
        owner:       v.owner,
      };
    });

    return Response.json({ data, error: null });
  } catch (e) {
    console.error("[GET /api/admin/vehicles]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
