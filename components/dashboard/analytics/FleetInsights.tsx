"use client";

import Link from "next/link";
import { Gauge, Fuel, BatteryMedium, TrendingUp, Navigation2 } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { DonutChart } from "./DonutChart";
import { DistributionBar, type DistributionSegment } from "./DistributionBar";
import { ActivityChart, type ActivityPoint } from "./ActivityChart";

// ── Fleet Composition ────────────────────────────────────────────────────

export function FleetCompositionCard({
  active,
  idle,
  offline,
}: {
  active: number;
  idle: number;
  offline: number;
}) {
  const { tr } = useLang();
  const total = active + idle + offline;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {tr("fleetComposition")}
      </p>
      <div className="flex items-center gap-4 flex-1">
        <DonutChart
          centerValue={total}
          centerLabel={tr("statTotal")}
          segments={[
            { value: active, colorClass: "stroke-green-500", label: tr("statusActive") },
            { value: idle, colorClass: "stroke-amber-500", label: tr("statusIdle") },
            { value: offline, colorClass: "stroke-red-500", label: tr("statusOffline") },
          ]}
        />
        <div className="flex-1 space-y-2 min-w-0">
          <CompositionRow dotClass="bg-green-500" label={tr("statusActive")} value={active} total={total} />
          <CompositionRow dotClass="bg-amber-500" label={tr("statusIdle")} value={idle} total={total} />
          <CompositionRow dotClass="bg-red-500" label={tr("statusOffline")} value={offline} total={total} />
        </div>
      </div>
    </div>
  );
}

function CompositionRow({
  dotClass,
  label,
  value,
  total,
}: {
  dotClass: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotClass} shrink-0`} />
      <span className="text-xs text-muted-foreground flex-1 truncate">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Battery health ────────────────────────────────────────────────────────

export function BatteryHealthCard({
  counts,
}: {
  counts: { charging: number; healthy: number; low: number; critical: number; unknown: number };
}) {
  const { tr } = useLang();
  const segments: DistributionSegment[] = [
    { value: counts.charging, label: tr("batteryCharging"), barClass: "bg-emerald-500", dotClass: "bg-emerald-500" },
    { value: counts.healthy, label: tr("batteryHealthy"), barClass: "bg-green-500", dotClass: "bg-green-500" },
    { value: counts.low, label: tr("batteryLow"), barClass: "bg-amber-500", dotClass: "bg-amber-500" },
    { value: counts.critical, label: tr("batteryCritical"), barClass: "bg-red-500", dotClass: "bg-red-500" },
    { value: counts.unknown, label: tr("batteryUnknown"), barClass: "bg-muted-foreground/30", dotClass: "bg-muted-foreground/50" },
  ];
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <BatteryMedium className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {tr("batteryHealth")}
        </p>
      </div>
      <DistributionBar segments={segments} />
    </div>
  );
}

// ── Fuel levels ───────────────────────────────────────────────────────────

export function FuelLevelsCard({
  counts,
}: {
  counts: { ok: number; low: number; critical: number; unknown: number };
}) {
  const { tr } = useLang();
  const segments: DistributionSegment[] = [
    { value: counts.ok, label: tr("fuelOk"), barClass: "bg-green-500", dotClass: "bg-green-500" },
    { value: counts.low, label: tr("fuelLow"), barClass: "bg-amber-500", dotClass: "bg-amber-500" },
    { value: counts.critical, label: tr("fuelCritical"), barClass: "bg-red-500", dotClass: "bg-red-500" },
    { value: counts.unknown, label: tr("batteryUnknown"), barClass: "bg-muted-foreground/30", dotClass: "bg-muted-foreground/50" },
  ];
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {tr("fuelLevels")}
        </p>
      </div>
      <DistributionBar segments={segments} />
    </div>
  );
}

// ── 24h activity ──────────────────────────────────────────────────────────

export function ActivityCard({
  points,
  movingNow,
  avgSpeed,
}: {
  points: ActivityPoint[];
  movingNow: number;
  avgSpeed: number | null;
}) {
  const { tr } = useLang();
  const peak = Math.max(0, ...points.map((p) => p.value));

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {tr("activityTrend")}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-[10px] text-muted-foreground leading-none mb-1">{tr("nowLabel")}</p>
            <p className="text-sm font-semibold text-foreground tabular-nums leading-none">{movingNow}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-none mb-1">{tr("peakLabel")}</p>
            <p className="text-sm font-semibold text-foreground tabular-nums leading-none">{peak}</p>
          </div>
          {avgSpeed != null && (
            <div>
              <p className="text-[10px] text-muted-foreground leading-none mb-1">{tr("avgSpeed")}</p>
              <p className="text-sm font-semibold text-foreground tabular-nums leading-none">
                {Math.round(avgSpeed)} <span className="text-[10px] font-normal text-muted-foreground">km/h</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <ActivityChart points={points} unit={tr("movingVehiclesUnit")} />
    </div>
  );
}

// ── Currently moving ──────────────────────────────────────────────────────

export interface MovingVehicle {
  id: string;
  name: string;
  plateNumber: string;
  speedKmh: number;
}

export function CurrentlyMovingCard({ vehicles }: { vehicles: MovingVehicle[] }) {
  const { tr } = useLang();
  const sorted = [...vehicles].sort((a, b) => b.speedKmh - a.speedKmh).slice(0, 6);
  const maxSpeed = Math.max(1, ...sorted.map((v) => v.speedKmh));

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3.5">
        <Navigation2 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {tr("currentlyMoving")}
        </p>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{tr("noneMovingRightNow")}</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((v) => (
            <Link
              key={v.id}
              href={`/dashboard/vehicles/${v.id}`}
              className="flex items-center gap-3 group"
            >
              <span className="text-xs font-medium text-foreground w-20 truncate shrink-0 group-hover:text-primary transition-colors">
                {v.name}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(v.speedKmh / maxSpeed) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground w-14 text-right shrink-0 flex items-center justify-end gap-1">
                <Gauge className="h-3 w-3 text-muted-foreground" />
                {Math.round(v.speedKmh)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
