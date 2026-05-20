"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, FileText, User, Gauge, Route, Calendar, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DynamicMap } from "@/components/map/DynamicMap";
import type { MapVehicle, HistoryPoint } from "@/components/map/VehicleMap";
import { timeAgo } from "@/lib/format";

// ─── Helpers ──────────────────────────────────────────────────────────────

function myNow(): string {
  const MY_OFFSET_MS = 8 * 60 * 60 * 1000;
  const d = new Date(Date.now() + MY_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}

function myMidnight(): string {
  const MY_OFFSET_MS = 8 * 60 * 60 * 1000;
  const d = new Date(Date.now() + MY_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T00:00`;
}

// ─── Types ────────────────────────────────────────────────────────────────

interface VehicleInfo {
  id: string;
  imei: string;
  name: string | null;
  plateNumber: string | null;
  driverName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  userRole: string;
}

interface VehicleDetailTabsProps {
  vehicle: VehicleInfo;
  mapVehicles: MapVehicle[];
  lastSeenAt: string | null;
  speed: number | null;
  todayKm: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground mt-0.5">{children}</div>
      </div>
    </div>
  );
}

// ─── Live single-vehicle hook ─────────────────────────────────────────────

const SINGLE_VEHICLE_POLL_MS = 10_000;

function useLiveVehicle(
  vehicleId: string,
  initial: {
    mapVehicles: MapVehicle[];
    lastSeenAt: string | null;
    speed: number | null;
  }
) {
  const [mapVehicles, setMapVehicles] = useState(initial.mapVehicles);
  const [lastSeenAt, setLastSeenAt]   = useState(initial.lastSeenAt);
  const [speed, setSpeed]             = useState(initial.speed);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch(`/api/vehicles/${vehicleId}`);
      const json = await res.json() as { data?: Record<string, unknown> | null };
      if (!json.data) return;
      const v = json.data;

      setLastSeenAt((v.lastSeenAt as string | null) ?? null);
      setSpeed((v.speed as number | null) ?? null);

      if (v.latitude != null && v.longitude != null) {
        setMapVehicles([{
          id: vehicleId,
          name: (v.name as string | null) ?? vehicleId,
          plateNumber: (v.plateNumber as string | null) ?? "",
          status: v.status as string,
          latitude:  v.latitude  as number,
          longitude: v.longitude as number,
          lastSeenAt: (v.lastSeenAt as string | null) ?? null,
        }]);
      } else {
        // Null coords: keep last known position, update status only
        setMapVehicles((prev) =>
          prev.length > 0
            ? [{ ...prev[0], status: v.status as string, lastSeenAt: (v.lastSeenAt as string | null) ?? null }]
            : prev
        );
      }
    } catch {
      // keep stale on error
    }
  }, [vehicleId]);

  useEffect(() => {
    refresh();
    let poll = setInterval(refresh, SINGLE_VEHICLE_POLL_MS);

    function handleVisibility() {
      if (document.hidden) {
        clearInterval(poll);
      } else {
        refresh();
        poll = setInterval(refresh, SINGLE_VEHICLE_POLL_MS);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  return { mapVehicles, lastSeenAt, speed };
}

// ─── Overview tab (mounts/unmounts with tab — stops polling on history tab) ──

function OverviewTab({
  vehicle,
  initialMapVehicles,
  initialLastSeenAt,
  initialSpeed,
  todayKm,
}: {
  vehicle: VehicleInfo;
  initialMapVehicles: MapVehicle[];
  initialLastSeenAt: string | null;
  initialSpeed: number | null;
  todayKm: number;
}) {
  const { mapVehicles, lastSeenAt, speed } = useLiveVehicle(vehicle.id, {
    mapVehicles: initialMapVehicles,
    lastSeenAt:  initialLastSeenAt,
    speed:       initialSpeed,
  });

  const hasLocation = mapVehicles.length > 0;

  return (
    <div className="space-y-4">
      {/* Current position map */}
      <div className="h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden border border-border/50">
        <DynamicMap
          vehicles={mapVehicles}
          focusVehicleId={vehicle.id}
          className="h-full w-full"
        />
      </div>
      {!hasLocation && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          No GPS location recorded yet. Map is centred on Kuala Lumpur.
        </p>
      )}

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle info */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Vehicle Info</h2>
          <div className="space-y-3">
            <DetailRow icon={<User className="h-4 w-4" />} label="Driver">
              {vehicle.driverName ?? "No driver assigned"}
            </DetailRow>
            <Separator className="bg-border/50" />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Last Seen">
              {lastSeenAt ? timeAgo(lastSeenAt) : "Never"}
            </DetailRow>
            <Separator className="bg-border/50" />
            <DetailRow icon={<FileText className="h-4 w-4" />} label="IMEI">
              <span className="font-mono text-xs">{vehicle.imei}</span>
            </DetailRow>
            <Separator className="bg-border/50" />
            <DetailRow icon={<Gauge className="h-4 w-4" />} label="Current Speed">
              {speed != null ? `${speed.toFixed(1)} km/h` : "—"}
            </DetailRow>
            <Separator className="bg-border/50" />
            <DetailRow icon={<Route className="h-4 w-4" />} label="Today's Mileage">
              {todayKm > 0 ? `${todayKm.toFixed(1)} km` : "—"}
            </DetailRow>
          </div>
        </div>

        {/* Additional info */}
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Additional Info</h2>
          <div className="space-y-3">
            <DetailRow icon={<User className="h-4 w-4" />} label="Owner">
              {vehicle.ownerName ?? vehicle.ownerEmail ?? "—"}
            </DetailRow>
            <Separator className="bg-border/50" />
            <DetailRow icon={<div className="h-4 w-4 text-xs flex items-center">👤</div>} label="Your Role">
              <span className="capitalize">{vehicle.userRole}</span>
            </DetailRow>
            {hasLocation && (
              <>
                <Separator className="bg-border/50" />
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Coordinates">
                  <span className="font-mono text-xs">
                    {mapVehicles[0].latitude.toFixed(5)}, {mapVehicles[0].longitude.toFixed(5)}
                  </span>
                </DetailRow>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────

function HistoryTab({ vehicleId }: { vehicleId: string }) {
  const [from, setFrom] = useState(myMidnight);
  const [to, setTo]     = useState(myNow);
  const [points, setPoints]   = useState<HistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/vehicles/${vehicleId}/history?from=${f}Z&to=${t}Z`);
      const json = await res.json() as { data?: HistoryPoint[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to load history.");
      } else {
        setPoints(json.data ?? []);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  // Auto-load on first mount with default range (today)
  useEffect(() => { load(from, to); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="bg-card border border-border/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> From (MY time)
            </label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> To (MY time)
            </label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-shrink-0"
            onClick={() => load(from, to)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />}
            {loading ? "Loading…" : "Load Path"}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}
        {points !== null && !loading && (
          <p className="text-xs text-muted-foreground mt-2">
            {points.length} point{points.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* ── History map ──────────────────────────────────────────────── */}
      <div className="h-72 sm:h-96 rounded-xl overflow-hidden border border-border/50">
        <DynamicMap
          vehicles={[]}
          historyPath={points ?? undefined}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function VehicleDetailTabs({
  vehicle,
  mapVehicles,
  lastSeenAt,
  speed,
  todayKm,
}: VehicleDetailTabsProps) {
  const [tab, setTab] = useState<"overview" | "history">("overview");

  return (
    <div>
      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-4 sm:px-6 mb-4 border-b border-border">
        {(["overview", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              px-4 py-2.5 text-sm font-medium capitalize transition-colors relative
              ${tab === t
                ? "text-primary after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-primary after:rounded-t-full"
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-6 pb-8">
        {tab === "overview" && (
          <OverviewTab
            vehicle={vehicle}
            initialMapVehicles={mapVehicles}
            initialLastSeenAt={lastSeenAt}
            initialSpeed={speed}
            todayKm={todayKm}
          />
        )}
        {tab === "history" && <HistoryTab vehicleId={vehicle.id} />}
      </div>
    </div>
  );
}
