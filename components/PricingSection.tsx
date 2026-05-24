"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Cpu, ArrowRight, Zap } from "lucide-react";

const PRICES = {
  starter: { monthly: 49,  annual: 490  },
  growth:  { monthly: 99,  annual: 990  },
  fleet:   { monthly: 199, annual: 1990 },
} as const;

type PlanKey = keyof typeof PRICES;

const INCLUDED = [
  "Live GPS tracking",
  "Free OpenStreetMap tiles",
  "Role-based access control",
  "Driver management",
  "Trip history",
  "Vehicle health stats",
  "Bahasa Malaysia UI",
  "Email support",
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  function price(key: PlanKey) {
    return isAnnual ? Math.round(PRICES[key].annual / 12) : PRICES[key].monthly;
  }

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Pricing
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground max-w-[16ch] leading-tight">
              One device.<br />Your fleet, your scale.
            </h2>
            <p className="text-muted-foreground text-sm max-w-[42ch] sm:text-right leading-relaxed">
              Buy the tracker once, then subscribe at your fleet size. Every feature included — we only charge for scale.
            </p>
          </div>
        </div>

        {/* ── Step 1: Hardware ─────────────────────────────────────────── */}
        <div className="relative mb-2">
          <span className="absolute -top-3 left-6 bg-background px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Step 1 — Hardware
          </span>
          <div className="bg-card border border-border/50 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none mb-1.5 flex flex-wrap items-center gap-2">
                GPS Tracking Device
                <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Required
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                One device per vehicle. Purchase hardware before activating any subscription plan.
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">RM 399</p>
                <p className="text-[11px] text-muted-foreground">per device, one-time</p>
              </div>
              <a
                href="mailto:support@miraefleet.app?subject=Hardware Purchase Inquiry"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors min-h-[44px]"
              >
                Order device <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Connector ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 my-5 px-2">
          <div className="flex-1 h-px bg-border/40" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
            Then choose a plan
          </p>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* ── Step 2 header + toggle ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Step 2 — Subscription
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted rounded-full p-1 border border-border/40">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                  !isAnnual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                  isAnnual
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
              </button>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 ${
                isAnnual
                  ? "text-green-600 bg-green-500/10 border-green-500/20"
                  : "text-transparent bg-transparent border-transparent select-none"
              }`}
            >
              2 months free
            </span>
          </div>
        </div>

        {/* ── Tier cards — asymmetric grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 mb-4">

          {/* Growth — dominant featured card */}
          <div className="relative bg-foreground rounded-2xl p-8 flex flex-col">
            <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6 self-start border border-primary/25">
              <Zap className="h-3 w-3" />
              Most Popular
            </div>
            <h3 className="font-display text-3xl sm:text-4xl text-white leading-none tracking-tight mb-1">
              Growth
            </h3>
            <p className="text-white/40 text-sm mb-8">4–15 vehicles</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-bold text-white tabular-nums leading-none">
                RM {price("growth")}
              </span>
              <span className="text-white/40 text-sm mb-1.5">/mo</span>
            </div>
            <p className={`text-xs mb-8 transition-all ${isAnnual ? "text-white/40" : "text-transparent select-none"}`}>
              billed RM {PRICES.growth.annual.toLocaleString()} annually
            </p>
            <div className="mt-auto">
              <Link
                href="/sign-up"
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-3.5 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Starter + Fleet stacked */}
          <div className="flex flex-col gap-4">

            <div className="flex-1 bg-card border border-border/50 rounded-2xl p-7 flex flex-col hover:border-primary/20 transition-colors group">
              <h3 className="font-display text-2xl text-foreground leading-none tracking-tight mb-1">Starter</h3>
              <p className="text-muted-foreground text-sm mb-5">1–3 vehicles</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-foreground tabular-nums leading-none">
                  RM {price("starter")}
                </span>
                <span className="text-muted-foreground text-sm mb-1">/mo</span>
              </div>
              <p className={`text-xs mb-5 transition-all ${isAnnual ? "text-muted-foreground" : "text-transparent select-none"}`}>
                billed RM {PRICES.starter.annual.toLocaleString()} annually
              </p>
              <Link
                href="/sign-up"
                className="w-full flex items-center justify-center text-sm font-semibold text-foreground border border-border/60 group-hover:border-primary/30 group-hover:text-primary py-3 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
              >
                Get Started
              </Link>
            </div>

            <div className="flex-1 bg-card border border-border/50 rounded-2xl p-7 flex flex-col hover:border-primary/20 transition-colors group">
              <h3 className="font-display text-2xl text-foreground leading-none tracking-tight mb-1">Fleet</h3>
              <p className="text-muted-foreground text-sm mb-5">16–50 vehicles</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-foreground tabular-nums leading-none">
                  RM {price("fleet")}
                </span>
                <span className="text-muted-foreground text-sm mb-1">/mo</span>
              </div>
              <p className={`text-xs mb-5 transition-all ${isAnnual ? "text-muted-foreground" : "text-transparent select-none"}`}>
                billed RM {PRICES.fleet.annual.toLocaleString()} annually
              </p>
              <Link
                href="/sign-up"
                className="w-full flex items-center justify-center text-sm font-semibold text-foreground border border-border/60 group-hover:border-primary/30 group-hover:text-primary py-3 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* ── Enterprise strip ─────────────────────────────────────────── */}
        <div className="border border-border/40 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground">Enterprise</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                51+ vehicles
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Custom contracts, SLA guarantees, dedicated account manager, and volume hardware pricing.
            </p>
          </div>
          <a
            href="mailto:support@miraefleet.app?subject=Enterprise Inquiry"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-foreground border border-border/60 hover:border-primary/40 hover:text-primary px-6 py-3 rounded-xl transition-colors active:scale-[0.98] min-h-[44px] shrink-0"
          >
            Talk to us <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* ── Included in every plan ───────────────────────────────────── */}
        <div className="mt-10 pt-8 border-t border-border/40">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-5">
            Included in every plan
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {INCLUDED.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
