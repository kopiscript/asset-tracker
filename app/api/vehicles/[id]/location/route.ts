/**
 * app/api/vehicles/[id]/location/route.ts
 * PATCH — update the GPS coordinates of a vehicle.
 * This endpoint is designed for GPS hardware / IoT devices to call.
 *
 * Body: { latitude: number, longitude: number }
 *
 * Authentication: uses the same Clerk session. For real GPS hardware
 * you would use a separate API key system — add that here when ready.
 * ✏️ EDIT: Add API key authentication here for GPS hardware integration.
 */
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/location">
) {
  const { id } = await ctx.params;
  const { userId } = await auth();
  if (!userId) {
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
      status: "active", // GPS ping means vehicle is active
    },
    select: { id: true, latitude: true, longitude: true, lastSeenAt: true, status: true },
  });

  return Response.json({ data: updated, error: null });
}
