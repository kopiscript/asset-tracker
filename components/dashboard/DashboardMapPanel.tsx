/**
 * components/dashboard/DashboardMapPanel.tsx
 * Fleet dashboard's big map: the live map fills the whole card, every other
 * widget (fleet counts, attention alerts, vehicle list) lives in one
 * collapsible floating panel docked over it — same pattern as the vehicle
 * detail page. Also owns the fullscreen toggle.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Car, Activity, Clock, WifiOff, PanelRightClose, PanelRightOpen,
  Maximize2, Minimize2,
} from "lucide-react";
import { LiveMap } from "@/components/dashboard/LiveMap";
import { StatusBadge } from "@/components/StatusBadge";
import { BatteryBadge } from "@/components/BatteryBadge";
import { Separator } from "@/components/ui/separator";
import { useLang } from "@/components/LanguageProvider";
import { timeAgo } from "@/lib/format";
import { isWeakBattery, type BatteryState } from "@/lib/telemetry";
import { AttentionPanel, type AttentionItem } from "@/components/dashboard/analytics/AttentionPanel";
import type { MapVehicle } from "@/components/map/VehicleMap";

export interface DashboardVehicleRow {
  id: string;
  name: string | null;
  plateNumber: string | null;
  status: string;
  lastSeenAt: string | null;
  battery: { state: BatteryState; voltage: number | null };
}

interface DashboardMapPanelProps {
  mapVehicles: MapVehicle[];
  vehicles: DashboardVehicleRow[];
  attentionItems: AttentionItem[];
  activeCount: number;
  idleCount: number;
  offlineCount: number;
}

export function DashboardMapPanel({
  mapVehicles,
  vehicles,
  attentionItems,
  activeCount,
  idleCount,
  offlineCount,
}: DashboardMapPanelProps) {
  const { tr } = useLang();
  const [showPanel, setShowPanel] = useState(true);

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

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] bg-background p-3"
          : "relative flex-1 min-h-[420px] mx-5 sm:mx-6 mb-6"
      }
    >
      <div className="relative h-full rounded-xl overflow-hidden border border-border">
        <LiveMap initialVehicles={mapVehicles} className="h-full w-full" />

        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? tr("exitFullscreen") : tr("enterFullscreen")}
          className="absolute bottom-3 left-3 z-[500] h-8 w-8 rounded-lg flex items-center justify-center bg-card/95 backdrop-blur-md border border-border/60 text-muted-foreground hover:text-foreground shadow-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        {showPanel ? (
          <div className="absolute top-3 right-3 z-[500] w-[320px] max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2 sticky top-0 bg-card/95 backdrop-blur-md border-b border-border/40 z-10">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">{tr("fleetOverview")}</h2>
              <button
                onClick={() => setShowPanel(false)}
                aria-label={tr("hidePanel")}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Fleet counts */}
              <div className="grid grid-cols-4 gap-2">
                <StatChip icon={<Car className="h-3.5 w-3.5" />} value={vehicles.length} label={tr("statTotal")} colorClass="text-foreground" />
                <StatChip icon={<Activity className="h-3.5 w-3.5" />} value={activeCount} label={tr("statusActive")} colorClass="text-green-400" />
                <StatChip icon={<Clock className="h-3.5 w-3.5" />} value={idleCount} label={tr("statusIdle")} colorClass="text-amber-400" />
                <StatChip icon={<WifiOff className="h-3.5 w-3.5" />} value={offlineCount} label={tr("statusOffline")} colorClass="text-red-400" />
              </div>

              <Separator className="bg-border/50" />

              {/* Attention / alerts */}
              <div>
                <AttentionPanel items={attentionItems} />
              </div>

              <Separator className="bg-border/50" />

              {/* Vehicle list */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tr("vehicles")}</h3>
                  <Link href="/dashboard/vehicles" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    {tr("viewAll")}
                  </Link>
                </div>

                {vehicles.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-6">
                    <Car className="h-6 w-6 text-muted-foreground/20 mb-2" />
                    <p className="text-xs text-muted-foreground">{tr("noVehicles")}</p>
                    <Link href="/dashboard/vehicles/new" className="text-xs text-primary hover:underline mt-1">
                      {tr("addOneArrow")}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {vehicles.slice(0, 10).map((v) => (
                      <Link
                        key={v.id}
                        href={`/dashboard/vehicles/${v.id}`}
                        className="flex items-center gap-2.5 rounded-lg border border-border/40 p-2 hover:border-primary/30 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <Car className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate leading-none mb-1">{v.name ?? v.id}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{v.plateNumber}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusBadge status={v.status} />
                          {isWeakBattery(v.battery.state) ? (
                            <BatteryBadge state={v.battery.state} voltage={v.battery.voltage} />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">{timeAgo(v.lastSeenAt)}</span>
                          )}
                        </div>
                      </Link>
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
    </div>
  );
}

function StatChip({
  icon, value, label, colorClass,
}: {
  icon: React.ReactNode; value: number; label: string; colorClass: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border/40 p-2 flex flex-col items-center text-center">
      <span className={colorClass}>{icon}</span>
      <span className={`text-sm font-semibold tabular-nums mt-1 ${colorClass}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wide leading-tight">{label}</span>
    </div>
  );
}
