/**
 * app/api/vehicles/route.ts
 * GET  — list all vehicles the current user can access
 * POST — create a new vehicle (user becomes the owner)
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";

function deriveStatus(isActive: boolean | null, lastSeenAt: Date | null): string {
  if (!isActive) return "offline";
  if (!lastSeenAt) return "idle";
  const minAgo = (Date.now() - lastSeenAt.getTime()) / 60000;
  return minAgo < 10 ? "active" : minAgo < 60 ? "idle" : "offline";
}

// GET /api/vehicles
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  try {
    const accesses = await prisma.vehicleAccess.findMany({
      where: { userId: dbUser.id },
      include: {
        vehicle: {
          include: {
            telemetryRecords: {
              orderBy: { timestampUtc: "desc" },
              take: 1,
              select: { latitude: true, longitude: true, timestampUtc: true },
            },
          },
        },
      },
    });

    const vehicles = accesses.map((a) => {
      const latest = a.vehicle.telemetryRecords[0] ?? null;
      return {
        id: a.vehicle.id.toString(),
        imei: a.vehicle.imei,
        name: a.vehicle.name,
        plateNumber: a.vehicle.plateNumber,
        type: a.vehicle.type,
        driverName: a.vehicle.driverName,
        isActive: a.vehicle.isActive,
        latitude: latest?.latitude ?? null,
        longitude: latest?.longitude ?? null,
        lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
        status: deriveStatus(a.vehicle.isActive, latest?.timestampUtc ?? null),
        userRole: a.role,
      };
    });

    return Response.json({ data: vehicles, error: null });
  } catch (e) {
    console.error("[GET /api/vehicles]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/vehicles
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.imei || typeof body.imei !== "string") {
    return Response.json({ data: null, error: "IMEI is required." }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string") {
    return Response.json({ data: null, error: "Vehicle name is required." }, { status: 400 });
  }
  if (!body.plateNumber || typeof body.plateNumber !== "string") {
    return Response.json({ data: null, error: "Plate number is required." }, { status: 400 });
  }

  try {
    const v = await prisma.vehicle.create({
      data: {
        imei: (body.imei as string).trim().toUpperCase(),
        name: body.name as string,
        plateNumber: (body.plateNumber as string).toUpperCase(),
        type: body.type && typeof body.type === "string" ? body.type : null,
        driverName: body.driverName && typeof body.driverName === "string" ? body.driverName : null,
        isActive: true,
        userId: dbUser.id,
      },
    });

    await prisma.vehicleAccess.create({
      data: {
        vehicleId: v.id,
        userId: dbUser.id,
        role: "owner",
      },
    });

    return Response.json(
      { data: { ...v, id: v.id.toString() }, error: null },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/vehicles]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
