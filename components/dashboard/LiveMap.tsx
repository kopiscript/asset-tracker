"use client";

import { useState, useEffect, useCallback } from "react";
import { DynamicMap } from "@/components/map/DynamicMap";
import type { MapVehicle } from "@/components/map/VehicleMap";
import { timeAgo } from "@/lib/format";

const POLL_MS = 60_000; // fleet overview: 60s is sufficient

function useLiveVehicles(initial: MapVehicle[]) {
  const [vehicles, setVehicles] = useState(initial);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [, forceLabel] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (json.data) {
        setVehicles((prev) => {
          const prevMap = new Map(prev.map((v) => [v.id, v]));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const seen = new Set<string>();
          const next: MapVehicle[] = [];

          for (const v of json.data as any[]) {
            seen.add(v.id);
            if (v.latitude != null && v.longitude != null) {
              next.push({
                id: v.id,
                name: v.name ?? v.imei,
                plateNumber: v.plateNumber ?? "",
                status: v.status,
                latitude: v.latitude,
                longitude: v.longitude,
                lastSeenAt: v.lastSeenAt,
              });
            } else {
              // Null coords: keep last known position, update status + lastSeenAt
              const existing = prevMap.get(v.id);
              if (existing) next.push({ ...existing, status: v.status, lastSeenAt: v.lastSeenAt });
            }
          }

          // Vehicle absent from response (empty array or transient gap): keep it
          for (const [id, v] of prevMap) {
            if (!seen.has(id)) next.push(v);
          }

          return next;
        });
        setLastRefreshed(new Date());
      }
    } catch {
      // silently keep stale data on network error
    }
  }, []);

  useEffect(() => {
    refresh();
    let poll = setInterval(refresh, POLL_MS);
    const label = setInterval(() => forceLabel((n) => n + 1), 10_000);

    function handleVisibility() {
      if (document.hidden) {
        clearInterval(poll);
      } else {
        refresh();
        poll = setInterval(refresh, POLL_MS);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(poll);
      clearInterval(label);
      document.removeEventListener("visibilitychange", handleVisibility);
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
