import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg } from "@/lib/permissions";

// DELETE /api/orgs/[id]/invites/[inviteId] — revoke a pending invite (owner only)
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/orgs/[id]/invites/[inviteId]">
) {
  const { id, inviteId } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  if (!(await canManageOrg(dbUser.id, id))) {
    return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
  }

  try {
    const invite = await prisma.orgInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.orgId !== id) {
      return Response.json({ data: null, error: "Invite not found." }, { status: 404 });
    }

    await prisma.orgInvite.delete({ where: { id: inviteId } });
    return Response.json({ data: { id: inviteId }, error: null });
  } catch (e) {
    console.error("[DELETE /api/orgs/[id]/invites/[inviteId]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
