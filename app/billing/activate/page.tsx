import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Zap, ArrowRight } from "lucide-react";

export const metadata = { title: "Choose a plan — Mirae Fleet" };

const PLANS: Array<{
  key: string;
  label: string;
  price: number;
  tagline: string;
  highlighted?: boolean;
}> = [
  {
    key: "personal",
    label: "Personal",
    price: 29,
    tagline: "Up to 3 vehicles · 1 ping / min",
  },
  {
    key: "growth",
    label: "Growth",
    price: 149,
    tagline: "Up to 20 vehicles · 10-second updates",
    highlighted: true,
  },
] as const;

export default async function ActivatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="shrink-0 h-14 px-6 flex items-center border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Activate a plan to continue
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a plan to unlock your dashboard and start tracking your vehicles.
            </p>
          </div>

          <div className="space-y-3">
            {PLANS.map((plan) => (
              <a
                key={plan.key}
                href={`/api/billing/start?plan=${plan.key}`}
                className={`flex items-center justify-between w-full rounded-2xl border p-5 transition-colors group ${
                  plan.highlighted
                    ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "border-border/60 bg-card hover:border-primary/20"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                    {plan.highlighted && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-sm font-bold text-foreground tabular-nums">RM {plan.price}/mo</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </a>
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Need a larger fleet?{" "}
              <a href="mailto:support@mirae.azmiproductions.com?subject=Fleet Plan Inquiry" className="text-primary underline underline-offset-2">
                Contact us
              </a>{" "}
              about Fleet or Enterprise plans.
            </p>
            <Link
              href="/sign-in"
              className="block text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors pt-1"
            >
              Sign in to a different account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
