/**
 * POST /api/onboarding/skip
 * Marks the current owner's first owned org as having skipped the setup
 * checklist, so /onboarding/setup stops showing it.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const membership = await prisma.orgMember.findFirst({
      where: { userId: session.user.id, role: "owner" },
      orderBy: { createdAt: "asc" },
      select: { orgId: true },
    });
    if (!membership) {
      return Response.json({ data: null, error: "No owned organization found." }, { status: 404 });
    }

    await prisma.organization.update({
      where: { id: membership.orgId },
      data: { onboardingSkippedAt: new Date() },
    });

    return Response.json({ data: { ok: true }, error: null });
  } catch (e) {
    console.error("[POST /api/onboarding/skip]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
