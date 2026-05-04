/**
 * app/api/vehicles/route.ts
 * GET  — list all vehicles the current user can access
 * POST — create a new vehicle (user becomes the owner)
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";

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

  const accesses = await prisma.vehicleAccess.findMany({
    where: { userId: dbUser.id },
    include: {
      vehicle: true,
    },
  });

  const vehicles = accesses.map((a) => ({
    ...a.vehicle,
    userRole: a.role,
  }));

  return Response.json({ data: vehicles, error: null });
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

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ data: null, error: "Vehicle name is required." }, { status: 400 });
  }
  if (!body.plateNumber || typeof body.plateNumber !== "string") {
    return Response.json({ data: null, error: "Plate number is required." }, { status: 400 });
  }
  if (!body.type || typeof body.type !== "string") {
    return Response.json({ data: null, error: "Vehicle type is required." }, { status: 400 });
  }

  // Create vehicle + owner access in a transaction
  const vehicle = await prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.create({
      data: {
        name: body.name as string,
        plateNumber: (body.plateNumber as string).toUpperCase(),
        type: body.type as string,
        status: (body.status as string) ?? "offline",
        fuelLevel:
          typeof body.fuelLevel === "number" ? body.fuelLevel : null,
        mileage: typeof body.mileage === "number" ? body.mileage : null,
        driverName:
          body.driverName && typeof body.driverName === "string"
            ? body.driverName
            : null,
        notes:
          body.notes && typeof body.notes === "string" ? body.notes : null,
        imageUrl:
          body.imageUrl && typeof body.imageUrl === "string"
            ? body.imageUrl
            : null,
        latitude:
          typeof body.latitude === "number" ? body.latitude : null,
        longitude:
          typeof body.longitude === "number" ? body.longitude : null,
        lastSeenAt:
          body.latitude != null ? new Date() : null,
        ownerId: dbUser.id,
      },
    });

    await tx.vehicleAccess.create({
      data: {
        vehicleId: v.id,
        userId: dbUser.id,
        role: "owner",
      },
    });

    return v;
  });

  return Response.json({ data: vehicle, error: null }, { status: 201 });
}
