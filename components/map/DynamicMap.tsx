/**
 * components/map/DynamicMap.tsx
 * Re-exports VehicleMap as a dynamically-imported client component with SSR disabled.
 *
 * Leaflet uses window and document, which don't exist on the server.
 * Always import THIS file instead of VehicleMap directly from server components
 * or layouts. Example:
 *
 *   import { DynamicMap } from "@/components/map/DynamicMap"
 *   <DynamicMap vehicles={[...]} />
 */
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapVehicle, HistoryPoint } from "./VehicleMap";

const VehicleMapNoSSR = dynamic(
  () => import("./VehicleMap").then((m) => ({ default: m.VehicleMap })),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full rounded-lg bg-[#1e2d3d]" />
    ),
  }
);

interface DynamicMapProps {
  vehicles: MapVehicle[];
  focusVehicleId?: string;
  historyPath?: HistoryPoint[];
  className?: string;
}

export function DynamicMap(props: DynamicMapProps) {
  return <VehicleMapNoSSR {...props} />;
}
