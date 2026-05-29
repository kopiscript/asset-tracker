import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, CheckCircle, ArrowRight, Car, Cpu, Wifi } from "lucide-react";

export const metadata = { title: "Welcome to Mirae Fleet" };

const PLAN_LABELS: Record<string, string> = {
  personal: "Personal",
  growth: "Growth",
};

const STEPS = [
  {
    icon: Car,
    title: "Add your first vehicle",
    description: "Register each vehicle you want to track — plate number, driver name, and IMEI from the GPS device.",
    href: "/dashboard/vehicles/new",
    cta: "Add vehicle",
  },
  {
    icon: Cpu,
    title: "Order your GPS hardware",
    description: "Each vehicle needs a GPS tracking device (RM 399 one-time). Email us to arrange delivery.",
    href: "mailto:support@miraefleet.app?subject=Hardware Order",
    cta: "Order hardware",
  },
  {
    icon: Wifi,
    title: "Connect and go live",
    description: "Once hardware is installed, your vehicle appears on the live map within minutes.",
    href: "/dashboard",
    cta: "Go to dashboard",
  },
] as const;

export default async function WelcomePage(props: PageProps<"/welcome">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const searchParams = await props.searchParams;
  const planParam = Array.isArray(searchParams?.plan)
    ? searchParams.plan[0]
    : (searchParams?.plan ?? "");
  const planLabel = PLAN_LABELS[planParam] ?? null;

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
            <span className="text-primary font-medium">Plan activated</span>
            <span className="text-muted-foreground/40 mx-0.5">·</span>
            <span className="font-semibold text-foreground">Start tracking</span>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16 lg:py-24">

        {/* Payment confirmation */}
        <div className="flex flex-col items-center text-center mb-16 animate-fade-up">
          <div className="h-14 w-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-6">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-3">
            Payment received
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight tracking-tight mb-3">
            Welcome to Mirae.
          </h1>
          <p className="text-base text-muted-foreground max-w-[42ch] leading-relaxed">
            {planLabel
              ? `Your ${planLabel} plan is being activated. Here's how to get your fleet online.`
              : "Your plan is being activated. Here's how to get your fleet online."}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-2">
            You&apos;ll receive a payment confirmation from Billplz by email.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 animate-fade-up delay-100">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-6 text-center">
            3 steps to go live
          </p>

          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex items-start gap-5 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/20 transition-colors group"
            >
              {/* Step number + icon */}
              <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                  0{i + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">{step.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {step.description}
                </p>
                <a
                  href={step.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {step.cta} <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up delay-200">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
          >
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="mailto:support@miraefleet.app?subject=Getting Started"
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors py-3 px-4"
          >
            Need help? Email us
          </a>
        </div>

      </main>
    </div>
  );
}
