import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PlanProvider, type PlanInfo } from "@/components/PlanProvider";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const PLAN_LABELS: Record<string, string> = {
  free: "No active plan", personal: "Personal", growth: "Growth",
  fleet: "Fleet", enterprise: "Enterprise",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Plan gate: redirect unpaid/lapsed owners out of the dashboard
  if (session?.user?.id) {
    const now = new Date();

    const lapsedOrg = await prisma.orgMember.findFirst({
      where: {
        userId: session.user.id,
        role: "owner",
        org: { gracePeriodEndsAt: { lt: now }, plan: { not: "free" } },
      },
      select: { id: true },
    });
    if (lapsedOrg) redirect("/billing/lapsed");

    const unpaidOrg = await prisma.orgMember.findFirst({
      where: { userId: session.user.id, role: "owner", org: { plan: "free" } },
      select: { id: true },
    });
    if (unpaidOrg) redirect("/billing/activate");
  }

  // Fetch plan info for the sidebar chip and header dropdown
  let planInfo: PlanInfo | undefined;
  if (session?.user?.id) {
    const membership = await prisma.orgMember.findFirst({
      where: { userId: session.user.id, role: "owner" },
      include: { org: true },
    });
    if (membership) {
      const [vehicleCount, planDef] = await Promise.all([
        prisma.vehicle.count({ where: { orgId: membership.org.id, isActive: true } }),
        Promise.resolve(getPlan(membership.org.plan)),
      ]);
      planInfo = {
        plan: membership.org.plan,
        planLabel: PLAN_LABELS[membership.org.plan] ?? membership.org.plan,
        vehicleCount,
        // Infinity can't cross the server→client boundary — use -1 as sentinel
        vehicleLimit: planDef.vehicleLimit === Infinity ? -1 : planDef.vehicleLimit,
      };
    }
  }

  return (
    <LanguageProvider>
      <PlanProvider initialPlan={planInfo}>
        <div className="flex h-screen overflow-hidden bg-background">
          <DashboardSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </PlanProvider>
    </LanguageProvider>
  );
}
