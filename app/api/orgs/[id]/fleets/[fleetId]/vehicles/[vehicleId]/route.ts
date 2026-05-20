import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageFleet } from "@/lib/permissions";

// POST /api/orgs/[id]/fleets/[fleetId]/vehicles/[vehicleId] — add vehicle to fleet
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets/[fleetId]/vehicles/[vehicleId]">
) {
  const { fleetId, vehicleId } = await ctx.params;
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
    // Verify vehicle belongs to the same org as the fleet
    const [fleet, vehicle] = await Promise.all([
      prisma.fleet.findUnique({ where: { id: fleetId }, select: { orgId: true } }),
      prisma.vehicle.findUnique({ where: { id: BigInt(vehicleId) }, select: { orgId: true } }),
    ]);

    if (!fleet || !vehicle) {
      return Response.json({ data: null, error: "Not found." }, { status: 404 });
    }
    if (vehicle.orgId !== fleet.orgId) {
      return Response.json({ data: null, error: "Vehicle does not belong to this org." }, { status: 400 });
    }

    await prisma.fleetVehicle.create({ data: { fleetId, vehicleId: BigInt(vehicleId) } });
    return Response.json({ data: { fleetId, vehicleId }, error: null }, { status: 201 });
  } catch (e: unknown) {
    // Unique constraint = already in fleet
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return Response.json({ data: { fleetId, vehicleId }, error: null });
    }
    console.error("[POST /api/orgs/[id]/fleets/[fleetId]/vehicles/[vehicleId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/orgs/[id]/fleets/[fleetId]/vehicles/[vehicleId] — remove vehicle from fleet
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets/[fleetId]/vehicles/[vehicleId]">
) {
  const { fleetId, vehicleId } = await ctx.params;
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
    await prisma.fleetVehicle.delete({
      where: { fleetId_vehicleId: { fleetId, vehicleId: BigInt(vehicleId) } },
    });
    return Response.json({ data: { fleetId, vehicleId }, error: null });
  } catch (e) {
    console.error("[DELETE /api/orgs/[id]/fleets/[fleetId]/vehicles/[vehicleId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
