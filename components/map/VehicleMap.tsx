/**
 * components/map/VehicleMap.tsx
 * Interactive Leaflet map showing vehicle locations.
 * Uses OpenStreetMap tiles — completely free, no API key needed.
 *
 * Markers are colour-coded:
 *   🟢 green  = active
 *   🟡 yellow = idle
 *   🔴 red    = offline
 *
 * Must be used as a client component because Leaflet uses browser APIs.
 * Import it with dynamic() and ssr: false to avoid server-side errors.
 */
"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { timeAgo } from "@/lib/format";

// ─── Fix Leaflet's default icon path (broken in Webpack / Next.js) ────────
// Leaflet tries to load marker icons from a relative path that doesn't exist.
// We override it with a data URI approach using divIcon instead.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

/** Creates a coloured circle marker icon for a given vehicle status */
function makeIcon(status: string) {
  const colour =
    status === "active"
      ? "#22c55e"  // green-500
      : status === "idle"
        ? "#eab308" // yellow-500
        : "#ef4444"; // red-500

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${colour};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

// ─── Types ────────────────────────────────────────────────────────────────
export type MapVehicle = {
  id: string;
  name: string;
  plateNumber: string;
  status: string;
  latitude: number;
  longitude: number;
  lastSeenAt: string | null;
};

interface VehicleMapProps {
  vehicles: MapVehicle[];
  /** If provided, centres the map on this vehicle */
  focusVehicleId?: string;
  className?: string;
}

// ─── Helper: re-centres the map when focusVehicleId changes ──────────────
function MapFocus({
  vehicles,
  focusVehicleId,
}: {
  vehicles: MapVehicle[];
  focusVehicleId?: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusVehicleId) return;
    const v = vehicles.find((v) => v.id === focusVehicleId);
    if (v) {
      map.setView([v.latitude, v.longitude], 14, { animate: true });
    }
  }, [focusVehicleId, vehicles, map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────
// Default centre: Kuala Lumpur, Malaysia
const KL_CENTER: [number, number] = [3.139, 101.6869];

export function VehicleMap({
  vehicles,
  focusVehicleId,
  className = "h-full w-full",
}: VehicleMapProps) {
  // Filter to only vehicles with GPS coordinates
  const mappable = vehicles.filter(
    (v) => v.latitude != null && v.longitude != null
  );

  // Calculate initial centre: focused vehicle, first vehicle, or KL
  const focused = focusVehicleId
    ? mappable.find((v) => v.id === focusVehicleId)
    : undefined;
  const firstVehicle = mappable[0];
  const center: [number, number] = focused
    ? [focused.latitude, focused.longitude]
    : firstVehicle
      ? [firstVehicle.latitude, firstVehicle.longitude]
      : KL_CENTER;
  const zoom = focused ? 14 : mappable.length > 0 ? 7 : 10;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        {/* OpenStreetMap tiles — free forever, no API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Re-centre when focusVehicleId changes */}
        <MapFocus vehicles={mappable} focusVehicleId={focusVehicleId} />

        {/* Render a marker for each vehicle */}
        {mappable.map((v) => (
          <Marker
            key={v.id}
            position={[v.latitude, v.longitude]}
            icon={makeIcon(v.status)}
          >
            <Popup>
              {/* Popup card */}
              <div className="min-w-[160px]">
                <p className="font-semibold text-sm mb-0.5">{v.name}</p>
                <p className="font-mono text-xs text-gray-500 mb-1">
                  {v.plateNumber}
                </p>
                <p className="text-xs capitalize mb-1">
                  Status:{" "}
                  <span
                    className={
                      v.status === "active"
                        ? "text-green-600"
                        : v.status === "idle"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }
                  >
                    {v.status}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {v.lastSeenAt ? timeAgo(v.lastSeenAt) : "No location data"}
                </p>
                <Link
                  href={`/dashboard/vehicles/${v.id}`}
                  className="block w-full text-center text-xs bg-[#00c2cc] text-[#0f1923] font-semibold px-2 py-1 rounded hover:bg-[#009aa3] transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay when no vehicles have GPS data */}
      {mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm">
            No location data yet
          </div>
        </div>
      )}
    </div>
  );
}
