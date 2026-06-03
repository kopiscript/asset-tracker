import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WelcomeClient } from "./WelcomeClient";

export const metadata = { title: "Welcome — Mirae Fleet" };

export default async function DashboardWelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const member = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, seenWelcomeAt: null },
    select: { role: true, org: { select: { name: true } } },
  });

  // Nothing to welcome → straight to the dashboard.
  if (!member) redirect("/dashboard");

  return <WelcomeClient orgName={member.org.name} role={member.role} />;
}
