import crypto from "crypto";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageOrg, getOrgRole } from "@/lib/permissions";
import { sendInviteEmail, sendInviteNotificationEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/validation";

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

  // Resolve the target user (by explicit userId, or look up by email — may be null)
  let targetUser: { id: string; email: string } | null = null;
  let targetEmail: string | null = null;
  if (body.userId) {
    targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, email: true },
    });
    if (!targetUser) return Response.json({ data: null, error: "User not found." }, { status: 404 });
    targetEmail = targetUser.email;
  } else if (body.email) {
    targetEmail = body.email.trim().toLowerCase();
    if (!targetEmail) {
      return Response.json({ data: null, error: "Provide email or userId." }, { status: 400 });
    }
    if (!isValidEmail(targetEmail)) {
      return Response.json({ data: null, error: "Please enter a valid email address." }, { status: 400 });
    }
    targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true, email: true },
    });
  } else {
    return Response.json({ data: null, error: "Provide email or userId." }, { status: 400 });
  }

  // Org name + inviter name for emails
  const org = await prisma.organization.findUnique({ where: { id }, select: { name: true } });
  if (!org) return Response.json({ data: null, error: "Organization not found." }, { status: 404 });

  try {
    // ── Case A: user exists ─────────────────────────────────────────────────
    if (targetUser) {
      const existing = await prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: targetUser.id, orgId: id } },
        select: { id: true },
      });

      if (existing) {
        // Already a member → just update the role. No invite, no email.
        const member = await prisma.orgMember.update({
          where: { id: existing.id },
          data: { role },
        });
        return Response.json(
          { data: { id: member.id, userId: member.userId, role: member.role, status: "updated" }, error: null },
          { status: 200 }
        );
      }

      // Not a member yet → add directly + notify (they already have an account).
      const member = await prisma.orgMember.create({
        data: { userId: targetUser.id, orgId: id, role },
      });
      try {
        await sendInviteNotificationEmail({
          to: targetUser.email,
          orgName: org.name,
          inviterName: dbUser.name,
          role,
        });
      } catch (mailErr) {
        console.error("[POST /api/orgs/[id]/members] notification email failed", mailErr);
      }
      return Response.json(
        { data: { id: member.id, userId: member.userId, role: member.role, status: "added" }, error: null },
        { status: 201 }
      );
    }

    // ── Case B: no account → create/refresh an invite + send invite email ────
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Preserve acceptedAt if the invite was previously accepted (e.g. user
    // registered then their account was deleted). For a genuinely pending
    // invite, acceptedAt is already null so omitting it is safe.
    const invite = await prisma.orgInvite.upsert({
      where: { email_orgId: { email: targetEmail!, orgId: id } },
      update: { role, token: hashedToken, invitedBy: dbUser.id, expiresAt },
      create: { email: targetEmail!, orgId: id, role, token: hashedToken, invitedBy: dbUser.id, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mirae.azmiproductions.com";
    try {
      await sendInviteEmail({
        to: targetEmail!,
        orgName: org.name,
        inviterName: dbUser.name,
        role,
        inviteUrl: `${appUrl}/invite/${rawToken}`,
      });
    } catch (mailErr) {
      console.error("[POST /api/orgs/[id]/members] invite email failed", mailErr);
    }

    return Response.json(
      { data: { id: invite.id, email: invite.email, role: invite.role, status: "invited" }, error: null },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/orgs/[id]/members]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
