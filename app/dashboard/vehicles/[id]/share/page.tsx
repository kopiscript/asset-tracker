/**
 * app/dashboard/vehicles/[id]/share/page.tsx
 * Manage who has access to this vehicle (owner only).
 * Shows current access list + invite form.
 * In Next.js 16, params is a Promise — must be awaited.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharePageClient } from "./SharePageClient";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canShare } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function SharePage(
  props: PageProps<"/dashboard/vehicles/[id]/share">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  // Only owners can manage access
  const allowed = await canShare(dbUser.id, id);
  if (!allowed) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Only the vehicle owner can manage access permissions.
        </p>
        <Button variant="outline" className="mt-4" render={<Link href={`/dashboard/vehicles/${id}`} />}>Go Back</Button>
      </div>
    );
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true, name: true, plateNumber: true },
  });
  if (!vehicle) return notFound();

  // Current access list
  const accesses = await prisma.vehicleAccess.findMany({
    where: { vehicleId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const accessList = accesses.map((a) => ({
    id: a.id,
    userId: a.userId,
    role: a.role,
    userName: a.user.name,
    userEmail: a.user.email,
    isCurrentUser: a.userId === dbUser.id,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href={`/dashboard/vehicles/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Access</h1>
          <p className="text-sm text-muted-foreground">
            {vehicle.name}{" "}
            <span className="font-mono">{vehicle.plateNumber}</span>
          </p>
        </div>
      </div>

      <SharePageClient vehicleId={id} initialAccesses={accessList} />
    </div>
  );
}
