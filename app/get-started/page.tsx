"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  MapPin, ArrowRight, ArrowLeft, Check, Cpu, Mail, Car, Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4 | 5 | "contact" | "member";
type RangeKey = "1-3" | "4-10" | "11-20" | "21-50" | "50+";
type PlanKey = "personal" | "growth";

const TILES: { range: RangeKey; label: string; sub: string; min: number; contact: boolean }[] = [
  { range: "1-3",   label: "1 – 3",   sub: "Small fleet",   min: 1,  contact: false },
  { range: "4-10",  label: "4 – 10",  sub: "Growing fleet", min: 4,  contact: false },
  { range: "11-20", label: "11 – 20", sub: "Mid-size fleet", min: 11, contact: false },
  { range: "21-50", label: "21 – 50", sub: "Large fleet",    min: 21, contact: true  },
  { range: "50+",   label: "50 +",    sub: "Enterprise",     min: 51, contact: true  },
];

const PLANS: Record<PlanKey, {
  label: string; price: number; limit: number; pingRate: string; features: string[];
}> = {
  personal: {
    label: "Personal", price: 29, limit: 3, pingRate: "1 ping / minute",
    features: ["Up to 3 vehicles", "Live GPS map", "Full trip history", "Email support"],
  },
  growth: {
    label: "Growth", price: 149, limit: 20, pingRate: "1 ping / 10 seconds",
    features: ["Up to 20 vehicles", "10-second live updates", "Full trip history", "Priority support"],
  },
};

const STEP_LABELS = ["Fleet size", "Your details", "Plan", "Cost", "Account"];

