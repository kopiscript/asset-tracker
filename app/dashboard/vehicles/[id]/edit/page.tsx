/**
 * app/dashboard/vehicles/[id]/edit/page.tsx
 * Edit vehicle details page.
 * In Next.js 16, params is a Promise — must be awaited.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditVehicleClient } from "./EditVehicleClient";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function EditVehiclePage(
  props: PageProps<"/dashboard/vehicles/[id]/edit">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const allowed = await canEdit(dbUser.id, id);
  if (!allowed) return notFound();

  const vehicle = await prisma.vehicle.findUnique({ where: { id: BigInt(id) } });
  if (!vehicle) return notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href={`/dashboard/vehicles/${id}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Vehicle</h1>
          <p className="text-sm text-muted-foreground">{vehicle.name ?? vehicle.imei}</p>
        </div>
      </div>

      <EditVehicleClient
        vehicleId={id}
        defaultValues={{
          imei: vehicle.imei,
          name: vehicle.name ?? "",
          plateNumber: vehicle.plateNumber ?? "",
          type: vehicle.type ?? "",
          driverName: vehicle.driverName ?? "",
          isActive: vehicle.isActive ?? true,
        }}
      />
    </div>
  );
}
