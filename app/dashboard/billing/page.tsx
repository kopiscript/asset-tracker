import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, PLANS, type PlanKey } from "@/lib/plans";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Billing — Mirae Fleet" };

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
        <p className="text-muted-foreground text-sm">No organisation found on your account.</p>
      </div>
    );
  }

  const plan = getPlan(org.plan);
  const planLabel = PLAN_LABELS[org.plan] ?? org.plan;

  const now = new Date();
  const isGrace = org.gracePeriodEndsAt && org.gracePeriodEndsAt > now;
  const isExpired = org.planExpiresAt && org.planExpiresAt < now;

  const vehicleCount = await prisma.vehicle.count({
    where: { orgId: org.id, isActive: true },
  });

  // Plans this org can upgrade to (only plans with a price)
  const upgradeTargets: PlanKey[] = [];
  if (org.plan === "free") upgradeTargets.push("personal", "growth");
  if (org.plan === "personal") upgradeTargets.push("growth");

  // Can renew if currently on a paid plan
  const canRenew =
    org.plan !== "free" &&
    org.plan !== "enterprise" &&
    PLANS[org.plan as PlanKey]?.priceRm !== null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription for {org.name}</p>
      </div>

      {/* Grace period warning */}
      {isGrace && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Payment overdue</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Grace period ends{" "}
              {org.gracePeriodEndsAt!.toLocaleDateString("en-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Dashboard will be locked after that date.
            </p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Current plan
            </p>
            <p className="text-2xl font-bold text-foreground">{planLabel}</p>
            {plan.priceRm !== null && plan.priceRm > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">RM {plan.priceRm} / month</p>
            )}
          </div>
          {isExpired && !isGrace ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium px-3 py-1">
              <AlertTriangle className="h-3 w-3" /> Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1">
              <CheckCircle className="h-3 w-3" /> Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Vehicles"
            value={`${vehicleCount} / ${plan.vehicleLimit === Infinity ? "∞" : plan.vehicleLimit}`}
            warn={vehicleCount >= plan.vehicleLimit}
          />
          <Stat
            label="Ping rate"
            value={plan.rateWindow === "1 m" ? "1 / min" : "1 / 10 sec"}
          />
        </div>

        {org.planExpiresAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-4">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            Renews{" "}
            {org.planExpiresAt.toLocaleDateString("en-MY", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
      </div>

      {/* Actions — only org owners can change the plan */}
      <div className="space-y-3">
        {!isOwner && (
          <p className="text-xs text-muted-foreground text-center py-1">
            Only the org owner can manage billing.
          </p>
        )}

        {/* Upgrade to a higher paid plan */}
        {isOwner && upgradeTargets.map((target) => {
          const targetDef = PLANS[target];
          return (
            <a
              key={target}
              href={`/api/billing/start?plan=${target}`}
              className="flex w-full items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-3 hover:bg-primary/90 transition-colors"
            >
              Upgrade to {PLAN_LABELS[target]}
              {targetDef.priceRm !== null && ` — RM ${targetDef.priceRm}/mo`}
            </a>
          );
        })}

        {/* Fleet / Enterprise — contact us */}
        {isOwner && (org.plan === "growth" || org.plan === "fleet") && (
          <a
            href="mailto:support@miraefleet.app?subject=Fleet Plan Inquiry"
            className="flex w-full items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-3 hover:bg-primary/90 transition-colors"
          >
            Contact us to upgrade
          </a>
        )}

        {/* Renew current paid plan */}
        {isOwner && canRenew && (
          <a
            href={`/api/billing/start?plan=${org.plan}`}
            className="flex w-full items-center justify-center rounded-xl border border-border text-sm font-medium px-5 py-3 hover:bg-muted transition-colors"
          >
            Renew {planLabel}
            {plan.priceRm !== null && ` — RM ${plan.priceRm}/mo`}
          </a>
        )}

        <a
          href="mailto:support@miraefleet.app?subject=Billing Enquiry"
          className="flex w-full items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Billing enquiry
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/40 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${warn ? "text-amber-600" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
