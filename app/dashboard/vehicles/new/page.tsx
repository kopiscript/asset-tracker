/**
 * app/dashboard/vehicles/new/page.tsx
 * Page for adding a new vehicle.
 * Calls POST /api/vehicles on submit, then redirects to the new vehicle page.
 */
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleForm, type VehicleFormData } from "@/components/dashboard/VehicleForm";

export default function NewVehiclePage() {
  const router = useRouter();

  async function handleSubmit(data: VehicleFormData) {
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        plateNumber: data.plateNumber,
        type: data.type,
        status: data.status,
        fuelLevel: data.fuelLevel ? parseInt(data.fuelLevel) : null,
        mileage: data.mileage ? parseInt(data.mileage) : null,
        driverName: data.driverName || null,
        notes: data.notes || null,
        imageUrl: data.imageUrl || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      }),
    });

    const json = await res.json();
    if (!res.ok) return { error: json.error ?? "Failed to create vehicle." };

    // Redirect to the new vehicle's detail page
    router.push(`/dashboard/vehicles/${json.data.id}`);
    router.refresh();
    return {};
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/vehicles" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Vehicle</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to add a new vehicle to your fleet.
          </p>
        </div>
      </div>

      <VehicleForm onSubmit={handleSubmit} submitLabel="Add Vehicle" />
    </div>
  );
}
