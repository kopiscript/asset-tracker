"use client";

import { useState, useEffect, useCallback } from "react";
import { DynamicMap } from "@/components/map/DynamicMap";
import type { MapVehicle } from "@/components/map/VehicleMap";
import { timeAgo } from "@/lib/format";

// ─── Data hook ────────────────────────────────────────────────────────────
// Calls the simulate/tick endpoint every TICK_MS milliseconds.
// Each tick advances routed vehicles along their KL routes, writes to DB,
// and returns the full updated vehicle list.
const TICK_MS = 5_000; // 5 seconds

function useLiveVehicles(initial: MapVehicle[]) {
  const [vehicles, setVehicles] = useState(initial);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [, forceLabel] = useState(0);

  const tick = useCallback(async () => {
    try {
      const res = await fetch("/api/simulate/tick", { method: "POST" });
      const json = await res.json();
      if (json.data) {
        setVehicles(
          (json.data as MapVehicle[])
            .filter((v) => v.latitude != null && v.longitude != null)
        );
        setLastRefreshed(new Date());
      }
    } catch {
      // Silently keep stale data on network error
    }
  }, []);

  useEffect(() => {
    // Fire once immediately so the map updates without waiting for the first interval
    tick();
    const poll = setInterval(tick, TICK_MS);
    // Re-render the badge label every 5 s
    const label = setInterval(() => forceLabel((n) => n + 1), 5_000);
    return () => {
      clearInterval(poll);
      clearInterval(label);
    };
  }, [tick]);

  return { vehicles, lastRefreshed };
}

// ─── Refresh badge ─────────────────────────────────────────────────────────
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

// ─── Props ────────────────────────────────────────────────────────────────
interface LiveMapProps {
  initialVehicles: MapVehicle[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────
// To reskin: edit RefreshBadge (badge style) or the wrapper div (layout).
// Do NOT edit useLiveVehicles for visual changes.
export function LiveMap({ initialVehicles, className }: LiveMapProps) {
  const { vehicles, lastRefreshed } = useLiveVehicles(initialVehicles);

  return (
    <div className="relative h-full w-full">
      <DynamicMap vehicles={vehicles} className={className} />
      <RefreshBadge date={lastRefreshed} />
    </div>
  );
}
