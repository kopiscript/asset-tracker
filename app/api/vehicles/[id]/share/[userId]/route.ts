/**
 * app/api/vehicles/[id]/share/[userId]/route.ts
 * DELETE — remove a user's access to a vehicle (owner only)
 */
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canShare } from "@/lib/permissions";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/share/[userId]">
) {
  const { id, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const allowed = await canShare(dbUser.id, id);
  if (!allowed) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });

  const target = await prisma.vehicleAccess.findUnique({
    where: { vehicleId_userId: { vehicleId: id, userId: targetUserId } },
  });
  if (target?.role === "owner") {
    return Response.json(
      { data: null, error: "Cannot remove the vehicle owner." },
      { status: 400 }
    );
  }

  await prisma.vehicleAccess.delete({
    where: { vehicleId_userId: { vehicleId: id, userId: targetUserId } },
  });

  return Response.json({ data: { userId: targetUserId }, error: null });
}
