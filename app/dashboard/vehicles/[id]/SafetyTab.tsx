/**
 * app/dashboard/vehicles/[id]/SafetyTab.tsx
 * MIROS TrackScore tab: geofences (item 4/5), the recent overspeed /
 * harsh-braking / harsh-acceleration / geofence event log (item 8/9/21-24,
 * shown as "system alerts" per the guideline), and the manager-facing
 * panic/emergency button (additional item 2).
 *
 * Same big-map + floating-panel layout as the Overview tab: the map fills
 * the whole card, every control (emergency, geofences, event log) lives in
 * one collapsible panel docked over it.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPinned, Plus, Trash2, Siren, Gauge, TrendingUp, TrendingDown,
  LogIn, LogOut, Loader2, ShieldAlert, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  vehicleName: string;
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
  vehicleName,
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
  const [showPanel, setShowPanel] = useState(true);

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
    <div className="relative h-full rounded-xl overflow-hidden border border-border/50">
      <DynamicMap vehicles={mapVehicles} geofences={geofences} focusVehicleId={vehicleId} className="h-full w-full" />

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
            {/* Panic / emergency button */}
            {userCanEdit && (
              <div>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="h-7 w-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Siren className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-none mb-1">{tr("panicButtonTitle")}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{tr("panicButtonDesc")}</p>
                  </div>
                </div>
                {emergencySent ? (
                  <span className="text-xs font-medium text-red-400">{tr("emergencyReported")}</span>
                ) : confirmEmergency ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{tr("confirmEmergency")}</span>
                    <Button size="sm" variant="destructive" onClick={handleEmergency} disabled={emergencyLoading}>
                      {emergencyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("yesReport")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmEmergency(false)}>{tr("cancel")}</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="destructive" className="gap-1.5 w-full" onClick={() => setConfirmEmergency(true)}>
                    <Siren className="h-3.5 w-3.5" />
                    {tr("reportEmergency")}
                  </Button>
                )}
              </div>
            )}

            <Separator className="bg-border/50" />

            {/* Geofences */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPinned className="h-3.5 w-3.5" />
                  {tr("geofencesTitle")}
                </h3>
                {userCanEdit && !showAddGeofence && (
                  <button
                    onClick={() => setShowAddGeofence(true)}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                    aria-label={tr("addGeofence")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {showAddGeofence && (
                <form onSubmit={handleAddGeofence} className="mb-3 p-2.5 rounded-lg bg-secondary/30 border border-border/40 space-y-2.5">
                  <p className="text-[11px] text-muted-foreground">{tr("geofenceCenteredHint")}</p>
                  <Input
                    autoFocus
                    placeholder={tr("geofenceNamePlaceholder")}
                    value={gfName}
                    onChange={(e) => setGfName(e.target.value)}
                    className="h-8 text-sm"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={50}
                      max={50000}
                      value={gfRadius}
                      onChange={(e) => setGfRadius(Number(e.target.value))}
                      className="h-8 text-sm flex-1"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">{tr("meters")}</span>
                  </div>
                  {gfError && <p className="text-xs text-red-400">{gfError}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" type="submit" disabled={gfLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
                      {gfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("save")}
                    </Button>
                    <Button size="sm" type="button" variant="ghost" onClick={() => setShowAddGeofence(false)}>
                      {tr("cancel")}
                    </Button>
                  </div>
                </form>
              )}

              {geofences.length === 0 ? (
                <p className="text-xs text-muted-foreground">{tr("noGeofences")}</p>
              ) : (
                <div className="space-y-1.5">
                  {geofences.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 rounded-lg border border-border/40 px-2.5 py-2">
                      <MapPinned className="h-3 w-3 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{g.name}</p>
                        <p className="text-[10px] text-muted-foreground">{g.radiusM} {tr("meters")}</p>
                      </div>
                      {userCanEdit && (
                        <button
                          onClick={() => handleDeleteGeofence(g.id)}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-muted/60 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-border/50" />

            {/* Event log */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {tr("eventsTitle")}
                </h3>
                {speedLimitKmh != null && (
                  <span className="text-[10px] text-muted-foreground shrink-0">{tr("speedLimitBadge")} {speedLimitKmh} km/h</span>
                )}
              </div>
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground">{tr("noEvents")}</p>
              ) : (
                <div className="space-y-1.5">
                  {events.map((e) => {
                    const meta = EVENT_META[e.type] ?? EVENT_META.overspeed;
                    const Icon = meta.icon;
                    return (
                      <div key={e.id} className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground leading-none mb-0.5">{tr(meta.labelKey)}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{e.detail}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(e.occurredAt)}</span>
                      </div>
                    );
                  })}
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
