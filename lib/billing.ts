/**
 * lib/billing.ts
 * Shared subscription activation, used by both the Billplz webhook (async,
 * server-to-server) and the post-payment return handler (synchronous, so the
 * user is unlocked the moment they land back — without waiting on the webhook).
 */
import { prisma } from "@/lib/prisma";

const PLAN_DAYS = 31;
export const VALID_PLANS = new Set(["personal", "growth", "fleet", "enterprise"]);

/**
 * Activates an org's plan for PLAN_DAYS from now. Idempotent — calling it twice
 * for the same payment (webhook + return handler) just re-sets the same state.
 */
export async function activateOrgPlan(
  orgId: string,
  planRaw: string,
  billId: string | null
): Promise<{ plan: string; planExpiresAt: Date }> {
  const plan = VALID_PLANS.has(planRaw) ? planRaw : "personal";
  const planExpiresAt = new Date(Date.now() + PLAN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      planExpiresAt,
      gracePeriodEndsAt: null,
      ...(billId ? { billplzSubId: billId } : {}),
    },
  });
  return { plan, planExpiresAt };
}
