/**
 * components/dashboard/VehicleForm.tsx
 * Reusable form for creating and editing a vehicle.
 * Receives defaultValues for the edit case, and an onSubmit callback.
 * Handles validation and shows inline error messages.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✏️ EDIT: Add more vehicle types here if needed
const VEHICLE_TYPES = ["Car", "Van", "Truck", "Motorcycle", "Bus"] as const;

export type VehicleFormData = {
  name: string;
  plateNumber: string;
  type: string;
  status: string;
  fuelLevel: string; // stored as string in form, parsed to int before submit
  mileage: string;
  driverName: string;
  notes: string;
  imageUrl: string;
  latitude: string;
  longitude: string;
};

interface VehicleFormProps {
  /** Pre-filled values for edit mode */
  defaultValues?: Partial<VehicleFormData>;
  /** Called with cleaned form data — should make the API call */
  onSubmit: (data: VehicleFormData) => Promise<{ error?: string }>;
  submitLabel?: string;
}

export function VehicleForm({
  defaultValues = {},
  onSubmit,
  submitLabel = "Save Vehicle",
}: VehicleFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleFormData>({
    name: defaultValues.name ?? "",
    plateNumber: defaultValues.plateNumber ?? "",
    type: defaultValues.type ?? "Car",
    status: defaultValues.status ?? "offline",
    fuelLevel: defaultValues.fuelLevel ?? "",
    mileage: defaultValues.mileage ?? "",
    driverName: defaultValues.driverName ?? "",
    notes: defaultValues.notes ?? "",
    imageUrl: defaultValues.imageUrl ?? "",
    latitude: defaultValues.latitude ?? "",
    longitude: defaultValues.longitude ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof VehicleFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Vehicle name is required.";
    if (!form.plateNumber.trim()) newErrors.plateNumber = "Plate number is required.";
    if (!form.type) newErrors.type = "Vehicle type is required.";
    if (form.fuelLevel && (isNaN(Number(form.fuelLevel)) || Number(form.fuelLevel) < 0 || Number(form.fuelLevel) > 100)) {
      newErrors.fuelLevel = "Fuel level must be between 0 and 100.";
    }
    if (form.mileage && (isNaN(Number(form.mileage)) || Number(form.mileage) < 0)) {
      newErrors.mileage = "Mileage must be a positive number.";
    }
    if (form.latitude && isNaN(Number(form.latitude))) {
      newErrors.latitude = "Latitude must be a number.";
    }
    if (form.longitude && isNaN(Number(form.longitude))) {
      newErrors.longitude = "Longitude must be a number.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    const result = await onSubmit(form);
    setLoading(false);
    if (result.error) {
      setServerError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {serverError}
        </div>
      )}

      {/* ── Required fields ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle Name *" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            // ✏️ EDIT: Change the placeholder to match your naming convention
            placeholder="e.g. Company Van 01"
            className="bg-card border-border/50"
          />
        </FormField>

        <FormField label="Plate Number *" error={errors.plateNumber}>
          <Input
            value={form.plateNumber}
            onChange={(e) => set("plateNumber", e.target.value.toUpperCase())}
            placeholder="e.g. WXY 1234"
            className="bg-card border-border/50 font-mono"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle Type *" error={errors.type}>
          <Select value={form.type} onValueChange={(v) => v && set("type", v)}>
            <SelectTrigger className="bg-card border-border/50">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Status" error={errors.status}>
          <Select value={form.status} onValueChange={(v) => v && set("status", v)}>
            <SelectTrigger className="bg-card border-border/50">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* ── Optional fields ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Fuel Level (%)" error={errors.fuelLevel} hint="0–100">
          <Input
            value={form.fuelLevel}
            onChange={(e) => set("fuelLevel", e.target.value)}
            type="number"
            min={0}
            max={100}
            placeholder="e.g. 75"
            className="bg-card border-border/50"
          />
        </FormField>

        <FormField label="Mileage (km)" error={errors.mileage}>
          <Input
            value={form.mileage}
            onChange={(e) => set("mileage", e.target.value)}
            type="number"
            min={0}
            placeholder="e.g. 12450"
            className="bg-card border-border/50"
          />
        </FormField>
      </div>

      <FormField label="Driver Name" error={errors.driverName}>
        <Input
          value={form.driverName}
          onChange={(e) => set("driverName", e.target.value)}
          placeholder="e.g. Ahmad bin Ali"
          className="bg-card border-border/50"
        />
      </FormField>

      <FormField label="Vehicle Image URL" error={errors.imageUrl} hint="Optional — direct link to a photo">
        <Input
          value={form.imageUrl}
          onChange={(e) => set("imageUrl", e.target.value)}
          placeholder="https://example.com/van.jpg"
          className="bg-card border-border/50"
          type="url"
        />
      </FormField>

      {/* GPS coordinates */}
      <div>
        <p className="text-sm font-medium text-white mb-2">GPS Location (optional)</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Latitude" error={errors.latitude} hint="e.g. 3.1390">
            <Input
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="3.1390"
              className="bg-card border-border/50 font-mono"
            />
          </FormField>
          <FormField label="Longitude" error={errors.longitude} hint="e.g. 101.6869">
            <Input
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="101.6869"
              className="bg-card border-border/50 font-mono"
            />
          </FormField>
        </div>
      </div>

      <FormField label="Notes" error={errors.notes}>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any additional notes about this vehicle…"
          rows={3}
          className="w-full rounded-md border border-border/50 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </FormField>

      {/* Submit + cancel */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
        >
          {loading ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Field wrapper with label + error message ─────────────────────────────
function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-white">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
