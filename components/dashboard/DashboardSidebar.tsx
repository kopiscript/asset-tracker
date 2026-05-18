"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, Settings, MapPin, LogOut, Menu, Globe2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const USER_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Car,             label: "Vehicles",  href: "/dashboard/vehicles" },
  { icon: Settings,        label: "Settings",  href: "/dashboard/settings" },
];

const ADMIN_NAV = [
  { icon: Globe2,   label: "Fleet Overview", href: "/dashboard/admin" },
  { icon: Settings, label: "Settings",       href: "/dashboard/settings" },
];

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
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        // Base
        "group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        // Active: left border accent, no fill — Apple-style precision indicator
        isActive
          ? "border-l-2 border-primary text-primary pl-[10px] pr-3 bg-primary/5"
          : "pl-3 pr-3 border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {label}
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.usertype === "admin";
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-xs font-semibold tracking-[0.2em] text-foreground uppercase">
            Atlas
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wide mt-0.5">
            {isAdmin ? "Admin" : "Fleet Tracking"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ icon, label, href }) => (
          <NavLink
            key={href}
            icon={icon}
            label={label}
            href={href}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 pt-3 border-t border-sidebar-border">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-all w-full border-l-2 border-transparent"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 min-h-screen border-r border-sidebar-border bg-sidebar flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger + Sheet */}
      <MobileSidebarSheet />
    </>
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
            className="lg:hidden fixed top-3.5 left-4 z-50 text-muted-foreground hover:text-foreground"
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
