/**
 * app/api/vehicles/[id]/location/route.ts
 * PATCH — update the GPS coordinates of a vehicle.
 * Designed for GPS hardware / IoT devices to call.
 *
 * Body: { latitude: number, longitude: number }
 *
 * ✏️ EDIT: Add API key authentication here for GPS hardware integration.
 */
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/location">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const allowed = await canEdit(dbUser.id, id);
  if (!allowed) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });

  let body: { latitude?: unknown; longitude?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return Response.json(
      { data: null, error: "latitude and longitude must be numbers." },
      { status: 400 }
    );
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      latitude: body.latitude,
      longitude: body.longitude,
      lastSeenAt: new Date(),
      status: "active",
    },
    select: { id: true, latitude: true, longitude: true, lastSeenAt: true, status: true },
  });

  return Response.json({ data: updated, error: null });
}
