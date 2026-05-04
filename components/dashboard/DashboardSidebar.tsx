/**
 * components/dashboard/DashboardSidebar.tsx
 * Fixed left sidebar with navigation links.
 * On desktop: always visible.
 * On mobile: hidden, opened via a hamburger button using Sheet.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Settings,
  MapPin,
  LogOut,
  Menu,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useLang } from "@/components/LanguageProvider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, labelKey: "dashboard" as const, href: "/dashboard" },
  { icon: Car, labelKey: "vehicles" as const, href: "/dashboard/vehicles" },
  { icon: Settings, labelKey: "settings" as const, href: "/dashboard/settings" },
];

/** Individual nav link — highlights when on the current page */
function NavLink({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-[#00c2cc]/15 text-[#00c2cc]" /* ✏️ EDIT: active link colour */
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("h-4 w-4", isActive && "text-[#00c2cc]")} />
      {label}
    </Link>
  );
}

/** The actual sidebar content — used in both desktop and mobile Sheet */
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { tr } = useLang();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border/50">
        <MapPin className="h-5 w-5 text-[#00c2cc]" />
        {/* ✏️ EDIT: Replace with your product/company name */}
        <span className="text-lg font-bold text-white">FleetTrack</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ icon, labelKey, href }) => (
          <NavLink
            key={href}
            icon={icon}
            label={tr(labelKey)}
            href={href}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Sign out at the bottom */}
      <div className="px-3 pb-4 border-t border-border/50 pt-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <LogOut className="h-4 w-4" />
          {tr("signOut")}
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop sidebar — visible on lg+ screens */}
      <aside className="hidden lg:flex lg:flex-col w-56 min-h-screen border-r border-border/50 bg-[#131f2e] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger + Sheet drawer */}
      <MobileSidebarSheet />
    </>
  );
}

/** Mobile sheet sidebar — opens from the left */
export function MobileSidebarSheet() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3.5 left-4 z-50 text-muted-foreground"
            aria-label="Open menu"
            id="mobile-sidebar-trigger"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-56 bg-[#131f2e] border-border/50">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
