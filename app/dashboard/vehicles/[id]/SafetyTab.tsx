/**
 * app/dashboard/vehicles/[id]/SafetyTab.tsx
 * MIROS TrackScore tab: geofences (item 4/5), the recent overspeed /
 * harsh-braking / harsh-acceleration / geofence event log (item 8/9/21-24,
 * shown as "system alerts" per the guideline), and the manager-facing
 * panic/emergency button (additional item 2).
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPinned, Plus, Trash2, Siren, Gauge, TrendingUp, TrendingDown,
  LogIn, LogOut, Loader2, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DynamicMap } from "@/components/map/DynamicMap";
import type { MapVehicle, MapGeofence } from "@/components/map/VehicleMap";
import { useLang } from "@/components/LanguageProvider";
import { timeAgo } from "@/lib/format";
import type { TranslationKey } from "@/lib/translations";

export interface TrackingEventData {
  id: string;
  type: string;
  occurredAt: string;
  speedKmh: number | null;
  latitude: number | null;
  longitude: number | null;
  detail: string | null;
}

interface SafetyTabProps {
  vehicleId: string;
  mapVehicles: MapVehicle[];
  speedLimitKmh: number | null;
  initialGeofences: MapGeofence[];
  initialEvents: TrackingEventData[];
  userCanEdit: boolean;
}

const EVENT_META: Record<string, { icon: typeof Gauge; color: string; labelKey: TranslationKey }> = {
  overspeed:       { icon: Gauge,       color: "text-red-400 bg-red-500/10 border-red-500/20",       labelKey: "eventOverspeed" },
  harsh_brake:     { icon: TrendingDown, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", labelKey: "eventHarshBrake" },
  harsh_accel:     { icon: TrendingUp,   color: "text-amber-400 bg-amber-500/10 border-amber-500/20", labelKey: "eventHarshAccel" },
  geofence_enter:  { icon: LogIn,        color: "text-sky-400 bg-sky-500/10 border-sky-500/20",       labelKey: "eventGeofenceEnter" },
  geofence_exit:   { icon: LogOut,       color: "text-sky-400 bg-sky-500/10 border-sky-500/20",       labelKey: "eventGeofenceExit" },
  emergency:       { icon: Siren,        color: "text-red-400 bg-red-500/10 border-red-500/20",       labelKey: "eventEmergency" },
};

export function SafetyTab({
  vehicleId,
  mapVehicles,
  speedLimitKmh,
  initialGeofences,
  initialEvents,
  userCanEdit,
}: SafetyTabProps) {
  const router = useRouter();
  const { tr } = useLang();
  const [geofences, setGeofences] = useState(initialGeofences);
  const [events] = useState(initialEvents);

  const [showAddGeofence, setShowAddGeofence] = useState(false);
  const [gfName, setGfName] = useState("");
  const [gfRadius, setGfRadius] = useState(500);
  const [gfLoading, setGfLoading] = useState(false);
  const [gfError, setGfError] = useState("");

  const [confirmEmergency, setConfirmEmergency] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);

  const currentPosition = mapVehicles[0] ?? null;

  async function handleAddGeofence(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPosition) {
      setGfError(tr("errNoPositionYet"));
      return;
    }
    if (!gfName.trim()) return;
    setGfLoading(true);
    setGfError("");

    const res = await fetch(`/api/vehicles/${vehicleId}/geofences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: gfName.trim(),
        centerLat: currentPosition.latitude,
        centerLng: currentPosition.longitude,
        radiusM: gfRadius,
      }),
    });
    const json = await res.json().catch(() => null) as { data?: MapGeofence; error?: string } | null;
    setGfLoading(false);

    if (!res.ok || !json?.data) {
      setGfError(json?.error ?? tr("errCreateGeofence"));
      return;
    }
    setGeofences((prev) => [...prev, json.data!]);
    setGfName("");
    setGfRadius(500);
    setShowAddGeofence(false);
    router.refresh();
  }

  async function handleDeleteGeofence(geofenceId: string) {
    const res = await fetch(`/api/vehicles/${vehicleId}/geofences/${geofenceId}`, { method: "DELETE" });
    if (res.ok) {
      setGeofences((prev) => prev.filter((g) => g.id !== geofenceId));
      router.refresh();
    }
  }

  async function handleEmergency() {
    setEmergencyLoading(true);
    const res = await fetch(`/api/vehicles/${vehicleId}/emergency`, { method: "POST" });
    setEmergencyLoading(false);
    setConfirmEmergency(false);
    if (res.ok) {
      setEmergencySent(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Panic / emergency button */}
      {userCanEdit && (
        <div className="bg-card border border-red-500/20 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Siren className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none mb-1">{tr("panicButtonTitle")}</p>
              <p className="text-xs text-muted-foreground">{tr("panicButtonDesc")}</p>
            </div>
          </div>
          {emergencySent ? (
            <span className="text-xs font-medium text-red-400">{tr("emergencyReported")}</span>
          ) : confirmEmergency ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{tr("confirmEmergency")}</span>
              <Button size="sm" variant="destructive" onClick={handleEmergency} disabled={emergencyLoading}>
                {emergencyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("yesReport")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmEmergency(false)}>{tr("cancel")}</Button>
            </div>
          ) : (
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setConfirmEmergency(true)}>
              <Siren className="h-3.5 w-3.5" />
              {tr("reportEmergency")}
            </Button>
          )}
        </div>
      )}

      {/* Map with geofences */}
      <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-border/50">
        <DynamicMap vehicles={mapVehicles} geofences={geofences} focusVehicleId={vehicleId} className="h-full w-full" />
      </div>

      {/* Geofences */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-muted-foreground" />
            {tr("geofencesTitle")}
          </h2>
          {userCanEdit && !showAddGeofence && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddGeofence(true)}>
              <Plus className="h-3.5 w-3.5" />
              {tr("addGeofence")}
            </Button>
          )}
        </div>

        {showAddGeofence && (
          <form onSubmit={handleAddGeofence} className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-3">
            <p className="text-xs text-muted-foreground">{tr("geofenceCenteredHint")}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                autoFocus
                placeholder={tr("geofenceNamePlaceholder")}
                value={gfName}
                onChange={(e) => setGfName(e.target.value)}
                className="flex-1"
                required
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={50}
                  max={50000}
                  value={gfRadius}
                  onChange={(e) => setGfRadius(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-xs text-muted-foreground shrink-0">{tr("meters")}</span>
              </div>
            </div>
            {gfError && <p className="text-xs text-red-400">{gfError}</p>}
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={gfLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {gfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("save")}
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setShowAddGeofence(false)}>
                {tr("cancel")}
              </Button>
            </div>
          </form>
        )}

        {geofences.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">{tr("noGeofences")}</p>
        ) : (
          <div className="space-y-2">
            {geofences.map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5">
                <MapPinned className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.radiusM} {tr("meters")} · {g.centerLat.toFixed(4)}, {g.centerLng.toFixed(4)}</p>
                </div>
                {userCanEdit && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400 shrink-0" onClick={() => handleDeleteGeofence(g.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event log */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            {tr("eventsTitle")}
          </h2>
          {speedLimitKmh != null && (
            <span className="text-xs text-muted-foreground">{tr("speedLimitBadge")} {speedLimitKmh} km/h</span>
          )}
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground px-5 pb-5">{tr("noEvents")}</p>
        ) : (
          <div className="divide-y divide-border/30">
            {events.map((e) => {
              const meta = EVENT_META[e.type] ?? EVENT_META.overspeed;
              const Icon = meta.icon;
              return (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-none mb-1">{tr(meta.labelKey)}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(e.occurredAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
