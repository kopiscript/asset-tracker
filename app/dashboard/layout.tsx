/**
 * app/dashboard/layout.tsx
 * Shared layout for all /dashboard/* pages.
 * Includes the sidebar navigation and top header.
 * Wraps content in the LanguageProvider so all dashboard pages can use translations.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LanguageProvider } from "@/components/LanguageProvider";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Grace period check: if any owner org has lapsed, lock the dashboard
  const session = await auth();
  if (session?.user?.id) {
    const now = new Date();
    const lapsedOrg = await prisma.orgMember.findFirst({
      where: {
        userId: session.user.id,
        role: "owner",
        org: {
          gracePeriodEndsAt: { lt: now },
          plan: { not: "free" },
        },
      },
      select: { id: true },
    });
    if (lapsedOrg) redirect("/billing/lapsed");
  }

  return (
    <LanguageProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Fixed left sidebar — hidden on mobile, shown on desktop */}
        <DashboardSidebar />

        {/* Main area: header + scrollable content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardHeader />
          {/* Page content scrolls inside here */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav (shown on small screens instead of sidebar) */}
      <MobileNav />
    </LanguageProvider>
  );
}

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────
// Extracted to keep the layout clean. Defined here since it's small.
function MobileNav() {
  return (
    // This is a placeholder for mobile nav — the real one is in DashboardSidebar
    // via the Sheet component for mobile screens.
    <></>
  );
}
