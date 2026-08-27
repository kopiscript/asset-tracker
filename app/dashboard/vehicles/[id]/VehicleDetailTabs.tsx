"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin, Clock, FileText, User, Gauge, Route, Calendar, Loader2, ChevronRight,
  Navigation, Satellite, Signal, Mountain, Activity, BatteryMedium,
  Fuel, Thermometer, Wind, Zap, ChevronDown, PanelRightClose, PanelRightOpen,
  Maximize2, Minimize2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DynamicMap } from "@/components/map/DynamicMap";
import { Gauge as ArcGauge } from "@/components/Gauge";
import type { MapVehicle, HistoryPoint, MapGeofence } from "@/components/map/VehicleMap";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/LanguageProvider";
import { BatteryBadge } from "@/components/BatteryBadge";
import { SafetyTab, type TrackingEventData } from "./SafetyTab";
import {
  type VehicleTelemetry, type FuelState, type CoolantState,
  deriveBatteryHealth, drivingState, gpsQuality, GPS_LABEL_KEY,
  gsmSignalQuality, SIGNAL_LABEL_KEY, headingToCompass, gsmOperatorName,
  deriveFuelLevel, FUEL_LABEL_KEY, FUEL_CHIP_CLASS, isLowFuel,
  deriveCoolantTemp, COOLANT_LABEL_KEY, COOLANT_CHIP_CLASS, isOverheating,
} from "@/lib/telemetry";

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
  orgName: string | null;
  userRole: string;
}

