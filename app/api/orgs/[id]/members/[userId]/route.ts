import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg } from "@/lib/permissions";

// PATCH /api/orgs/[id]/members/[userId] — change a member's role (owner only)
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/members/[userId]">
) {
  const { id, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageOrg(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  if (targetUserId === dbUser.id) {
    return Response.json({ data: null, error: "Cannot change your own role." }, { status: 400 });
  }

  let body: { role?: string };
  try { body = await request.json(); } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  const role = body.role;
  if (!role || !["owner", "admin", "viewer"].includes(role)) {
    return Response.json({ data: null, error: "Role must be owner, admin, or viewer." }, { status: 400 });
  }

  const target = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: targetUserId, orgId: id } },
  });
  if (!target) return Response.json({ data: null, error: "Member not found." }, { status: 404 });

  // Guard: can't demote the last owner
  if (target.role === "owner" && role !== "owner") {
    const ownerCount = await prisma.orgMember.count({ where: { orgId: id, role: "owner" } });
    if (ownerCount <= 1) {
      return Response.json(
        { data: null, error: "Cannot demote the last owner of an org." },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await prisma.orgMember.update({
      where: { userId_orgId: { userId: targetUserId, orgId: id } },
      data: { role },
    });
    return Response.json({ data: { userId: targetUserId, role: updated.role }, error: null });
  } catch (e) {
    console.error("[PATCH /api/orgs/[id]/members/[userId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/orgs/[id]/members/[userId] — remove a member (owner only)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/members/[userId]">
) {
  const { id, userId: targetUserId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageOrg(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  // Cannot remove the last owner
  const target = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: targetUserId, orgId: id } },
  });
  if (target?.role === "owner") {
    const ownerCount = await prisma.orgMember.count({ where: { orgId: id, role: "owner" } });
    if (ownerCount <= 1) {
      return Response.json(
        { data: null, error: "Cannot remove the last owner of an org." },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.orgMember.delete({ where: { userId_orgId: { userId: targetUserId, orgId: id } } });
    return Response.json({ data: { userId: targetUserId }, error: null });
  } catch (e) {
    console.error("[DELETE /api/orgs/[id]/members/[userId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
