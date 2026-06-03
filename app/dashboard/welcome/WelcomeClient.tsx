"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LanguageProvider";

interface Props {
  orgName: string;
  role: string;
}

export function WelcomeClient({ orgName, role }: Props) {
  const router = useRouter();
  const { tr } = useLang();
  const [loading, setLoading] = useState(false);

  const subtitle =
    role === "admin" ? tr("welcomeSubtitleAdmin") : tr("welcomeSubtitleViewer");
  const RoleIcon = role === "admin" ? Pencil : Eye;

  async function handleContinue() {
    setLoading(true);
    try {
      await fetch("/api/dashboard/welcome/seen", { method: "POST" });
    } catch {
      /* non-fatal — proceed regardless */
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center animate-fade-up">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-7">
          <MapPin className="h-6 w-6 text-primary" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          {tr("welcomeTitle")}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight tracking-tight mb-4">
          {orgName}
        </h1>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 mb-6">
          <RoleIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground capitalize">{role}</span>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed max-w-[40ch] mx-auto mb-10">
          {subtitle}
        </p>

        <Button
          onClick={handleContinue}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 px-6 h-11 active:scale-[0.98] transition-transform"
        >
          {loading ? "…" : (
            <>
              {tr("goToFleet")} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
