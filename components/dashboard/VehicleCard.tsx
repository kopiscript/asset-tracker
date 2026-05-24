"use client";

import Link from "next/link";
import { Car, Edit, Share2, MapPin, Clock, User } from "lucide-react";
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

const statusAccent: Record<string, string> = {
  active:  "bg-green-500",
  idle:    "bg-amber-400",
  offline: "bg-zinc-300",
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { tr } = useLang();
  const canEdit  = vehicle.userRole === "editor" || vehicle.userRole === "owner";
  const canShare = vehicle.userRole === "owner";
  const accent   = statusAccent[vehicle.status] ?? statusAccent.offline;

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/20 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.07)] transition-all duration-200 flex flex-col group">
      {/* Status accent line */}
      <div className={`h-0.5 w-full ${accent}`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Header: name + status badge */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate mb-1.5">
              {vehicle.name ?? vehicle.imei}
            </h3>
            <span className="font-mono text-xs bg-muted text-foreground px-2 py-0.5 rounded-md border border-border/60">
              {vehicle.plateNumber ?? "—"}
            </span>
          </div>
          <StatusBadge status={vehicle.status} />
        </div>

        {/* Meta rows */}
        <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
          {vehicle.type && (
            <div className="flex items-center gap-1.5">
              <Car className="h-3 w-3 shrink-0" />
              <span className="capitalize">{vehicle.type}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{vehicle.driverName ?? tr("noDriver")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{timeAgo(vehicle.lastSeenAt)}</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-1.5 pt-3 border-t border-border/40">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 min-w-0 gap-1.5 h-8 text-xs active:scale-[0.98] transition-transform"
            render={<Link href={`/dashboard/vehicles/${vehicle.id}`} />}
          >
            <MapPin className="h-3 w-3" />
            {tr("viewOnMap")}
          </Button>

          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 active:scale-[0.98] transition-transform"
              render={<Link href={`/dashboard/vehicles/${vehicle.id}/edit`} />}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}

          {canShare && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 active:scale-[0.98] transition-transform"
              render={<Link href={`/dashboard/vehicles/${vehicle.id}/share`} />}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
