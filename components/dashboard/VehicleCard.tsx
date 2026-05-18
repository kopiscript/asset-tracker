/**
 * components/dashboard/VehicleCard.tsx
 * Card component that displays a single vehicle's summary.
 */
"use client";

import Link from "next/link";
import { Car, Edit, Share2, MapPin, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useLang } from "@/components/LanguageProvider";
import { timeAgo } from "@/lib/format";

export type VehicleCardData = {
  id: string;
  imei: string;
  name: string | null;
  plateNumber: string | null;
  type: string | null;
  status: string;
  driverName: string | null;
  lastSeenAt: string | null;
  latitude: number | null;
  longitude: number | null;
  userRole: string;
};

interface VehicleCardProps {
  vehicle: VehicleCardData;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { tr } = useLang();
  const canEdit = vehicle.userRole === "editor" || vehicle.userRole === "owner";
  const canShare = vehicle.userRole === "owner";

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/20 transition-all duration-300 flex flex-col">
      {/* ── Vehicle placeholder ─────────────────────────────────────── */}
      <div className="h-32 bg-secondary flex items-center justify-center relative flex-shrink-0">
        <Car className="h-12 w-12 text-primary/30" />
        <div className="absolute top-2 right-2">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* ── Card body ───────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">
            {vehicle.name ?? vehicle.imei}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs bg-muted text-foreground px-2 py-0.5 rounded border border-border">
              {vehicle.plateNumber ?? "—"}
            </span>
            {vehicle.type && (
              <Badge variant="secondary" className="text-xs">
                {vehicle.type}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
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

        <div className="flex-1" />

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
