/**
 * app/api/vehicles/[id]/geofences/route.ts
 * MIROS TrackScore item 4/5: circular geofences per vehicle.
 * GET  — list a vehicle's geofences (any role with view access)
 * POST — create a geofence (editor+ only)
 */
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canView, canEdit } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/geofences">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canView(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  const geofences = await prisma.geofence.findMany({
    where: { vehicleId: BigInt(id) },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    data: geofences.map((g) => ({ ...g, id: g.id, vehicleId: g.vehicleId.toString() })),
    error: null,
  });
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/geofences">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canEdit(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: unknown; centerLat?: unknown; centerLng?: unknown; radiusM?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const centerLat = typeof body.centerLat === "number" ? body.centerLat : NaN;
  const centerLng = typeof body.centerLng === "number" ? body.centerLng : NaN;
  const radiusM = typeof body.radiusM === "number" ? Math.round(body.radiusM) : NaN;

  if (!name) {
    return Response.json({ data: null, error: "Name is required." }, { status: 400 });
  }
  if (!Number.isFinite(centerLat) || centerLat < -90 || centerLat > 90) {
    return Response.json({ data: null, error: "Invalid latitude." }, { status: 400 });
  }
  if (!Number.isFinite(centerLng) || centerLng < -180 || centerLng > 180) {
    return Response.json({ data: null, error: "Invalid longitude." }, { status: 400 });
  }
  if (!Number.isFinite(radiusM) || radiusM < 50 || radiusM > 50_000) {
    return Response.json({ data: null, error: "Radius must be between 50 m and 50 km." }, { status: 400 });
  }

  try {
    const geofence = await prisma.geofence.create({
      data: { vehicleId: BigInt(id), name, centerLat, centerLng, radiusM },
    });
    return Response.json({
      data: { ...geofence, vehicleId: geofence.vehicleId.toString() },
      error: null,
    });
  } catch (e) {
    console.error("[POST /api/vehicles/[id]/geofences]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
