import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Check, MapPin, ArrowRight, ArrowLeft, Shield, Cpu, Zap } from "lucide-react";

const PLANS = {
  personal: {
    label: "Personal",
    price: 29,
    tagline: "For small operators tracking up to 3 vehicles.",
    vehicleLimit: 3,
    pingRate: "1 ping / min",
    features: [
      "Up to 3 active vehicles",
      "Live GPS map",
      "Full trip history",
      "Role-based team access",
      "Bahasa Malaysia UI",
      "Email support",
    ],
  },
  growth: {
    label: "Growth",
    price: 149,
    tagline: "For growing fleets that need faster position updates.",
    vehicleLimit: 20,
    pingRate: "1 ping / 10 sec",
    features: [
      "Up to 20 active vehicles",
      "10-second live updates",
      "Full trip history",
      "Role-based team access",
      "Bahasa Malaysia UI",
      "Priority support",
    ],
  },
} as const;

type PlanKey = keyof typeof PLANS;

export const metadata = { title: "Activate your plan — Mirae Fleet" };

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const searchParams = await props.searchParams;
  const planParam = (searchParams?.plan ?? "") as string;

  if (!["personal", "growth"].includes(planParam)) redirect("/dashboard");

  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-up?plan=${planParam}`);

  const plan = PLANS[planParam as PlanKey];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 px-6 flex items-center border-b border-border/40">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
          </div>

          {/* Progress breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-primary font-medium">Account created</span>
            <span className="text-muted-foreground/40 mx-0.5">·</span>
            <span className="font-semibold text-foreground">Activate plan</span>
            <span className="text-muted-foreground/40 mx-0.5">·</span>
            <span className="text-muted-foreground">Start tracking</span>
          </div>
        </div>
      </header>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-start">

          {/* ── Left: plan showcase ──────────────────────────────────────── */}
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              One step left
            </p>

            <h1 className="font-display text-5xl sm:text-6xl text-foreground leading-none tracking-tight mb-3">
              {plan.label}
            </h1>
            <p className="text-base text-muted-foreground mb-10 max-w-[38ch] leading-relaxed">
              {plan.tagline}
            </p>

            {/* Price */}
            <div className="flex items-end gap-3 mb-12 pb-12 border-b border-border/40">
              <span className="font-display text-7xl sm:text-8xl font-bold text-foreground tracking-tighter leading-none tabular-nums">
                RM {plan.price}
              </span>
              <div className="pb-3">
                <p className="text-sm text-muted-foreground leading-none">per month</p>
                <p className="text-xs text-muted-foreground/50 mt-1.5">cancel anytime</p>
              </div>
            </div>

            {/* Feature grid */}
            <div className="mb-10 animate-fade-up delay-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
                Everything included
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hardware note */}
            <div className="animate-fade-up delay-200 border border-amber-500/20 bg-amber-500/10 rounded-2xl p-5 flex items-start gap-4">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-200 mb-1">GPS hardware required</p>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Each vehicle needs a GPS device (RM 399 one-time). Email{" "}
                  <a
                    href="mailto:support@miraefleet.app"
                    className="underline underline-offset-2 hover:text-amber-100 transition-colors"
                  >
                    support@miraefleet.app
                  </a>{" "}
                  to arrange hardware alongside your subscription.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: payment card ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-8 animate-fade-up delay-100">
            <div className="border border-border/60 rounded-2xl bg-card p-7 shadow-sm">

              {/* Plan badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20">
                  <Zap className="h-3 w-3" />
                  {plan.label} Plan
                </div>
                <span className="text-xs text-muted-foreground">Monthly</span>
              </div>

              {/* Line items */}
              <div className="space-y-3 pb-5 mb-5 border-b border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subscription</span>
                  <span className="font-medium text-foreground">RM {plan.price}/mo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vehicles</span>
                  <span className="font-medium text-foreground">Up to {plan.vehicleLimit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Update rate</span>
                  <span className="font-medium text-foreground">{plan.pingRate}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold text-foreground">Due today</span>
                <span className="text-xl font-bold text-foreground tabular-nums">RM {plan.price}</span>
              </div>

              {/* CTA */}
              <a
                href={`/api/billing/start?plan=${planParam}`}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors active:scale-[0.98] min-h-[48px]"
              >
                Pay with Billplz <ArrowRight className="h-4 w-4" />
              </a>

              {/* Trust note */}
              <div className="mt-5 pt-5 border-t border-border/40 flex items-start gap-2.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                  Payment processed securely by Billplz. Cancel anytime by contacting support.
                </p>
              </div>
            </div>

            {/* Back link */}
            <div className="mt-4 flex justify-center">
              <Link
                href={`/sign-up?plan=${planParam}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign up
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
