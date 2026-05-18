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
        imei: data.imei,
        name: data.name,
        plateNumber: data.plateNumber,
        type: data.type,
        driverName: data.driverName || null,
      }),
    });

    const json = await res.json().catch(() => null) as { error?: string; data?: { id: string } } | null;
    if (!res.ok) return { error: json?.error ?? "Failed to create vehicle." };

    router.push(`/dashboard/vehicles/${json?.data?.id}`);
    router.refresh();
    return {};
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/vehicles" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Vehicle</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details to add a new vehicle to your fleet.
          </p>
        </div>
      </div>

      <VehicleForm onSubmit={handleSubmit} submitLabel="Add Vehicle" />
    </div>
  );
}
