/**
 * app/api/invite/[token]/route.ts
 * GET  — verify an invite token and return its details (for the invite page).
 * POST — accept the invite (requires the caller to be signed in as the invited email).
 *
 * Tokens travel in the URL as raw hex; only their SHA-256 hash is stored in DB.
 */
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// GET /api/invite/[token] — return invite details
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/invite/[token]">
) {
  const { token } = await ctx.params;
  const hashedToken = hashToken(token);

  try {
    const invite = await prisma.orgInvite.findUnique({
      where: { token: hashedToken },
      include: {
        org: { select: { name: true } },
        inviter: { select: { name: true } },
      },
    });

    if (!invite) {
      return Response.json({ data: null, error: "Invite not found." }, { status: 404 });
    }
    if (invite.acceptedAt) {
      return Response.json(
        { data: { status: "accepted", orgName: invite.org.name }, error: null },
        { status: 200 }
      );
    }
    if (invite.expiresAt < new Date()) {
      return Response.json(
        { data: { status: "expired", inviterName: invite.inviter.name }, error: null },
        { status: 200 }
      );
    }

    return Response.json({
      data: {
        status: "valid",
        orgName: invite.org.name,
        inviterName: invite.inviter.name,
        role: invite.role,
        email: invite.email,
      },
      error: null,
    });
  } catch (e) {
    console.error("[GET /api/invite/[token]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/invite/[token] — accept the invite
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/invite/[token]">
) {
  if (!(await rateLimit("invite-accept", clientIp(req), 20, "60 s"))) {
    return Response.json({ data: null, error: "Too many requests" }, { status: 429 });
  }

  const { token } = await ctx.params;
  const hashedToken = hashToken(token);

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invite = await prisma.orgInvite.findUnique({
      where: { token: hashedToken },
      select: { id: true, email: true, orgId: true, role: true, acceptedAt: true, expiresAt: true },
    });

    if (!invite || invite.expiresAt < new Date()) {
      return Response.json({ data: null, error: "This invite is invalid or has expired." }, { status: 410 });
    }
    if (invite.acceptedAt) {
      return Response.json({ data: { orgId: invite.orgId }, error: null }, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });
    if (!dbUser) {
      return Response.json({ data: null, error: "User not found." }, { status: 404 });
    }

    // The signed-in user's email must match the invited email.
    if (dbUser.email.toLowerCase() !== invite.email.toLowerCase()) {
      return Response.json(
        { data: null, error: "This invite is for a different email address." },
        { status: 403 }
      );
    }

    // Create membership for the clicked invite (seenWelcomeAt stays null → triggers welcome).
    // Ignore unique-constraint errors: a concurrent request already created the row.
    await prisma.orgMember.create({
      data: { userId: dbUser.id, orgId: invite.orgId, role: invite.role },
    }).catch(() => {});
    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return Response.json({ data: { orgId: invite.orgId }, error: null }, { status: 200 });
  } catch (e) {
    console.error("[POST /api/invite/[token]]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
