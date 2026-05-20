import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg, getOrgRole } from "@/lib/permissions";

// GET /api/orgs/[id]/members — list members (any org member can view)
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/members">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  if (!isAdmin && !(await getOrgRole(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    const members = await prisma.orgMember.findMany({
      where: { orgId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        userName: m.user.name,
        userEmail: m.user.email,
        isCurrentUser: m.userId === dbUser.id,
        joinedAt: m.createdAt.toISOString(),
      })),
      error: null,
    });
  } catch (e) {
    console.error("[GET /api/orgs/[id]/members]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/orgs/[id]/members — add a user by email (owner only)
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/members">
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageOrg(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string; userId?: string; role?: string };
  try { body = await request.json(); } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const role = body.role ?? "viewer";
  if (!["owner", "admin", "viewer"].includes(role)) {
    return Response.json({ data: null, error: "Role must be owner, admin, or viewer." }, { status: 400 });
  }

  let targetUser: { id: string } | null = null;
  if (body.userId) {
    targetUser = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
  } else if (body.email) {
    targetUser = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } });
    if (!targetUser) {
      return Response.json({ data: null, error: "No account found with that email." }, { status: 404 });
    }
  } else {
    return Response.json({ data: null, error: "Provide email or userId." }, { status: 400 });
  }
  if (!targetUser) return Response.json({ data: null, error: "User not found." }, { status: 404 });

  try {
    const member = await prisma.orgMember.upsert({
      where: { userId_orgId: { userId: targetUser.id, orgId: id } },
      update: { role },
      create: { userId: targetUser.id, orgId: id, role },
    });
    return Response.json({ data: { id: member.id, userId: member.userId, role: member.role }, error: null }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/orgs/[id]/members]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
