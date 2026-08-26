"use client";

import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import type { PlanKey } from "@/lib/plans";

interface UpgradeTarget {
  key: PlanKey;
  label: string;
  priceRm: number | null;
}

interface BillingClientProps {
  orgName: string;
  planLabel: string;
  priceRm: number | null;
  isExpired: boolean;
  isGrace: boolean;
  gracePeriodEndsAt: string | null;
  planExpiresAt: string | null;
  vehicleCount: number;
  vehicleLimitLabel: string;
  vehicleLimitWarn: boolean;
  pingRateLabel: "min" | "10sec";
  isOwner: boolean;
  upgradeTargets: UpgradeTarget[];
  showContactUpgrade: boolean;
  canRenew: boolean;
  currentPlan: string;
  currentPlanPriceRm: number | null;
}

export function BillingClient({
  orgName,
  planLabel,
  priceRm,
  isExpired,
  isGrace,
  gracePeriodEndsAt,
  planExpiresAt,
  vehicleCount,
  vehicleLimitLabel,
  vehicleLimitWarn,
  pingRateLabel,
  isOwner,
  upgradeTargets,
  showContactUpgrade,
  canRenew,
  currentPlan,
  currentPlanPriceRm,
}: BillingClientProps) {
  const { tr, lang } = useLang();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{tr("billing")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tr("billingSubtitle").replace("{name}", orgName)}
        </p>
      </div>

      {isGrace && gracePeriodEndsAt && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-200">{tr("paymentOverdue")}</p>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {tr("gracePeriodEnds").replace("{date}", formatDate(gracePeriodEndsAt))}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {tr("currentPlanLabel")}
            </p>
            <p className="text-2xl font-bold text-foreground">{planLabel}</p>
            {priceRm !== null && priceRm > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">RM {priceRm} {tr("perMonth")}</p>
            )}
          </div>
          {isExpired && !isGrace ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium px-3 py-1">
              <AlertTriangle className="h-3 w-3" /> {tr("planExpired")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium px-3 py-1">
              <CheckCircle className="h-3 w-3" /> {tr("planActive")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={tr("vehicles")} value={vehicleLimitLabel} warn={vehicleLimitWarn} />
          <Stat label={tr("statPingRate")} value={pingRateLabel === "min" ? tr("perMin") : tr("per10Sec")} />
        </div>

        {planExpiresAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-4">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {tr("renewsOn").replace("{date}", formatDate(planExpiresAt))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {!isOwner && (
          <p className="text-xs text-muted-foreground text-center py-1">{tr("ownerOnlyBilling")}</p>
        )}

        {isOwner && upgradeTargets.map((target) => (
          <a
            key={target.key}
            href={`/api/billing/start?plan=${target.key}`}
            className="flex w-full items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-3 hover:bg-primary/90 transition-colors"
          >
            {tr("upgradeTo").replace("{plan}", target.label)}
            {target.priceRm !== null && ` · RM ${target.priceRm}/mo`}
          </a>
        ))}

        {isOwner && showContactUpgrade && (
          <a
            href="mailto:support@mirae.azmiproductions.com?subject=Fleet Plan Inquiry"
            className="flex w-full items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-3 hover:bg-primary/90 transition-colors"
          >
            {tr("contactUpgrade")}
          </a>
        )}

        {isOwner && canRenew && (
          <a
            href={`/api/billing/start?plan=${currentPlan}`}
            className="flex w-full items-center justify-center rounded-xl border border-border text-sm font-medium px-5 py-3 hover:bg-muted transition-colors"
          >
            {tr("renewPlan").replace("{plan}", planLabel)}
            {currentPlanPriceRm !== null && ` · RM ${currentPlanPriceRm}/mo`}
          </a>
        )}

        <a
          href="mailto:support@mirae.azmiproductions.com?subject=Billing Enquiry"
          className="flex w-full items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          {tr("billingEnquiry")}
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/40 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${warn ? "text-amber-400" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
