"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Car, Users, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  orgId: string;
  orgName: string;
  nameDone: boolean;
  vehicleDone: boolean;
  teamDone: boolean;
}

type StepKey = "name" | "vehicle" | "team";

export function SetupClient({ orgId, orgName, nameDone, vehicleDone, teamDone }: Props) {
  const router = useRouter();
  const [name, setName] = useState(orgName);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [open, setOpen] = useState<StepKey | null>(nameDone ? null : "name");

  // inline invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    setNameError(null);
    const res = await fetch(`/api/orgs/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSavingName(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      setNameError(json?.error ?? "Could not save name.");
      return;
    }
    router.refresh();
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteMsg(null);
    const res = await fetch(`/api/orgs/${orgId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    setInviting(false);
    if (!res.ok) {
      setInviteError(json?.error ?? "Could not send invite.");
      return;
    }
    setInviteEmail("");
    setInviteMsg("Invite sent.");
    router.refresh();
  }

  async function skip() {
    setSkipping(true);
    try {
      await fetch("/api/onboarding/skip", { method: "POST" });
    } catch {
      /* non-fatal */
    }
    router.push("/dashboard");
  }

  const steps: {
    key: StepKey;
    icon: typeof Pencil;
    title: string;
    done: boolean;
  }[] = [
    { key: "name", icon: Pencil, title: "Name your fleet", done: nameDone },
    { key: "vehicle", icon: Car, title: "Add your first vehicle", done: vehicleDone },
    { key: "team", icon: Users, title: "Invite your team", done: teamDone },
  ];

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          Payment received
        </p>
        <h1 className="font-display text-4xl text-foreground leading-tight tracking-tight mb-2">
          Set up your fleet
        </h1>
        <p className="text-sm text-muted-foreground">
          Three quick steps to get your fleet online. Do them in any order, or skip for now.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isOpen = open === step.key;
          return (
            <div
              key={step.key}
              className="rounded-2xl border border-border/60 bg-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : step.key)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div
                  className={[
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                    step.done
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-primary/10 border-primary/20",
                  ].join(" ")}
                >
                  {step.done ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <step.icon className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {step.title}
                </span>
                {step.done ? (
                  <span className="text-xs font-medium text-emerald-400">Done</span>
                ) : (
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                  />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border/40">
                  {/* Step 1 — rename */}
                  {step.key === "name" && (
                    <form onSubmit={saveName} className="flex flex-col sm:flex-row gap-2 pt-3">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ahmad Logistics"
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={savingName}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {savingName ? "Saving…" : "Save"}
                      </Button>
                      {nameError && (
                        <p className="text-xs text-destructive w-full">{nameError}</p>
                      )}
                    </form>
                  )}

                  {/* Step 2 — add vehicle */}
                  {step.key === "vehicle" && (
                    <div className="pt-3">
                      <p className="text-xs text-muted-foreground mb-3">
                        Register a vehicle with its plate number, driver, and GPS IMEI.
                      </p>
                      <Button
                        render={<Link href="/dashboard/vehicles/new" />}
                        nativeButton={false}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                      >
                        Add vehicle <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Step 3 — invite team */}
                  {step.key === "team" && (
                    <form onSubmit={sendInvite} className="pt-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Invite an admin or viewer by email. They&apos;ll get a link to join.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="teammate@example.com"
                          className="flex-1"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          type="submit"
                          disabled={inviting}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {inviting ? "Sending…" : "Invite"}
                        </Button>
                      </div>
                      {inviteMsg && <p className="text-xs text-emerald-400">{inviteMsg}</p>}
                      {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
                      <p className="text-xs text-muted-foreground pt-1">
                        Or manage everyone on the{" "}
                        <Link href={`/dashboard/orgs/${orgId}`} className="text-primary hover:underline">
                          team page
                        </Link>
                        .
                      </p>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={skip}
          disabled={skipping}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {skipping ? "…" : "Skip for now"}
        </button>
        <Button
          render={<Link href="/dashboard" />}
          nativeButton={false}
          variant="outline"
          className="gap-1.5"
        >
          Go to dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
