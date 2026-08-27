"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Settings, MapPin, LogOut,
  Menu, Globe2, Building2, CreditCard, Zap, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/LanguageProvider";
import { usePlan, resolvedVehicleLimit } from "@/components/PlanProvider";

const COLLAPSE_KEY = "fleet-sidebar-collapsed";

function NavLink({
  icon: Icon, label, href, collapsed, onClick,
}: {
  icon: React.ElementType; label: string; href: string; collapsed?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const link = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center px-0" : "pl-3 pr-3",
        isActive
          ? cn("border-l-2 border-primary text-primary bg-primary/5", !collapsed && "pl-[10px]")
          : "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && label}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={<div />}>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function PlanChip({ collapsed }: { collapsed?: boolean }) {
  const planInfo = usePlan();
  if (!planInfo) return null;

  const limit = resolvedVehicleLimit(planInfo.vehicleLimit);
  const hasLimit = limit !== Infinity;
  const pct = hasLimit ? Math.min(1, planInfo.vehicleCount / (limit as number)) : 0;
  const isUpgradable = !["growth", "fleet", "enterprise"].includes(planInfo.plan);
  const isWarning = hasLimit && pct >= 0.8;

  if (collapsed) {
    return (
      <div className="mx-auto mb-2 w-8">
        <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
          {hasLimit && (
            <div
              className={cn("h-full rounded-full transition-all", isWarning ? "bg-amber-500" : "bg-primary/60")}
              style={{ width: `${pct * 100}%` }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 rounded-xl border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{planInfo.planLabel}</span>
        {isUpgradable && (
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Zap className="h-2.5 w-2.5" />
            Upgrade
          </Link>
        )}
      </div>

      {hasLimit ? (
        <>
          <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden mb-1.5">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isWarning ? "bg-amber-500" : "bg-primary/60"
              )}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <p className={cn("text-[10px]", isWarning ? "text-amber-600" : "text-muted-foreground")}>
            {planInfo.vehicleCount} / {limit as number} vehicles
          </p>
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          {planInfo.vehicleCount} vehicle{planInfo.vehicleCount !== 1 ? "s" : ""} · Unlimited
        </p>
      )}
    </div>
  );
}

function SidebarContent({ collapsed, onNavClick }: { collapsed?: boolean; onNavClick?: () => void }) {
  const { data: session } = useSession();
  const { tr } = useLang();
  const isAdmin = session?.user?.usertype === "admin";

  const userNav = [
    { icon: LayoutDashboard, label: tr("dashboard"),     href: "/dashboard" },
    { icon: Car,             label: tr("vehicles"),      href: "/dashboard/vehicles" },
    { icon: Building2,       label: tr("organisations"), href: "/dashboard/orgs" },
    { icon: CreditCard,      label: tr("billing"),       href: "/dashboard/billing" },
    { icon: Settings,        label: tr("settings"),      href: "/dashboard/settings" },
  ];

  const adminNav = [
    { icon: Globe2,    label: tr("fleetOverview"),  href: "/dashboard/admin" },
    { icon: Building2, label: tr("organisations"),  href: "/dashboard/orgs" },
    { icon: Settings,  label: tr("settings"),       href: "/dashboard/settings" },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  return (
    <div className="flex flex-col h-full">
      {/* Logo — links back to the landing page */}
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 py-5 border-b border-sidebar-border hover:bg-black/[0.03] transition-colors group",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <MapPin className="h-3.5 w-3.5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">
              Mirae
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide mt-0.5">
              {isAdmin ? tr("adminPanel") : "Fleet Tracking"}
            </span>
          </div>
        )}
      </Link>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4 space-y-0.5", collapsed ? "px-2" : "px-3")}>
        {navItems.map(({ icon, label, href }) => (
          <NavLink key={href} icon={icon} label={label} href={href} collapsed={collapsed} onClick={onNavClick} />
        ))}
      </nav>

      {/* Plan chip — only for non-admin users */}
      {!isAdmin && <PlanChip collapsed={collapsed} />}

      {/* Sign out */}
      <div className={cn("pb-5 pt-3 border-t border-sidebar-border", collapsed ? "px-2" : "px-3")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center justify-center py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all w-full border-l-2 border-transparent"
                />
              }
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right">{tr("signOut")}</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all w-full border-l-2 border-transparent"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {tr("signOut")}
          </button>
        )}
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const { tr } = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col min-h-screen border-r border-sidebar-border bg-sidebar shrink-0 relative transition-[width] duration-200",
        collapsed ? "w-16" : "w-56",
        !hydrated && "invisible"
      )}
    >
      <SidebarContent collapsed={collapsed} />

      <button
        onClick={toggle}
        aria-label={collapsed ? tr("expandSidebar") : tr("collapseSidebar")}
        className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shadow-sm z-10"
      >
        {collapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}

export function MobileSidebarSheet() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-56 bg-sidebar border-sidebar-border">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
