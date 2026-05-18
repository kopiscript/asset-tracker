/**
 * app/api/vehicles/[id]/route.ts
 * GET    — get one vehicle (requires view access)
 * PATCH  — update vehicle details (requires edit access)
 * DELETE — delete vehicle (requires owner access)
 */
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canView, canEdit, canDelete } from "@/lib/permissions";
import { deriveStatus } from "@/lib/status";

// GET /api/vehicles/[id]
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  try {
    const allowed = await canView(dbUser.id, id);
    if (!allowed) return Response.json({ data: null, error: "Not found" }, { status: 404 });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: BigInt(id) },
      include: {
        owner: { select: { name: true, email: true } },
        telemetryRecords: {
          orderBy: { timestampUtc: "desc" },
          take: 1,
          select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
        },
      },
    });
    if (!vehicle) return Response.json({ data: null, error: "Not found" }, { status: 404 });

    const latest = vehicle.telemetryRecords[0] ?? null;
    return Response.json({
      data: {
        ...vehicle,
        id: vehicle.id.toString(),
        latitude: latest?.latitude ?? null,
        longitude: latest?.longitude ?? null,
        lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
        speed: latest?.speedKmh ?? null,
        status: deriveStatus(vehicle.isActive, latest?.timestampUtc ?? null),
        telemetryRecords: undefined,
      },
      error: null,
    });
  } catch (e) {
    console.error("[GET /api/vehicles/[id]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// PATCH /api/vehicles/[id]
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  const allowed = await canEdit(dbUser.id, id);
  if (!allowed) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    type UpdateData = Parameters<typeof prisma.vehicle.update>[0]["data"];
    const data: UpdateData = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.plateNumber === "string") data.plateNumber = body.plateNumber.toUpperCase();
    if (typeof body.type === "string") data.type = body.type;
    if (body.driverName !== undefined) data.driverName = (body.driverName as string | null);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const updated = await prisma.vehicle.update({ where: { id: BigInt(id) }, data });
    return Response.json({ data: { ...updated, id: updated.id.toString() }, error: null });
  } catch (e) {
    console.error("[PATCH /api/vehicles/[id]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/vehicles/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  const allowed = await canDelete(dbUser.id, id);
  if (!allowed) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.vehicle.delete({ where: { id: BigInt(id) } });
    return Response.json({ data: { id }, error: null });
  } catch (e) {
    console.error("[DELETE /api/vehicles/[id]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
