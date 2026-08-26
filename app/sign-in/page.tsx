"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowRight } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";

function SignInForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") ?? "";
  const plan = ["personal", "growth"].includes(planParam) ? planParam : null;
  // Only honor same-origin relative paths. Reject protocol-relative URLs like
  // //evil.com which start with "/" but navigate off-site.
  const callbackParam = searchParams.get("callbackUrl") ?? "";
  const callbackUrl = callbackParam.startsWith("/") && !callbackParam.startsWith("//") ? callbackParam : null;

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      // Priority: explicit callback (e.g. invite flow) → payment wizard → dashboard
      window.location.href = callbackUrl
        ? callbackUrl
        : plan
          ? `/api/billing/start?plan=${plan}`
          : "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-2">
      {/* ── Brand panel ──────────────────────────────────────────────────── */}
      <AuthBrandPanel
        eyebrow="Fleet management"
        heading={"Your entire fleet,\nvisible at a glance."}
        subtext="Real-time GPS tracking, trip history, and team access control, built for Malaysian logistics."
        features={[
          "Live GPS updates from your hardware",
          "Role-based access for your team",
          "Free OpenStreetMap tiles",
        ]}
      />

      {/* ── Form panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
          </div>

          <h1 className="font-display text-3xl text-foreground mb-1.5">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-8">
            {plan ? "Sign in to continue to payment." : "Welcome back. Enter your details below."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/15 px-3 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 active:scale-[0.98] transition-transform"
              disabled={loading}
            >
              {loading ? "Signing in…" : (
                <><span>{plan ? "Sign in & pay" : "Sign in"}</span><ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/get-started" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Get started
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
