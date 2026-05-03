/**
 * app/dashboard/vehicles/page.tsx
 * Lists all vehicles the current user owns or has access to.
 * Fetches data from the /api/vehicles API route (server-side).
 */
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiclesClient } from "./VehiclesClient";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";

export default async function VehiclesPage() {
  // Ensure the current user exists in our DB and get their record
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view vehicles.</p>
      </div>
    );
  }

  // Fetch all vehicle accesses for this user, including vehicle details
  const accesses = await prisma.vehicleAccess.findMany({
    where: { userId: dbUser.id },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          plateNumber: true,
          type: true,
          status: true,
          fuelLevel: true,
          mileage: true,
          driverName: true,
          lastSeenAt: true,
          imageUrl: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Shape data for the client component
  const vehicles = accesses.map((a) => ({
    ...a.vehicle,
    lastSeenAt: a.vehicle.lastSeenAt?.toISOString() ?? null,
    userRole: a.role,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          className="gap-2 bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
          render={<Link href="/dashboard/vehicles/new" />}
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Vehicles grid — client component handles filtering/search */}
      <VehiclesClient initialVehicles={vehicles} />
    </div>
  );
}
