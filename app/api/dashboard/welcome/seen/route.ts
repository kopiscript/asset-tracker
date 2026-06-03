/**
 * POST /api/dashboard/welcome/seen
 * Marks the current user's first unseen OrgMember welcome as seen, so the
 * dashboard layout stops redirecting them to /dashboard/welcome.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const member = await prisma.orgMember.findFirst({
      where: { userId: session.user.id, seenWelcomeAt: null },
      select: { id: true },
    });
    if (member) {
      await prisma.orgMember.update({
        where: { id: member.id },
        data: { seenWelcomeAt: new Date() },
      });
    }
    return Response.json({ data: { ok: true }, error: null });
  } catch (e) {
    console.error("[POST /api/dashboard/welcome/seen]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