interface VehicleDetailTabsProps {
  vehicle: VehicleInfo;
  mapVehicles: MapVehicle[];
  lastSeenAt: string | null;
  speed: number | null;
  todayKm: number;
  telemetry: VehicleTelemetry;
  speedLimitKmh: number | null;
  initialGeofences: MapGeofence[];
  initialEvents: TrackingEventData[];
  userCanEdit: boolean;
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
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="shrink-0">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

// ─── Live single-vehicle hook ─────────────────────────────────────────────

const SINGLE_VEHICLE_POLL_MS = 30_000;

function useLiveVehicle(
  vehicleId: string,
  initial: {
    mapVehicles: MapVehicle[];
    lastSeenAt: string | null;
    speed: number | null;
    telemetry: VehicleTelemetry;
  }
) {
  const [mapVehicles, setMapVehicles] = useState(initial.mapVehicles);
  const [lastSeenAt, setLastSeenAt]   = useState(initial.lastSeenAt);
  const [speed, setSpeed]             = useState(initial.speed);
  const [telemetry, setTelemetry]     = useState(initial.telemetry);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch(`/api/vehicles/${vehicleId}`);
      const json = await res.json() as { data?: Record<string, unknown> | null };
      if (!json.data) return;
      const v = json.data;

      setLastSeenAt((v.lastSeenAt as string | null) ?? null);
      setSpeed((v.speed as number | null) ?? null);
      if (v.telemetry) setTelemetry(v.telemetry as VehicleTelemetry);

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

  return { mapVehicles, lastSeenAt, speed, telemetry };
}

// ─── Overview tab ─────────────────────────────────────────────────────────

function OverviewTab({
  vehicle,
  mapVehicles,
  lastSeenAt,
  speed,
  todayKm,
  telemetry,
}: {
  vehicle: VehicleInfo;
  mapVehicles: MapVehicle[];
  lastSeenAt: string | null;
  speed: number | null;
  todayKm: number;
  telemetry: VehicleTelemetry;
}) {
  const { tr } = useLang();

  const hasLocation = mapVehicles.length > 0;

  // Derived, human-readable telemetry
  const battery = deriveBatteryHealth(telemetry.carBatteryVoltage, telemetry.externalVoltage);
  const move    = drivingState(speed); // from GPS speed, not the noisy accelerometer flag
  const gps     = gpsQuality(telemetry.satellites);
  const sig     = gsmSignalQuality(telemetry.gsmSignal);
  const compass = headingToCompass(telemetry.angle);
  const carrier = gsmOperatorName(telemetry.gsmOperator);
  const hasTelemetry =
    battery.state !== "unknown" || move !== null || gps !== null ||
    sig !== null || telemetry.altitude != null || telemetry.batteryPercent != null;

  const [showPanel, setShowPanel] = useState(true);

  return (
    <div className="relative h-full rounded-xl overflow-hidden border border-border/50">
      <DynamicMap
          vehicles={mapVehicles}
          focusVehicleId={vehicle.id}
          className="h-full w-full"
        />

        {!hasLocation && (
          <p className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 text-xs text-foreground bg-background/85 backdrop-blur-sm border border-border/60 rounded-full px-3 py-1.5">
            <MapPin className="h-3 w-3" />
            {tr("noGpsYet")}
          </p>
        )}

        {showPanel ? (
          <div className="absolute top-3 right-3 z-[500] w-[300px] max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2 sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/40">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{vehicle.name ?? vehicle.id}</h2>
              <button
                onClick={() => setShowPanel(false)}
                aria-label={tr("hidePanel")}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Live status */}
              {hasTelemetry && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{tr("liveStatus")}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatTile icon={<BatteryMedium className="h-4 w-4" />} label={tr("carBattery")}>
                      {battery.state === "unknown"
                        ? "—"
                        : <BatteryBadge state={battery.state} voltage={battery.voltage} showVoltage />}
                    </StatTile>

                    {move !== null && (
                      <StatTile icon={<Activity className="h-4 w-4" />} label={tr("movementState")}>
                        {move === "moving" ? tr("movingState") : tr("parkedState")}
                      </StatTile>
                    )}

                    {gps !== null && (
                      <StatTile icon={<Satellite className="h-4 w-4" />} label={tr("gpsSignal")}>
                        {tr(GPS_LABEL_KEY[gps])}
                        {telemetry.satellites != null && (
                          <span className="text-muted-foreground"> · {telemetry.satellites}</span>
                        )}
                      </StatTile>
                    )}

                    {sig !== null && (
                      <StatTile icon={<Signal className="h-4 w-4" />} label={tr("cellSignal")}>
                        {tr(SIGNAL_LABEL_KEY[sig])}
                        {carrier && <span className="text-muted-foreground"> · {carrier}</span>}
                      </StatTile>
                    )}

                    {compass && (
                      <StatTile icon={<Navigation className="h-4 w-4" />} label={tr("headingLabel")}>
                        {compass}
                      </StatTile>
                    )}

                    {telemetry.altitude != null && (
                      <StatTile icon={<Mountain className="h-4 w-4" />} label={tr("altitudeLabel")}>
                        {Math.round(telemetry.altitude)} m
                      </StatTile>
                    )}

                    {telemetry.batteryPercent != null && (
                      <StatTile icon={<BatteryMedium className="h-4 w-4" />} label={tr("deviceBattery")}>
                        {telemetry.batteryPercent}%
                      </StatTile>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-border/50" />

              {/* Vehicle info */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{tr("vehicleInfo")}</h3>
                <div className="space-y-2.5">
                  <DetailRow icon={<User className="h-4 w-4" />} label={tr("driverName")}>
                    {vehicle.driverName ?? tr("noDriver")}
                  </DetailRow>
                  <DetailRow icon={<Clock className="h-4 w-4" />} label={tr("lastSeen")}>
                    {lastSeenAt ? timeAgo(lastSeenAt) : tr("never")}
                  </DetailRow>
                  <DetailRow icon={<FileText className="h-4 w-4" />} label={tr("imei")}>
                    <span className="font-mono text-xs">{vehicle.imei}</span>
                  </DetailRow>
                  <DetailRow icon={<Gauge className="h-4 w-4" />} label={tr("currentSpeed")}>
                    {speed != null ? `${speed.toFixed(1)} km/h` : "—"}
                  </DetailRow>
                  <DetailRow icon={<Route className="h-4 w-4" />} label={tr("todayMileage")}>
                    {todayKm > 0 ? `${todayKm.toFixed(1)} km` : "—"}
                  </DetailRow>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Additional info */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{tr("additionalInfo")}</h3>
                <div className="space-y-2.5">
                  <DetailRow icon={<User className="h-4 w-4" />} label={tr("organisation")}>
                    {vehicle.orgName ?? "—"}
                  </DetailRow>
                  <DetailRow icon={<User className="h-4 w-4" />} label={tr("yourRole")}>
                    <span className="capitalize">{vehicle.userRole}</span>
                  </DetailRow>
                  {hasLocation && (
                    <DetailRow icon={<MapPin className="h-4 w-4" />} label={tr("coordinates")}>
                      <span className="font-mono text-xs">
                        {mapVehicles[0].latitude.toFixed(5)}, {mapVehicles[0].longitude.toFixed(5)}
                      </span>
                    </DetailRow>
                  )}
                </div>
              </div>

              {/* Engine & fuel (OBD) — renders only when the tracker is wired to the OBD port */}
              <EngineSection telemetry={telemetry} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPanel(true)}
            className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 rounded-full border border-border/60 bg-card/95 backdrop-blur-md shadow-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-card transition-colors"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
            {tr("showPanel")}
          </button>
        )}
    </div>
  );
}

// ─── Engine section (Overview) ──────────────────────────────────────────────

// Arc colour per state — text-* classes consumed by Gauge via currentColor.
const FUEL_ARC_CLASS: Record<FuelState, string> = {
  ok: "text-green-400",
  low: "text-amber-400",
  critical: "text-red-400",
  unknown: "text-muted-foreground",
};
const COOLANT_ARC_CLASS: Record<CoolantState, string> = {
  warming: "text-sky-400",
  normal: "text-green-400",
  hot: "text-amber-400",
  critical: "text-red-400",
  unknown: "text-muted-foreground",
};

function EngineChip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

function EngineSection({ telemetry }: { telemetry: VehicleTelemetry }) {
  const { tr } = useLang();
  const [showMore, setShowMore] = useState(false);

  const fuel = deriveFuelLevel(telemetry.fuelLevelObd);
  const coolant = deriveCoolantTemp(telemetry.engineCoolantTemp);

  // The ~9% of trackers not wired to the OBD port send none of these — when
  // that's the case we render nothing, matching how Overview hides the Live
  // Status card when there's no telemetry.
  const hasEngineData =
    telemetry.fuelLevelObd != null ||
    telemetry.engineCoolantTemp != null ||
    telemetry.engineRpm != null ||
    telemetry.engineLoad != null;

  if (!hasEngineData) return null;

  const rpmHot = (telemetry.engineRpm ?? 0) > 6000;

  return (
    <>
      <Separator className="bg-border/50" />
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{tr("engineAndFuel")}</h3>

        {/* Headline gauge cluster */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <ArcGauge
            value={fuel.percent}
            min={0}
            max={100}
            valueText={fuel.percent != null ? String(Math.round(fuel.percent)) : "—"}
            unit="%"
            label={tr("fuelLevelLabel")}
            icon={<Fuel className="h-4 w-4" />}
            colorClass={FUEL_ARC_CLASS[fuel.state]}
            chip={
              isLowFuel(fuel.state) ? (
                <EngineChip className={FUEL_CHIP_CLASS[fuel.state]}>{tr(FUEL_LABEL_KEY[fuel.state])}</EngineChip>
              ) : undefined
            }
          />
          <ArcGauge
            value={coolant.celsius}
            min={40}
            max={120}
            valueText={coolant.celsius != null ? String(Math.round(coolant.celsius)) : "—"}
            unit="°C"
            label={tr("coolantTempLabel")}
            icon={<Thermometer className="h-4 w-4" />}
            colorClass={COOLANT_ARC_CLASS[coolant.state]}
            chip={
              isOverheating(coolant.state) ? (
                <EngineChip className={COOLANT_CHIP_CLASS[coolant.state]}>{tr(COOLANT_LABEL_KEY[coolant.state])}</EngineChip>
              ) : undefined
            }
          />
          <ArcGauge
            value={telemetry.engineRpm}
            min={0}
            max={7000}
            valueText={telemetry.engineRpm != null ? String(telemetry.engineRpm) : "—"}
            label={tr("engineRpmLabel")}
            icon={<Gauge className="h-4 w-4" />}
            colorClass={rpmHot ? "text-red-400" : "text-primary"}
          />
          <ArcGauge
            value={telemetry.engineLoad}
            min={0}
            max={100}
            valueText={telemetry.engineLoad != null ? String(Math.round(telemetry.engineLoad)) : "—"}
            unit="%"
            label={tr("engineLoadLabel")}
            icon={<Activity className="h-4 w-4" />}
            colorClass="text-primary"
          />
        </div>

        {/* Expandable secondary metrics */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="mt-5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {tr("moreEngineDetails")}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMore && "rotate-180")} />
        </button>

        {showMore && (
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
            <StatTile icon={<Gauge className="h-4 w-4" />} label={tr("throttleLabel")}>
              {telemetry.throttlePosition != null ? `${Math.round(telemetry.throttlePosition)}%` : "—"}
            </StatTile>
            <StatTile icon={<Activity className="h-4 w-4" />} label={tr("absoluteLoadLabel")}>
              {telemetry.absoluteLoad != null ? `${Math.round(telemetry.absoluteLoad)}%` : "—"}
            </StatTile>
            <StatTile icon={<Zap className="h-4 w-4" />} label={tr("moduleVoltageLabel")}>
              {telemetry.controlModuleVoltage != null
                ? `${(telemetry.controlModuleVoltage / 1000).toFixed(1)} V`
                : "—"}
            </StatTile>
            <StatTile icon={<Thermometer className="h-4 w-4" />} label={tr("intakeAirLabel")}>
              {telemetry.intakeAirTemp != null ? `${Math.round(telemetry.intakeAirTemp)} °C` : "—"}
            </StatTile>
            <StatTile icon={<Wind className="h-4 w-4" />} label={tr("mafLabel")}>
              {telemetry.maf != null ? `${(telemetry.maf / 100).toFixed(1)} g/s` : "—"}
            </StatTile>
            <StatTile icon={<Mountain className="h-4 w-4" />} label={tr("barometricLabel")}>
              {telemetry.barometricPressure != null ? `${Math.round(telemetry.barometricPressure)} kPa` : "—"}
            </StatTile>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Trip types ───────────────────────────────────────────────────────────

interface TripRecord {
  id: number;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  distanceKm: number;
  pointCount: number;
  points: HistoryPoint[];
  /** Only set in "all" mode: a moving trip vs a merged stationary block. */
  kind?: "trip" | "parked";
}

function formatMyTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}

// ─── History tab ──────────────────────────────────────────────────────────

type HistoryMode = "all" | "trips";

function HistoryTab({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const { tr } = useLang();
  const [from, setFrom] = useState(myMidnight);
  const [to, setTo]     = useState(myNow);
  const [mode, setMode]               = useState<HistoryMode>("all");
  const [trips, setTrips]             = useState<TripRecord[] | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [showPanel, setShowPanel]     = useState(true);

  const load = useCallback(async (f: string, t: string, m: HistoryMode) => {
    const fromMs = new Date(f).getTime();
    const toMs   = new Date(t).getTime();
    const windowDays = (toMs - fromMs) / (1000 * 60 * 60 * 24);
    if (windowDays > 365) { setError(tr("errorMaxWindow")); return; }
    if (toMs <= fromMs)  { setError(tr("errorToBeforeFrom")); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/vehicles/${vehicleId}/history?from=${f}Z&to=${t}Z&mode=${m}`);
      const json = await res.json() as { data?: TripRecord[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? tr("errLoadHistory"));
      } else {
        const loaded = json.data ?? [];
        setTrips(loaded);
        setSelectedIdx(0);
      }
    } catch {
      setError(tr("errNetwork"));
    } finally {
      setLoading(false);
    }
  }, [vehicleId, tr]);

  // Switch mode and reload immediately with the current date range.
  function changeMode(m: HistoryMode) {
    if (m === mode) return;
    setMode(m);
    load(from, to, m);
  }

  useEffect(() => { load(from, to, mode); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTrip = trips && trips.length > 0 && selectedIdx < trips.length
    ? trips[selectedIdx]
    : null;

  const totalPoints = trips ? trips.reduce((n, t) => n + t.pointCount, 0) : 0;

  return (
    <div className="relative h-full rounded-xl overflow-hidden border border-border/50">
      {/* ── Map showing selected trip ─────────────────────────────────── */}
      <DynamicMap
        vehicles={[]}
        historyPath={selectedTrip?.points ?? undefined}
        className="h-full w-full"
      />

      {showPanel ? (
        <div className="absolute top-3 right-3 z-[500] w-[320px] max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2 sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/40 z-10">
            <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">{vehicleName}</h2>
            <button
              onClick={() => setShowPanel(false)}
              aria-label={tr("hidePanel")}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* ── Filter bar ─────────────────────────────────────────── */}
            <div>
              {/* Mode toggle: All data (default) vs movement-segmented Trips */}
              <div className="inline-flex items-center gap-1 mb-3 bg-muted/40 p-1 rounded-lg">
                {(["all", "trips"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => changeMode(m)}
                    disabled={loading}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      mode === m
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "all" ? tr("historyModeAll") : tr("historyModeTrips")}
                  </button>
                ))}
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {tr("fromLabel")}
                  </label>
                  <input
                    type="datetime-local"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {tr("toLabel")}
                  </label>
                  <input
                    type="datetime-local"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full"
                  onClick={() => load(from, to, mode)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />}
                  {loading ? tr("loading") : tr("loadBtn")}
                </Button>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              {trips !== null && !loading && (
                <p className="text-xs text-muted-foreground mt-2">
                  {mode === "all"
                    ? `${totalPoints} ${tr("positionsFound")}`
                    : `${trips.length} ${tr("tripsFound")} · ${totalPoints} ${tr("pointsFound")}`}
                </p>
              )}
            </div>

            <Separator className="bg-border/50" />

            {/* ── Trip / activity list ───────────────────────────────── */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                {mode === "all" ? tr("historyAllListHeader") : tr("tripListHeader")}
              </h3>

              {trips !== null && trips.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground">
                  {mode === "all" ? tr("noHistoryFound") : tr("noTripsFound")}
                </p>
              )}

              {trips && trips.length > 0 && (
                <div className="space-y-1.5">
                  {trips.map((trip, i) => (
                    <button
                      key={trip.id}
                      onClick={() => setSelectedIdx(i)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                        selectedIdx === i ? "bg-primary/10" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
                        selectedIdx === i ? "bg-primary"
                        : mode === "all" && trip.kind === "parked" ? "bg-amber-500/40"
                        : "bg-muted-foreground/25"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {mode === "all"
                              ? (trip.kind === "parked" ? tr("parkedState") : tr("tripLabel"))
                              : `${tr("tripLabel")} ${trip.id}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{formatMyTime(trip.startedAt)}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{trip.durationMinutes} {tr("durationMin")}</span>
                          <span className="text-[10px] text-muted-foreground">{trip.distanceKm} {tr("distanceKm")}</span>
                        </div>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${selectedIdx === i ? "text-primary" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 rounded-full border border-border/60 bg-card/95 backdrop-blur-md shadow-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-card transition-colors"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
          {tr("showPanel")}
        </button>
      )}
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
  telemetry,
  speedLimitKmh,
  initialGeofences,
  initialEvents,
  userCanEdit,
}: VehicleDetailTabsProps) {
  const { tr } = useLang();
  const [tab, setTab] = useState<"overview" | "history" | "safety">("overview");
  // Track whether HistoryTab has been mounted at least once.
  // Once mounted we keep it in the DOM (hidden) so switching back to "overview"
  // doesn't unmount it and trigger a redundant re-fetch on the next tab switch.
  const [historyMounted, setHistoryMounted] = useState(false);

  // Fullscreen: CSS overlay drives the layout so it always works, even where
  // the native Fullscreen API is blocked (sandboxed iframes, some browser
  // policies); requestFullscreen is attempted best-effort on top of it for
  // the real hide-the-browser-chrome experience where it's available.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setIsFullscreen(false);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  async function toggleFullscreen() {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try { await containerRef.current?.requestFullscreen(); } catch { /* CSS overlay still applies */ }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* already out */ }
      }
    }
  }

  // Single live poll for the page — the Overview tab (map, live status, and the
  // engine/fuel section) all read from it.
  const live = useLiveVehicle(vehicle.id, { mapVehicles, lastSeenAt, speed, telemetry });

  function switchTab(key: "overview" | "history" | "safety") {
    setTab(key);
    if (key === "history") setHistoryMounted(true);
  }

  const tabs = [
    { key: "overview" as const, label: tr("overview") },
    { key: "history"  as const, label: tr("tripHistory") },
    { key: "safety"   as const, label: tr("safetyTab") },
  ];

  const vehicleName = vehicle.name ?? vehicle.id;
  const mapHeightClass = isFullscreen ? "flex-1 min-h-0" : "h-[70vh] min-h-[420px]";

  return (
    <div
      ref={containerRef}
      className={cn(isFullscreen && "fixed inset-0 z-[9999] flex flex-col bg-background overflow-y-auto")}
    >
      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 sm:px-6 mb-4 border-b border-border shrink-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`
              px-4 py-2.5 text-sm font-medium transition-colors relative
              ${tab === key
                ? "text-primary after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-primary after:rounded-t-full"
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {label}
          </button>
        ))}
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? tr("exitFullscreen") : tr("enterFullscreen")}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{isFullscreen ? tr("exitFullscreen") : tr("fullscreen")}</span>
        </button>
      </div>

      <div className={cn("px-4 sm:px-6 pb-8", isFullscreen && "flex-1 min-h-0 flex flex-col")}>
        {tab === "overview" && (
          <div className={mapHeightClass}>
            <OverviewTab
              vehicle={vehicle}
              mapVehicles={live.mapVehicles}
              lastSeenAt={live.lastSeenAt}
              speed={live.speed}
              todayKm={todayKm}
              telemetry={live.telemetry}
            />
          </div>
        )}
        {/* Keep HistoryTab mounted after first visit — hiding instead of unmounting
            prevents a redundant re-fetch every time the user switches back to this tab. */}
        {historyMounted && (
          <div className={cn(tab !== "history" && "hidden", mapHeightClass)}>
            <HistoryTab vehicleId={vehicle.id} vehicleName={vehicleName} />
          </div>
        )}
        {tab === "safety" && (
          <div className={mapHeightClass}>
            <SafetyTab
              vehicleId={vehicle.id}
              vehicleName={vehicleName}
              mapVehicles={live.mapVehicles}
              speedLimitKmh={speedLimitKmh}
              initialGeofences={initialGeofences}
              initialEvents={initialEvents}
              userCanEdit={userCanEdit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
