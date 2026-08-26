import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, PLANS, type PlanKey } from "@/lib/plans";
import { BillingClient } from "./BillingClient";
import { PageTitle } from "@/components/dashboard/PageTitle";

export const metadata = { title: "Billing · Mirae Fleet" };

const PLAN_LABELS: Record<string, string> = {
  free: "No active plan",
  personal: "Personal",
  growth: "Growth",
  fleet: "Fleet",
  enterprise: "Enterprise",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Any membership shows plan info — upgrade actions are gated to owners below
  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  const org = membership?.org;
  const isOwner = membership?.role === "owner";

  if (!org) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <NoOrgFound />
      </div>
    );
  }

  const plan = getPlan(org.plan);
  const planLabel = PLAN_LABELS[org.plan] ?? org.plan;

  const now = new Date();
  const isGrace = Boolean(org.gracePeriodEndsAt && org.gracePeriodEndsAt > now);
  const isExpired = Boolean(org.planExpiresAt && org.planExpiresAt < now);

  const vehicleCount = await prisma.vehicle.count({
    where: { orgId: org.id, isActive: true },
  });

  // Plans this org can upgrade to (only plans with a price)
  const upgradeTargetKeys: PlanKey[] = [];
  if (org.plan === "free") upgradeTargetKeys.push("personal", "growth");
  if (org.plan === "personal") upgradeTargetKeys.push("growth");

  // Can renew if currently on a paid plan
  const canRenew =
    org.plan !== "free" &&
    org.plan !== "enterprise" &&
    PLANS[org.plan as PlanKey]?.priceRm !== null;

  return (
    <BillingClient
      orgName={org.name}
      planLabel={planLabel}
      priceRm={plan.priceRm}
      isExpired={isExpired}
      isGrace={isGrace}
      gracePeriodEndsAt={org.gracePeriodEndsAt?.toISOString() ?? null}
      planExpiresAt={org.planExpiresAt?.toISOString() ?? null}
      vehicleCount={vehicleCount}
      vehicleLimitLabel={`${vehicleCount} / ${plan.vehicleLimit === Infinity ? "∞" : plan.vehicleLimit}`}
      vehicleLimitWarn={vehicleCount >= plan.vehicleLimit}
      pingRateLabel={plan.rateWindow === "1 m" ? "min" : "10sec"}
      isOwner={isOwner}
      upgradeTargets={upgradeTargetKeys.map((key) => ({
        key,
        label: PLAN_LABELS[key],
        priceRm: PLANS[key].priceRm,
      }))}
      showContactUpgrade={isOwner && (org.plan === "growth" || org.plan === "fleet")}
      canRenew={canRenew}
      currentPlan={org.plan}
      currentPlanPriceRm={plan.priceRm}
    />
  );
}

function NoOrgFound() {
  return <p className="text-muted-foreground text-sm"><PageTitle k="noOrgFound" /></p>;
}
