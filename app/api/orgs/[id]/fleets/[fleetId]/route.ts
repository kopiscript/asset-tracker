import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageFleet } from "@/lib/permissions";

// PATCH /api/orgs/[id]/fleets/[fleetId] — rename fleet (owner only)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets/[fleetId]">
) {
  const { fleetId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageFleet(dbUser.id, fleetId))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ data: null, error: "Name is required." }, { status: 400 });
  }

  try {
    const fleet = await prisma.fleet.update({ where: { id: fleetId }, data: { name: body.name.trim() } });
    return Response.json({ data: { id: fleet.id, name: fleet.name }, error: null });
  } catch (e) {
    console.error("[PATCH /api/orgs/[id]/fleets/[fleetId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/orgs/[id]/fleets/[fleetId] — delete a fleet (owner only)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/fleets/[fleetId]">
) {
  const { fleetId } = await ctx.params;
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
    await prisma.fleet.delete({ where: { id: fleetId } });
    return Response.json({ data: { id: fleetId }, error: null });
  } catch (e) {
    console.error("[DELETE /api/orgs/[id]/fleets/[fleetId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
