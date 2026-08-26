/**
 * app/api/vehicles/[id]/geofences/[geofenceId]/route.ts
 * DELETE — remove a geofence (editor+ only)
 */
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/geofences/[geofenceId]">
) {
  const { id, geofenceId } = await ctx.params;
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
    const geofence = await prisma.geofence.findUnique({ where: { id: geofenceId } });
    if (!geofence || geofence.vehicleId !== BigInt(id)) {
      return Response.json({ data: null, error: "Not found" }, { status: 404 });
    }
    await prisma.geofence.delete({ where: { id: geofenceId } });
    return Response.json({ data: { id: geofenceId }, error: null });
  } catch (e) {
    console.error("[DELETE /api/vehicles/[id]/geofences/[geofenceId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
