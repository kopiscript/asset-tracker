/**
 * components/dashboard/VehicleCard.tsx
 * Card component that displays a single vehicle's summary.
 * Shows status, fuel level, mileage, driver, and action buttons.
 * Buttons are conditionally shown based on the user's role.
 */
"use client";

import Link from "next/link";
import { Car, Edit, Share2, MapPin, Clock, Gauge, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FuelBar } from "@/components/FuelBar";
import { useLang } from "@/components/LanguageProvider";
import { timeAgo, formatNumber } from "@/lib/format";

// Shape of a vehicle as returned by the API
export type VehicleCardData = {
  id: string;
  name: string;
  plateNumber: string;
  type: string;
  status: string;
  fuelLevel: number | null;
  mileage: number | null;
  driverName: string | null;
  lastSeenAt: string | null; // ISO string
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  userRole: string; // "viewer" | "editor" | "owner"
};

interface VehicleCardProps {
  vehicle: VehicleCardData;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { tr } = useLang();
  const canEdit = vehicle.userRole === "editor" || vehicle.userRole === "owner";
  const canShare = vehicle.userRole === "owner";

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-[#00c2cc]/30 hover:shadow-[0_0_20px_rgba(0,194,204,0.05)] transition-all duration-300 flex flex-col">
      {/* ── Vehicle image / placeholder ─────────────────────────────── */}
      <div className="h-32 bg-[#1e2d3d] flex items-center justify-center relative flex-shrink-0">
        {vehicle.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.imageUrl}
            alt={vehicle.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Car className="h-12 w-12 text-[#00c2cc]/30" />
        )}
        {/* Status badge overlaid on image */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name + plate + type */}
        <div className="mb-3">
          <h3 className="font-semibold text-white text-sm leading-tight mb-1">
            {vehicle.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Plate number in monospace badge */}
            <span className="font-mono text-xs bg-white/10 text-white px-2 py-0.5 rounded border border-white/10">
              {vehicle.plateNumber}
            </span>
            {/* Vehicle type badge */}
            <Badge variant="secondary" className="text-xs">
              {vehicle.type}
            </Badge>
          </div>
        </div>

        {/* Fuel bar */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">{tr("fuelLevel")}</p>
          <FuelBar level={vehicle.fuelLevel} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="h-3 w-3" />
            <span>
              {vehicle.mileage != null
                ? `${formatNumber(vehicle.mileage)} km`
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">
              {vehicle.driverName ?? tr("noDriver")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(vehicle.lastSeenAt)}</span>
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button size="sm" variant="outline" className="flex-1 min-w-0 gap-1.5" render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}>
            <MapPin className="h-3 w-3" />
            <span className="text-xs">{tr("viewOnMap")}</span>
          </Button>

          {canEdit && (
            <Button size="sm" variant="outline" className="gap-1.5" render={<Link href={`/dashboard/vehicles/${vehicle.id}/edit`} />}>
              <Edit className="h-3 w-3" />
              <span className="text-xs sr-only sm:not-sr-only">{tr("editVehicle")}</span>
            </Button>
          )}

          {canShare && (
            <Button size="sm" variant="outline" className="gap-1.5" render={<Link href={`/dashboard/vehicles/${vehicle.id}/share`} />}>
              <Share2 className="h-3 w-3" />
              <span className="text-xs sr-only sm:not-sr-only">{tr("shareVehicle")}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
