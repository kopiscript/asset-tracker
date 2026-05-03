/**
 * app/dashboard/vehicles/[id]/edit/EditVehicleClient.tsx
 * Client component that renders the VehicleForm for editing.
 * Calls PATCH /api/vehicles/[id] on submit.
 */
"use client";

import { useRouter } from "next/navigation";
import { VehicleForm, type VehicleFormData } from "@/components/dashboard/VehicleForm";

interface EditVehicleClientProps {
  vehicleId: string;
  defaultValues: Partial<VehicleFormData>;
}

export function EditVehicleClient({
  vehicleId,
  defaultValues,
}: EditVehicleClientProps) {
  const router = useRouter();

  async function handleSubmit(data: VehicleFormData) {
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "PATCH",
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
    if (!res.ok) return { error: json.error ?? "Failed to update vehicle." };

    router.push(`/dashboard/vehicles/${vehicleId}`);
    router.refresh();
    return {};
  }

  return (
    <VehicleForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  );
}
