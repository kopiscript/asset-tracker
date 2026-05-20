import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg } from "@/lib/permissions";

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
