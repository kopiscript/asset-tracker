/**
 * app/api/vehicles/[id]/share/route.ts
 * GET  — list all users with access to this vehicle (owner only)
 * POST — invite a user by email OR update an existing user's role (owner only)
 */
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canShare } from "@/lib/permissions";

// GET /api/vehicles/[id]/share
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/share">
) {
  const { id } = await ctx.params;
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const allowed = await canShare(dbUser.id, id);
  if (!allowed) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });

  const accesses = await prisma.vehicleAccess.findMany({
    where: { vehicleId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const data = accesses.map((a) => ({
    id: a.id,
    userId: a.userId,
    role: a.role,
    userName: a.user.name,
    userEmail: a.user.email,
    isCurrentUser: a.userId === dbUser.id,
  }));

  return Response.json({ data, error: null });
}

// POST /api/vehicles/[id]/share
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/share">
) {
  const { id } = await ctx.params;
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const allowed = await canShare(dbUser.id, id);
  if (!allowed) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });

  let body: { email?: string; userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }

  const role = body.role ?? "viewer";
  if (!["viewer", "editor"].includes(role)) {
    return Response.json(
      { data: null, error: "Role must be 'viewer' or 'editor'." },
      { status: 400 }
    );
  }

  // Resolve target user — either by email (invite) or userId (role change)
  let targetUser: { id: string } | null = null;

  if (body.userId) {
    targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true },
    });
  } else if (body.email) {
    targetUser = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (!targetUser) {
      return Response.json(
        { data: null, error: "No account found with that email. They must sign up first." },
        { status: 404 }
      );
    }
  } else {
    return Response.json(
      { data: null, error: "Provide either 'email' or 'userId'." },
      { status: 400 }
    );
  }

  if (!targetUser) {
    return Response.json({ data: null, error: "User not found." }, { status: 404 });
  }

  // Don't allow changing the owner's role
  const existing = await prisma.vehicleAccess.findUnique({
    where: { vehicleId_userId: { vehicleId: id, userId: targetUser.id } },
  });
  if (existing?.role === "owner") {
    return Response.json(
      { data: null, error: "Cannot change the owner's role." },
      { status: 400 }
    );
  }

  // Upsert the access record
  const access = await prisma.vehicleAccess.upsert({
    where: { vehicleId_userId: { vehicleId: id, userId: targetUser.id } },
    update: { role },
    create: { vehicleId: id, userId: targetUser.id, role },
  });

  return Response.json({ data: access, error: null }, { status: 200 });
}
