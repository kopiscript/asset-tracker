/**
 * app/dashboard/vehicles/page.tsx
 * Lists all vehicles the current user owns or has access to.
 */
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiclesClient } from "./VehiclesClient";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

function deriveStatus(isActive: boolean | null, lastSeenAt: Date | null): string {
  if (!isActive) return "offline";
  if (!lastSeenAt) return "idle";
  const minAgo = (Date.now() - lastSeenAt.getTime()) / 60000;
  return minAgo < 10 ? "active" : minAgo < 60 ? "idle" : "offline";
}

export default async function VehiclesPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view vehicles.</p>
      </div>
    );
  }

  const accesses = await prisma.vehicleAccess.findMany({
    where: { userId: dbUser.id },
    include: {
      vehicle: {
        select: {
          id: true,
          imei: true,
          name: true,
          plateNumber: true,
          type: true,
          isActive: true,
          driverName: true,
          telemetryRecords: {
            orderBy: { timestampUtc: "desc" },
            take: 1,
            select: { latitude: true, longitude: true, timestampUtc: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const vehicles = accesses.map((a) => {
    const latest = a.vehicle.telemetryRecords[0] ?? null;
    return {
      id: a.vehicle.id.toString(),
      imei: a.vehicle.imei,
      name: a.vehicle.name,
      plateNumber: a.vehicle.plateNumber,
      type: a.vehicle.type,
      driverName: a.vehicle.driverName,
      isActive: a.vehicle.isActive,
      latitude: latest?.latitude ?? null,
      longitude: latest?.longitude ?? null,
      lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
      status: deriveStatus(a.vehicle.isActive, latest?.timestampUtc ?? null),
      userRole: a.role,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          render={<Link href="/dashboard/vehicles/new" />}
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <VehiclesClient initialVehicles={vehicles} />
    </div>
  );
}
