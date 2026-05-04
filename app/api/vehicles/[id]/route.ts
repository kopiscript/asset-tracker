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

  const allowed = await canView(dbUser.id, id);
  if (!allowed) {
    return Response.json({ data: null, error: "Not found" }, { status: 404 });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    return Response.json({ data: null, error: "Not found" }, { status: 404 });
  }

  return Response.json({ data: vehicle, error: null });
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

  type UpdateData = Parameters<typeof prisma.vehicle.update>[0]["data"];
  const data: UpdateData = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.plateNumber === "string") data.plateNumber = body.plateNumber.toUpperCase();
  if (typeof body.type === "string") data.type = body.type;
  if (typeof body.status === "string") data.status = body.status;
  if (body.fuelLevel !== undefined) data.fuelLevel = typeof body.fuelLevel === "number" ? body.fuelLevel : null;
  if (body.mileage !== undefined) data.mileage = typeof body.mileage === "number" ? body.mileage : null;
  if (body.driverName !== undefined) data.driverName = (body.driverName as string | null);
  if (body.notes !== undefined) data.notes = (body.notes as string | null);
  if (body.imageUrl !== undefined) data.imageUrl = (body.imageUrl as string | null);
  if (body.latitude !== undefined) data.latitude = typeof body.latitude === "number" ? body.latitude : null;
  if (body.longitude !== undefined) data.longitude = typeof body.longitude === "number" ? body.longitude : null;
  if (body.latitude != null) data.lastSeenAt = new Date();

  const updated = await prisma.vehicle.update({ where: { id }, data });

  return Response.json({ data: updated, error: null });
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

  await prisma.vehicle.delete({ where: { id } });
  return Response.json({ data: { id }, error: null });
}
