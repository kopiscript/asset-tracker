/**
 * app/api/vehicles/[id]/emergency/route.ts
 * MIROS TrackScore additional item 2: panic/emergency button. No physical
 * hardware button exists on this platform, so this is the manager-facing
 * equivalent — logs an "emergency" tracking event using the vehicle's last
 * known position.
 */
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/emergency">
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

  try {
    const latest = await prisma.telemetryRecord.findFirst({
      where: { vehicleId: BigInt(id), latitude: { not: null }, longitude: { not: null } },
      orderBy: { timestampUtc: "desc" },
      select: { latitude: true, longitude: true, speedKmh: true },
    });

    const event = await prisma.trackingEvent.create({
      data: {
        vehicleId: BigInt(id),
        type: "emergency",
        occurredAt: new Date(),
        speedKmh: latest?.speedKmh ?? null,
        latitude: latest?.latitude ?? null,
        longitude: latest?.longitude ?? null,
        detail: `Reported by ${dbUser.name ?? dbUser.email}`,
      },
    });

    return Response.json({
      data: { ...event, id: event.id.toString(), vehicleId: event.vehicleId.toString() },
      error: null,
    });
  } catch (e) {
    console.error("[POST /api/vehicles/[id]/emergency]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
