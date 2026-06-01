"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { timeAgo } from "@/lib/format";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

function makeIcon(status: string) {
  const colour =
    status === "active"
      ? "#22c55e"
      : status === "idle"
        ? "#eab308"
        : "#ef4444";

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

export type HistoryPoint = {
  latitude: number;
  longitude: number;
  /** ISO string of the MY-time timestamp */
  timestampMy: string;
  speedKmh: number | null;
};

interface VehicleMapProps {
  vehicles: MapVehicle[];
  focusVehicleId?: string;
  /** When provided, renders a history polyline instead of live markers */
  historyPath?: HistoryPoint[];
  className?: string;
}

function MapFocus({
  vehicles,
  focusVehicleId,
  historyPath,
}: {
  vehicles: MapVehicle[];
  focusVehicleId?: string;
  historyPath?: HistoryPoint[];
}) {
  const map = useMap();
  const didFocus = useRef(false);

  // History path: always refit when the path changes (user picks a new date range)
  useEffect(() => {
    if (!historyPath || historyPath.length === 0) return;
    const bounds = historyPath.map((p): [number, number] => [p.latitude, p.longitude]);
    map.fitBounds(bounds, { padding: [32, 32], animate: true });
  }, [historyPath, map]);

  // Live focus: fly to the vehicle once on initial mount, then leave zoom alone
  useEffect(() => {
    if (!focusVehicleId || didFocus.current) return;
    const v = vehicles.find((v) => v.id === focusVehicleId);
    if (v) {
      map.setView([v.latitude, v.longitude], 14, { animate: true });
      didFocus.current = true;
    }
  }, [focusVehicleId, vehicles, map]);

  return null;
}

/** Format a "fake UTC" ISO timestamp as MY-time display string */
function formatMyTime(isoString: string): string {
  // The timestamp is stored as MY wall-clock time with UTC timezone digits.
  // We read the UTC parts directly to display the MY time correctly.
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}

const KL_CENTER: [number, number] = [3.139, 101.6869];

export function VehicleMap({
  vehicles,
  focusVehicleId,
  historyPath,
  className = "h-full w-full",
}: VehicleMapProps) {
  const mappable = vehicles.filter(
    (v) => v.latitude != null && v.longitude != null
  );

  const focused = focusVehicleId
    ? mappable.find((v) => v.id === focusVehicleId)
    : undefined;
  const firstVehicle = mappable[0];
  const center: [number, number] =
    historyPath && historyPath.length > 0
      ? [historyPath[0].latitude, historyPath[0].longitude]
      : focused
        ? [focused.latitude, focused.longitude]
        : firstVehicle
          ? [firstVehicle.latitude, firstVehicle.longitude]
          : KL_CENTER;
  const zoom = historyPath ? 13 : focused ? 14 : mappable.length > 0 ? 7 : 10;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        attributionControl={false}
      >
        {/* CartoDB Voyager — closest free tile to Apple Maps */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <MapFocus
          vehicles={mappable}
          focusVehicleId={focusVehicleId}
          historyPath={historyPath}
        />

        {/* ── History path mode ───────────────────────────────────────── */}
        {historyPath && historyPath.length > 0 && (
          <>
            <Polyline
              positions={historyPath.map((p) => [p.latitude, p.longitude])}
              pathOptions={{ color: "#00c2cc", weight: 3, opacity: 0.85 }}
            />
            {/* Start marker */}
            <CircleMarker
              center={[historyPath[0].latitude, historyPath[0].longitude]}
              radius={7}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="text-xs font-medium">Start<br />{formatMyTime(historyPath[0].timestampMy)}</span>
              </Tooltip>
            </CircleMarker>
            {/* End marker */}
            <CircleMarker
              center={[historyPath[historyPath.length - 1].latitude, historyPath[historyPath.length - 1].longitude]}
              radius={7}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="text-xs font-medium">End<br />{formatMyTime(historyPath[historyPath.length - 1].timestampMy)}</span>
              </Tooltip>
            </CircleMarker>
            {/* Intermediate nodes */}
            {historyPath.slice(1, -1).map((p, i) => (
              <CircleMarker
                key={i}
                center={[p.latitude, p.longitude]}
                radius={4}
                pathOptions={{ color: "#00c2cc", fillColor: "#00c2cc", fillOpacity: 0.7, weight: 1 }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <div className="text-xs leading-tight">
                    <div className="font-medium">{formatMyTime(p.timestampMy)}</div>
                    {p.speedKmh != null && (
                      <div className="text-gray-500">{p.speedKmh.toFixed(1)} km/h</div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        )}

        {/* ── Live marker mode ────────────────────────────────────────── */}
        {!historyPath &&
          mappable.map((v) => (
            <Marker
              key={v.id}
              position={[v.latitude, v.longitude]}
              icon={makeIcon(v.status)}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold text-sm mb-0.5">{v.name}</p>
                  <p className="font-mono text-xs text-gray-500 mb-1">{v.plateNumber}</p>
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
                    className="block w-full text-center text-xs bg-primary text-primary-foreground font-semibold px-2 py-1 rounded hover:bg-primary/90 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {!historyPath && mappable.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div className="bg-background/90 text-foreground text-sm px-4 py-2 rounded-lg backdrop-blur-sm border border-border">
            No location data yet
          </div>
        </div>
      )}

      {historyPath && historyPath.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div className="bg-background/90 text-foreground text-sm px-4 py-2 rounded-lg backdrop-blur-sm border border-border">
            No history for this time range
          </div>
        </div>
      )}

      {/* Minimal attribution — required by OSM & CartoDB licences */}
      <div className="absolute bottom-1 right-1 z-[500] pointer-events-none">
        <span className="text-[9px] text-muted-foreground/60 bg-background/70 px-1 rounded">
          © <a href="https://carto.com/" className="hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer">CartoDB</a>
          {" · "}
          <a href="https://www.openstreetmap.org/copyright" className="hover:underline pointer-events-auto" target="_blank" rel="noopener noreferrer">OSM</a>
        </span>
      </div>
    </div>
  );
}
