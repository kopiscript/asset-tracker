/**
 * app/api/simulate/tick/route.ts
 * POST — advance all active seeded vehicles one simulation step.
 *
 * Computes each vehicle's current position from the deterministic route function,
 * writes it to Vehicle (lat/lng/lastSeenAt) and appends one LocationHistory row.
 * Returns the updated vehicle list in the same shape as GET /api/vehicles.
 *
 * Auth: requires a valid session (same as dashboard).
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SIMULATION_ROUTES, VEHICLE_PHASE_MS, computePosition } from "@/lib/simulation-routes";
import { randomUUID } from "crypto";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowMs = now.getTime();

  try {
    // Update every routed vehicle in parallel
    const updates = Object.entries(SIMULATION_ROUTES).map(async ([vehicleId, route]) => {
      const phaseMs = VEHICLE_PHASE_MS[vehicleId] ?? 0;
      const pos = computePosition(route, nowMs, phaseMs);

      // Update Vehicle position
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          latitude:  pos.latitude,
          longitude: pos.longitude,
          lastSeenAt: now,
          status: "active",
        },
      });

      // Append LocationHistory ping (raw SQL — no transaction)
      await prisma.$executeRawUnsafe(
        `INSERT INTO "LocationHistory" (id,"vehicleId",latitude,longitude,speed,heading,"recordedAt") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        randomUUID(), vehicleId, pos.latitude, pos.longitude, pos.speed, pos.heading, now
      );

      return { vehicleId, ...pos };
    });

    await Promise.all(updates);

    // Return updated vehicle list (same shape as GET /api/vehicles)
    const accesses = await prisma.vehicleAccess.findMany({
      where: { userId: session.user.id },
      include: { vehicle: true },
    });
    const vehicles = accesses.map((a) => ({ ...a.vehicle, userRole: a.role }));

    return Response.json({ data: vehicles, error: null });
  } catch (e) {
    console.error("[POST /api/simulate/tick]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
