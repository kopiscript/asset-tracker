/**
 * GET /api/billing/return — where Billplz sends the user's browser after the
 * payment page (the bill's redirect_url).
 *
 * Billplz appends billplz[id] and billplz[paid] to this URL. We don't trust
 * those alone — we re-fetch the bill from the Billplz API with our own key and,
 * if it's genuinely paid, activate the org plan immediately. This unlocks the
 * user the moment they return, instead of leaving them gated on /billing/activate
 * while waiting for (or because of a misconfigured) webhook. The webhook remains
 * the source of truth for later subscription state changes.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getBill } from "@/lib/billplz";
import { activateOrgPlan } from "@/lib/billing";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const planParam = url.searchParams.get("plan") ?? "";
  const billId = url.searchParams.get("billplz[id]");

  if (!billId) {
    return NextResponse.redirect(`${origin}/billing/activate`);
  }

  try {
    const bill = await getBill(billId);

    if (!bill.paid) {
      // Cancelled or failed at the payment page.
      return NextResponse.redirect(`${origin}/billing/activate?error=payment`);
    }

    if (bill.reference1) {
      await activateOrgPlan(bill.reference1, bill.reference2 ?? planParam, billId);
    }

    return NextResponse.redirect(
      `${origin}/onboarding/setup?plan=${bill.reference2 ?? planParam}`
    );
  } catch (err) {
    console.error("[billing/return] failed:", err);
    // The webhook may still activate the plan; send them to the dashboard, which
    // routes correctly once the plan is set (and to /billing/activate if not).
    return NextResponse.redirect(`${origin}/dashboard`);
  }
}
