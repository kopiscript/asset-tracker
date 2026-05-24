/**
 * components/dashboard/VehicleForm.tsx
 * Reusable form for creating and editing a vehicle.
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

const VEHICLE_TYPES = ["Car", "Van", "Truck", "Motorcycle", "Bus"] as const;

export type VehicleFormData = {
  imei: string;
  name: string;
  plateNumber: string;
  type: string;
  driverName: string;
  isActive: boolean;
};

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormData>;
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
    imei: defaultValues.imei ?? "",
    name: defaultValues.name ?? "",
    plateNumber: defaultValues.plateNumber ?? "",
    type: defaultValues.type ?? "Car",
    driverName: defaultValues.driverName ?? "",
    isActive: defaultValues.isActive ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {};
    if (!form.imei.trim()) newErrors.imei = "IMEI is required.";
    if (!form.name.trim()) newErrors.name = "Vehicle name is required.";
    if (!form.plateNumber.trim()) newErrors.plateNumber = "Plate number is required.";
    if (!form.type) newErrors.type = "Vehicle type is required.";
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

      <FormField label="IMEI *" error={errors.imei} hint="Unique device identifier from the GPS hardware">
        <Input
          value={form.imei}
          onChange={(e) => set("imei", e.target.value.trim())}
          placeholder="e.g. 862000012345678"
          className="bg-card border-border/50 font-mono"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle Name *" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
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

        <FormField label="Driver Name" error={errors.driverName}>
          <Input
            value={form.driverName}
            onChange={(e) => set("driverName", e.target.value)}
            placeholder="e.g. Ahmad bin Ali"
            className="bg-card border-border/50"
          />
        </FormField>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
        >
          {loading ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="active:scale-[0.98] transition-transform"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

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
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
