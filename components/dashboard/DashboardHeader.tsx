"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell, CreditCard, Home, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileSidebarSheet } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LanguageProvider";
import { usePlan } from "@/components/PlanProvider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Lang } from "@/lib/translations";

function UserMenu() {
  const { data: session } = useSession();
  const planInfo = usePlan();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const display = session?.user?.name ?? session?.user?.email ?? "?";
  const initials = display
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-semibold text-primary select-none hover:bg-primary/20 transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 bg-card border border-border/60 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-up">
          {/* Identity */}
          <div className="px-4 py-3 border-b border-border/40">
            <p className="text-xs font-semibold text-foreground truncate">
              {session?.user?.name ?? "Account"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {session?.user?.email}
            </p>
            {planInfo && (
              <p className="text-[10px] text-primary font-medium mt-1.5">
                {planInfo.planLabel} plan · {planInfo.vehicleCount} vehicle{planInfo.vehicleCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Navigation actions */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push("/dashboard/billing"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              Billing
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors min-h-[44px]"
            >
              <Home className="h-4 w-4 text-muted-foreground shrink-0" />
              Home
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-border/40 py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors min-h-[44px]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardHeader() {
  const { lang, setLang } = useLang();

  return (
    <header className="h-14 border-b border-border bg-background/60 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-40">
      <MobileSidebarSheet />
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <div className="flex items-center gap-0.5">
          {(["en", "bm"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                "px-2 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors",
                lang === l ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </TooltipTrigger>
          <TooltipContent>Notifications — coming soon</TooltipContent>
        </Tooltip>

        {/* User menu (replaces tooltip-only avatar) */}
        <UserMenu />
      </div>
    </header>
  );
}
