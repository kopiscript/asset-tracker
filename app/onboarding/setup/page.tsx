import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SetupClient } from "./SetupClient";

export const metadata = { title: "Set up your fleet — Mirae Fleet" };

export default async function OnboardingSetupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // The user's first owned org.
  const membership = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, role: "owner" },
    orderBy: { createdAt: "asc" },
    select: {
      org: {
        select: {
          id: true,
          name: true,
          nameSetAt: true,
          onboardingSkippedAt: true,
          _count: { select: { vehicles: true, members: true } },
        },
      },
    },
  });

  if (!membership) redirect("/dashboard");

  const org = membership.org;
  const nameDone = org.nameSetAt !== null;
  const vehicleDone = org._count.vehicles > 0;
  const teamDone = org._count.members > 1;

  // Skipped, or fully complete → nothing to do here.
  if (org.onboardingSkippedAt !== null || (nameDone && vehicleDone && teamDone)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="shrink-0 h-14 px-6 flex items-center border-b border-border/40">
        <div className="max-w-7xl w-full mx-auto flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <SetupClient
          orgId={org.id}
          orgName={org.name}
          nameDone={nameDone}
          vehicleDone={vehicleDone}
          teamDone={teamDone}
        />
      </main>
    </div>
  );
}
