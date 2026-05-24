"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Check, ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        setError(data?.error ?? "Registration failed.");
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created! Please sign in.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
      {/* ── Brand panel ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col justify-between bg-primary p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-black/10 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-[0.15em] uppercase">Atlas</span>
        </div>

        {/* Tagline */}
        <div className="relative">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Get started free</p>
          <h2 className="font-display text-4xl text-white leading-tight mb-4">
            Start tracking<br />in under a minute.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-[38ch]">
            Create your account and connect your first GPS device. No credit card required.
          </p>
        </div>

        {/* Callouts */}
        <div className="relative space-y-3">
          {[
            "Free for all Malaysian fleets",
            "Connect your GPS hardware instantly",
            "Bahasa Malaysia support included",
          ].map((text) => (
            <div key={text} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-white/80 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Atlas</span>
          </div>

          <h1 className="font-display text-3xl text-foreground mb-1.5">Create account</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Start managing your fleet for free.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
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
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/15 px-3 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 active:scale-[0.98] transition-transform"
              disabled={loading}
            >
              {loading ? "Creating account…" : (
                <><span>Create account</span><ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
