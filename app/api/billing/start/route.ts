/**
 * GET /api/billing/start?plan=personal|growth
 *
 * Single entry point for all payment flows.
 * Uses auth() as a handler wrapper (NextAuth v5 pattern) so the session
 * is injected via request.auth — more reliable than auth() with no args
 * in route handlers where the async cookie context may not be available.
 *
 * - Signed out  → /sign-up?plan=X
 * - Signed in, no org → /dashboard
 * - Signed in, has org → create Billplz bill → redirect to payment page
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBill } from "@/lib/billplz";
import { PLANS, type PlanKey } from "@/lib/plans";
import { isValidEmail } from "@/lib/validation";

const PAYABLE_PLANS = new Set<string>(["personal", "growth"]);
const PLAN_LABELS: Record<string, string> = {
  personal: "Personal",
  growth: "Growth",
};

export const GET = auth(async function GET(request) {
  // When wrapped with auth(), the session lives on request.auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (request as any).auth as { user?: { id?: string } } | null;

  const url = new URL(request.url);
  const origin = url.origin;
  const plan = url.searchParams.get("plan");

  if (!plan || !PAYABLE_PLANS.has(plan)) {
    return NextResponse.redirect(`${origin}/#pricing`);
  }

  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/sign-up?plan=${plan}`);
  }

  const [user, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.orgMember.findFirst({
      where: { userId: session.user.id, role: "owner" },
      include: { org: true },
    }),
  ]);

  if (!user || !membership) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Billplz rejects bills with an invalid email (HTTP 422). Catch it here with
  // a clear message instead of a generic payment failure. New accounts can't
  // hit this — registration validates the email — but older ones might.
  if (!isValidEmail(user.email)) {
    return NextResponse.redirect(`${origin}/billing/activate?error=email`);
  }

  const planDef = PLANS[plan as PlanKey];
  if (!planDef || planDef.priceRm === null) {
    return NextResponse.redirect(`${origin}/dashboard/billing`);
  }

  // Use the domain the user is actually on — NOT a hardcoded canonical host.
  // Billplz returns the browser to redirect_url; if that's a different domain
  // than the one they paid from, the session cookie doesn't travel and they get
  // bounced to sign-in. Staying on `origin` keeps them logged in through the
  // whole round-trip.
  const appUrl = origin;

  try {
    const bill = await createBill({
      email: user.email,
      name: user.name,
      amountCents: planDef.priceRm * 100,
      description: `Mirae ${PLAN_LABELS[plan]} Plan — Monthly`,
      callbackUrl: `${appUrl}/api/billing/billplz`,
      redirectUrl: `${appUrl}/api/billing/return?plan=${plan}`,
      reference1: membership.org.id,
      reference2: plan,
    });

    return NextResponse.redirect(bill.url);
  } catch (err) {
    console.error("[billing/start] createBill failed:", err);
    // Surface the failure on the plan picker instead of bouncing to
    // /dashboard/billing, which the dashboard layout redirects straight back
    // to /billing/activate — an invisible loop that looks like being "stuck".
    return NextResponse.redirect(`${origin}/billing/activate?error=payment`);
  }
});
