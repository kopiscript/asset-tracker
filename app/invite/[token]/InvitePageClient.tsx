"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, UserPlus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  viewer: "Viewer",
};

interface Props {
  token: string;
  orgName: string;
  inviterName: string;
  role: string;
  email: string;
  /** Email of the currently signed-in user, or null if signed out. */
  sessionEmail: string | null;
}

export function InvitePageClient({
  token,
  orgName,
  inviterName,
  role,
  email,
  sessionEmail,
}: Props) {
  const router = useRouter();
  const roleLabel = ROLE_LABELS[role] ?? role;

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function acceptInvite() {
    const res = await fetch(`/api/invite/${token}`, { method: "POST" });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      throw new Error(json?.error ?? "Could not accept invite.");
    }
  }

  // Already signed in as the invited email → one-click accept.
  async function handleAccept() {
    setError(null);
    setLoading(true);
    try {
      await acceptInvite();
      router.push("/dashboard/welcome");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  // No account → register, sign in, then accept.
  async function handleCreateAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created. Please sign in to continue.");
        setLoading(false);
        return;
      }

      // Registration already activates pending invites, but accept again to be
      // safe (idempotent) and to land on the welcome screen for this org.
      await acceptInvite();
      router.push("/dashboard/welcome");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const wrongAccount =
    sessionEmail !== null && sessionEmail.toLowerCase() !== email.toLowerCase();

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          You&apos;ve been invited to join
        </p>
        <h1 className="font-display text-3xl text-foreground leading-tight mb-2">
          {orgName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {inviterName} invited you as a{" "}
          <span className="font-semibold text-foreground">{roleLabel}</span>.
        </p>
      </div>

      {error && (
        <p className="mb-5 text-sm text-destructive bg-destructive/10 border border-destructive/15 px-3 py-2.5 rounded-lg">
          {error}
        </p>
      )}

      {/* ── State 1: signed in as a DIFFERENT email ──────────────────────── */}
      {wrongAccount && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
          <p className="text-sm text-amber-200 mb-3">
            You&apos;re signed in as{" "}
            <span className="font-semibold">{sessionEmail}</span>, but this invite
            is for <span className="font-semibold">{email}</span>.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: `/invite/${token}` })}
          >
            Sign out to continue
          </Button>
        </div>
      )}

      {/* ── State 2: signed in as the invited email ──────────────────────── */}
      {!wrongAccount && sessionEmail !== null && (
        <Button
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-11 active:scale-[0.98] transition-transform"
        >
          {loading ? "Joining…" : (
            <>
              Accept &amp; Join {orgName} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      )}

      {/* ── State 3: signed out → create account or sign in ──────────────── */}
      {sessionEmail === null && (
        <>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} readOnly disabled className="opacity-70" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-muted-foreground font-normal">(optional)</span>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 h-11 active:scale-[0.98] transition-transform"
            >
              {loading ? "Joining…" : (
                <>
                  <UserPlus className="h-4 w-4" /> Create account &amp; join
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/sign-in?callbackUrl=/invite/${token}`}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
