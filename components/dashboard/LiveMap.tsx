"use client";

import { useState, useEffect, useCallback } from "react";
import { DynamicMap } from "@/components/map/DynamicMap";
import type { MapVehicle } from "@/components/map/VehicleMap";
import { timeAgo } from "@/lib/format";

const POLL_MS = 60_000; // poll every 60 seconds

function useLiveVehicles(initial: MapVehicle[]) {
  const [vehicles, setVehicles] = useState(initial);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [, forceLabel] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (json.data) {
        setVehicles(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (json.data as any[])
            .filter((v) => v.latitude != null && v.longitude != null)
            .map((v) => ({
              id: v.id,
              name: v.name ?? v.imei,
              plateNumber: v.plateNumber ?? "",
              status: v.status,
              latitude: v.latitude,
              longitude: v.longitude,
              lastSeenAt: v.lastSeenAt,
            }))
        );
        setLastRefreshed(new Date());
      }
    } catch {
      // silently keep stale data on network error
    }
  }, []);

  useEffect(() => {
    refresh(); // fetch immediately so stale server-side data is updated right away
    const poll = setInterval(refresh, POLL_MS);
    const label = setInterval(() => forceLabel((n) => n + 1), 10_000);
    return () => {
      clearInterval(poll);
      clearInterval(label);
    };
  }, [refresh]);

  return { vehicles, lastRefreshed };
}

function RefreshBadge({ date }: { date: Date }) {
  return (
    <span className="
      absolute bottom-3 right-3 z-[1000]
      flex items-center gap-1.5
      text-[11px] font-medium tracking-wide
      text-muted-foreground
      px-2.5 py-1 rounded-full
      bg-background/80 backdrop-blur-md
      border border-border
      pointer-events-none select-none
    ">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      Live · {timeAgo(date)}
    </span>
  );
}

interface LiveMapProps {
  initialVehicles: MapVehicle[];
  className?: string;
}

export function LiveMap({ initialVehicles, className }: LiveMapProps) {
  const { vehicles, lastRefreshed } = useLiveVehicles(initialVehicles);

  return (
    <div className="relative h-full w-full">
      <DynamicMap vehicles={vehicles} className={className} />
      <RefreshBadge date={lastRefreshed} />
    </div>
  );
}