function derivePlan(count: number): PlanKey {
  return count <= 3 ? "personal" : "growth";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GetStartedPage() {
  const [step, setStep]               = useState<Step>(0);
  const [range, setRange]             = useState<RangeKey | null>(null);
  const [vehicleCount, setVehicleCount] = useState(1);
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const plan    = derivePlan(vehicleCount);
  const planDef = PLANS[plan];
  const hardware = vehicleCount * 399;

  function pickRange(tile: typeof TILES[number]) {
    setRange(tile.range);
    setVehicleCount(tile.min);
    setStep(tile.contact ? "contact" : 2);
  }

  function clampCount(n: number) {
    setVehicleCount(Math.max(1, Math.min(20, n)));
  }

  async function handleCreateAccount() {
    if (password.length < 8) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        if (res.status === 409) {
          setError("__existing_account__");
        } else {
          setError(data?.error ?? "Registration failed. Please try again.");
        }
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created. Please sign in to continue.");
        return;
      }
      const orgName = name.trim() ? `${name.trim()}'s Fleet` : "My Fleet";
      await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      window.location.href = `/api/billing/start?plan=${plan}`;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const stepNum = typeof step === "number" ? step : 0;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 px-6 flex items-center border-b border-border/40">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
          </Link>

          {/* Step indicator — hidden on the role-picker (step 0) */}
          {typeof step === "number" && step > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const done    = n < stepNum;
                const current = n === stepNum;
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="flex flex-col items-center gap-1">
                      <div className={[
                        "h-1.5 w-1.5 rounded-full transition-all duration-300",
                        done    ? "bg-primary" :
                        current ? "bg-primary scale-[1.5]" :
                        "bg-border",
                      ].join(" ")} />
                      <span className={[
                        "text-[10px] leading-none transition-colors",
                        current ? "text-primary font-semibold" : "text-muted-foreground/40",
                      ].join(" ")}>
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className={[
                        "h-px w-6 mb-3 transition-colors",
                        done ? "bg-primary/30" : "bg-border/40",
                      ].join(" ")} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── Wizard content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-lg">

          {/* ── Step 0: Role picker ───────────────────────────────────────── */}
          {step === 0 && (
            <div className="animate-fade-up">
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                How are you using Mirae?
              </h1>
              <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
                Tell us your goal and we&apos;ll point you in the right direction.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex flex-col items-start p-6 rounded-2xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.97]"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base font-semibold text-foreground mb-1">Starting a fleet</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">I own or manage vehicles and want to track them</span>
                </button>

                <button
                  onClick={() => setStep("member")}
                  className="flex flex-col items-start p-6 rounded-2xl border border-border/50 hover:border-border hover:bg-muted/20 text-left transition-all active:scale-[0.97]"
                >
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border/60 flex items-center justify-center mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-base font-semibold text-foreground mb-1">Joining a team</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">I&apos;ve been invited to view or manage someone else&apos;s fleet</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Member: joining a team (terminal) ─────────────────────────── */}
          {step === "member" && (
            <div className="animate-fade-up text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-muted border border-border/60 flex items-center justify-center mb-7">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>

              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                Check your inbox
              </h1>
              <p className="text-sm text-muted-foreground mb-10 leading-relaxed max-w-[38ch] mx-auto">
                Your fleet owner will send you an invite link by email. Click it to create your account and join — no sign-up needed here.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mx-auto"
                >
                  Are you a fleet owner? Get started <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <div>
                  <Link
                    href="/sign-in"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Vehicle count ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Step 1 of 5
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                How many vehicles<br />do you want to track?
              </h1>
              <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
                We'll recommend the right plan and calculate your costs.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TILES.map((tile, i) => (
                  <button
                    key={tile.range}
                    onClick={() => pickRange(tile)}
                    className={[
                      "flex flex-col items-start p-5 rounded-2xl border text-left transition-all active:scale-[0.97]",
                      i === 4 ? "col-span-2 sm:col-span-1" : "",
                      tile.contact
                        ? "border-border/50 hover:border-border hover:bg-muted/20"
                        : "border-border/50 hover:border-primary/40 hover:bg-primary/5",
                    ].join(" ")}
                  >
                    <span className="text-2xl font-bold text-foreground tracking-tight leading-none mb-1.5">
                      {tile.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{tile.sub}</span>
                    {tile.contact && (
                      <span className="text-[10px] font-medium text-muted-foreground/60 mt-2 bg-muted/80 px-2 py-0.5 rounded-full">
                        Custom pricing
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Details + exact count ────────────────────────────── */}
          {step === 2 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Step 2 of 5
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                Your details
              </h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                We'll use this to set up your account and arrange hardware delivery.
              </p>

              {/* Hardware note */}
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
                <Cpu className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Each vehicle requires a GPS device <strong>(RM 399 one-time)</strong>. Our team will reach out after signup to arrange delivery.
                </p>
              </div>

              <div className="space-y-5">
                {/* Exact count */}
                <div className="space-y-2">
                  <Label>Exact number of vehicles</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => clampCount(vehicleCount - 1)}
                      className="h-10 w-10 rounded-xl border border-border/60 flex items-center justify-center text-lg font-light hover:bg-muted transition-colors shrink-0"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={vehicleCount}
                      onChange={(e) => clampCount(Number(e.target.value))}
                      className="w-20 text-center font-bold text-lg tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => clampCount(vehicleCount + 1)}
                      className="h-10 w-10 rounded-xl border border-border/60 flex items-center justify-center text-lg font-light hover:bg-muted transition-colors shrink-0"
                    >
                      +
                    </button>
                    <span className="text-sm text-muted-foreground ml-1">vehicles</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Your name{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmad Rizwan"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!email}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Plan recommendation ──────────────────────────────── */}
          {step === 3 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Step 3 of 5
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                Your recommended plan
              </h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Based on {vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""}, here's the right fit.
              </p>

              {/* Plan card */}
              <div className="border-2 border-primary rounded-2xl p-7 bg-primary/[0.03] mb-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Recommended
                    </span>
                    <h2 className="font-display text-4xl text-foreground tracking-tight mt-1 leading-none">
                      {planDef.label}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Up to {planDef.limit} vehicles · {planDef.pingRate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-4xl font-bold text-foreground tabular-nums leading-none">
                      RM {planDef.price}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">/month</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {planDef.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
                >
                  Looks good <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Cost breakdown ───────────────────────────────────── */}
          {step === 4 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Step 4 of 5
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                Cost breakdown
              </h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                No hidden fees. Here's exactly what you'll pay.
              </p>

              <div className="border border-border/60 rounded-2xl overflow-hidden mb-4">
                {/* One-time hardware */}
                <div className="px-6 py-5 border-b border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    One-time
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">GPS Hardware</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        RM 399 × {vehicleCount} device{vehicleCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      RM {hardware.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Monthly subscription */}
                <div className="px-6 py-5 border-b border-border/40">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                    Monthly
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {planDef.label} subscription
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Up to {planDef.limit} vehicles · {planDef.pingRate}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      RM {planDef.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                  </div>
                </div>

                {/* Total row */}
                <div className="px-6 py-5 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Due today</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Hardware + first month subscription
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      RM {(hardware + planDef.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-8">
                From month 2: RM {planDef.price}/mo only. Hardware is a one-time cost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
                >
                  Continue to account <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Create account ───────────────────────────────────── */}
          {step === 5 && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Step 5 of 5
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-none tracking-tight mb-3">
                Set your password
              </h1>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Your account will be created with{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </p>

              {/* Mini cost reminder */}
              <div className="flex items-center justify-between border border-border/40 bg-muted/30 rounded-xl px-4 py-3 mb-6">
                <div>
                  <p className="text-xs font-semibold text-foreground">{planDef.label} plan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""} · RM {planDef.price}/mo
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground tabular-nums">
                  RM {(hardware + planDef.price).toLocaleString()} today
                </p>
              </div>

              <div className="space-y-2 mb-5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Min. 8 characters"
                />
              </div>

              {error && (
                <div className={`px-3 py-2.5 rounded-lg mb-5 border text-sm ${
                  error === "__existing_account__"
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                    : "bg-destructive/10 border-destructive/15 text-destructive"
                }`}>
                  {error === "__existing_account__" ? (
                    <span>
                      An account with this email already exists.{" "}
                      <a
                        href={`/sign-in?plan=${plan}`}
                        className="font-semibold underline underline-offset-2 hover:opacity-80"
                      >
                        Sign in instead →
                      </a>
                    </span>
                  ) : error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={loading || password.length < 8}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors active:scale-[0.98] min-h-[44px]"
                >
                  {loading ? "Setting up…" : (
                    <><span>Create account & pay</span><ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Contact path (21–50 or 50+) ──────────────────────────────── */}
          {step === "contact" && (
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Large fleet
              </p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight tracking-tight mb-3">
                Let&apos;s build a<br />custom plan.
              </h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-[40ch] leading-relaxed">
                For fleets of {range === "21-50" ? "21 – 50" : "50+"} vehicles we put together a
                custom contract with dedicated hardware pricing and an account manager.
              </p>

              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Your name</Label>
                  <Input
                    id="c-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmad Rizwan"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <a
                href={`mailto:support@miraefleet.app?subject=Fleet Plan Enquiry (${range} vehicles)&body=Hi Mirae team,%0A%0AI'm interested in a Fleet plan for ${range} vehicles.%0A%0AName: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0APlease get in touch.`}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors active:scale-[0.98] min-h-[48px] mb-3"
              >
                <Mail className="h-4 w-4" /> Send enquiry
              </a>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Choose a different fleet size
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
