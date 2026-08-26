import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Activity, Clock, WifiOff, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/dashboard/LiveMap";
import { StatusBadge } from "@/components/StatusBadge";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { FleetSubtitle } from "@/components/dashboard/FleetSubtitle";
import { PercentOfFleet } from "@/components/dashboard/PercentOfFleet";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getAccessibleVehicleFilter } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { deriveStatus } from "@/lib/status";
import {
  deriveBatteryHealth,
  isWeakBattery,
  deriveFuelLevel,
  isLowFuel,
  deriveCoolantTemp,
  isOverheating,
  drivingState,
} from "@/lib/telemetry";
import { BatteryBadge } from "@/components/BatteryBadge";
import {
  FleetCompositionCard,
  BatteryHealthCard,
  FuelLevelsCard,
  ActivityCard,
  CurrentlyMovingCard,
} from "@/components/dashboard/analytics/FleetInsights";
import { AttentionPanel, type AttentionItem } from "@/components/dashboard/analytics/AttentionPanel";
import type { ActivityPoint } from "@/components/dashboard/analytics/ActivityChart";

export default async function DashboardPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return null;
  if (dbUser.usertype === "admin" || dbUser.usertype === "system_admin") redirect("/dashboard/admin");

  // Collect accessible vehicles, honouring per-viewer vehicle-access allowlists.
  const access = await getAccessibleVehicleFilter(dbUser.id);
  const orgRoleMap = access?.orgRoleMap ?? new Map<string, string>();

  const vehicleRows = !access
    ? []
    : await prisma.vehicle.findMany({
        where: { OR: access.orClauses },
        select: {
          id: true, name: true, plateNumber: true, type: true, isActive: true, orgId: true,
          telemetryRecords: {
            where: { latitude: { not: null }, longitude: { not: null } },
            orderBy: { timestampUtc: "desc" },
            take: 1,
            select: {
              latitude: true, longitude: true, timestampUtc: true,
              carBatteryVoltage: true, externalVoltage: true, speedKmh: true,
              fuel_level_obd: true, engine_coolant_temp: true,
            },
          },
        },
      });

  const vehicles = vehicleRows.map((v) => {
    const latest = v.telemetryRecords[0] ?? null;
    return {
      id: v.id.toString(),
      name: v.name,
      plateNumber: v.plateNumber,
      type: v.type,
      isActive: v.isActive,
      latitude: latest?.latitude ?? null,
      longitude: latest?.longitude ?? null,
      lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
      status: deriveStatus(v.isActive, latest?.timestampUtc ?? null),
      battery: deriveBatteryHealth(latest?.carBatteryVoltage, latest?.externalVoltage),
      fuel: deriveFuelLevel(latest?.fuel_level_obd),
      coolant: deriveCoolantTemp(latest?.engine_coolant_temp),
      speedKmh: latest?.speedKmh ?? null,
      moving: drivingState(latest?.speedKmh) === "moving",
      userRole: v.orgId ? (orgRoleMap.get(v.orgId) ?? "viewer") : "viewer",
    };
  });

  const activeCount  = vehicles.filter((v) => v.status === "active").length;
  const idleCount    = vehicles.filter((v) => v.status === "idle").length;
  const offlineCount = vehicles.filter((v) => v.status === "offline").length;

  // ── Consolidated attention list (battery + fuel + coolant) ──────────────
  const attentionItems: AttentionItem[] = [];
  for (const v of vehicles) {
    const name = v.name ?? v.plateNumber ?? v.id;
    if (isWeakBattery(v.battery.state)) {
      attentionItems.push({
        vehicleId: v.id,
        vehicleName: name,
        severity: v.battery.state === "critical" ? "critical" : "warning",
        reasonKey: "reasonBattery",
        detail: v.battery.voltage != null ? `${v.battery.voltage.toFixed(1)}V` : "—",
      });
    }
    if (isLowFuel(v.fuel.state)) {
      attentionItems.push({
        vehicleId: v.id,
        vehicleName: name,
        severity: v.fuel.state === "critical" ? "critical" : "warning",
        reasonKey: "reasonFuel",
        detail: v.fuel.percent != null ? `${Math.round(v.fuel.percent)}%` : "—",
      });
    }
    if (isOverheating(v.coolant.state)) {
      attentionItems.push({
        vehicleId: v.id,
        vehicleName: name,
        severity: v.coolant.state === "critical" ? "critical" : "warning",
        reasonKey: "reasonCoolant",
        detail: v.coolant.celsius != null ? `${Math.round(v.coolant.celsius)}°C` : "—",
      });
    }
  }

  // ── Battery / fuel distributions across the accessible fleet ────────────
  const batteryCounts = { charging: 0, healthy: 0, low: 0, critical: 0, unknown: 0 };
  const fuelCounts = { ok: 0, low: 0, critical: 0, unknown: 0 };
  for (const v of vehicles) {
    batteryCounts[v.battery.state]++;
    fuelCounts[v.fuel.state]++;
  }
  const hasFuelData = fuelCounts.ok + fuelCounts.low + fuelCounts.critical > 0;

  const movingVehicles = vehicles
    .filter((v) => v.moving && v.speedKmh != null)
    .map((v) => ({
      id: v.id,
      name: v.name ?? v.plateNumber ?? v.id,
      plateNumber: v.plateNumber ?? "",
      speedKmh: v.speedKmh!,
    }));
  const avgMovingSpeed =
    movingVehicles.length > 0
      ? movingVehicles.reduce((sum, v) => sum + v.speedKmh, 0) / movingVehicles.length
      : null;

  // ── MIROS TrackScore: recent overspeed/harsh/emergency events (24h) ─────
  const vehicleIds = vehicleRows.map((v) => v.id);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const nameById = new Map(vehicles.map((v) => [v.id, v.name ?? v.plateNumber ?? v.id]));
  const SAFETY_REASON_KEY: Partial<Record<string, "eventOverspeed" | "eventHarshBrake" | "eventHarshAccel" | "eventEmergency">> = {
    overspeed: "eventOverspeed",
    harsh_brake: "eventHarshBrake",
    harsh_accel: "eventHarshAccel",
    emergency: "eventEmergency",
  };
  if (vehicleIds.length > 0) {
    const safetyEvents = await prisma.trackingEvent.findMany({
      where: { vehicleId: { in: vehicleIds }, type: { in: Object.keys(SAFETY_REASON_KEY) }, occurredAt: { gte: since24h } },
      orderBy: { occurredAt: "desc" },
      take: 20,
      select: { vehicleId: true, type: true, detail: true },
    });
    for (const e of safetyEvents) {
      const reasonKey = SAFETY_REASON_KEY[e.type];
      if (!reasonKey) continue;
      attentionItems.push({
        vehicleId: e.vehicleId.toString(),
        vehicleName: nameById.get(e.vehicleId.toString()) ?? e.vehicleId.toString(),
        severity: e.type === "emergency" ? "critical" : "warning",
        reasonKey,
        detail: e.detail ?? "",
      });
    }
  }

  // ── 24-hour activity trend: distinct moving vehicles per hour bucket ────
  const since = since24h;
  const recentTelemetry =
    vehicleIds.length === 0
      ? []
      : await prisma.telemetryRecord.findMany({
          where: { vehicleId: { in: vehicleIds }, timestampUtc: { gte: since } },
          select: { timestampUtc: true, speedKmh: true, vehicleId: true },
          orderBy: { timestampUtc: "asc" },
          take: 5000,
        });

  const buckets = new Map<number, Set<string>>();
  for (const row of recentTelemetry) {
    if ((row.speedKmh ?? 0) <= 3) continue;
    const hourKey = Math.floor(row.timestampUtc.getTime() / (60 * 60 * 1000));
    if (!buckets.has(hourKey)) buckets.set(hourKey, new Set());
    buckets.get(hourKey)!.add(row.vehicleId.toString());
  }

  const nowHour = Math.floor(Date.now() / (60 * 60 * 1000));
  const activityPoints: ActivityPoint[] = Array.from({ length: 24 }, (_, i) => {
    const hourKey = nowHour - 23 + i;
    const date = new Date(hourKey * 60 * 60 * 1000);
    return {
      label: date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false }),
      value: buckets.get(hourKey)?.size ?? 0,
    };
  });

  const mapVehicles = vehicles
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({
      id: v.id,
      name: v.name ?? v.id,
      plateNumber: v.plateNumber ?? "",
      status: v.status,
      latitude: v.latitude!,
      longitude: v.longitude!,
      lastSeenAt: v.lastSeenAt,
    }));

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 sm:px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-foreground leading-none tracking-tight">
              <PageTitle k="dashboard" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <FleetSubtitle count={vehicles.length} />
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium active:scale-[0.98] transition-transform min-h-[44px] px-4"
            render={<Link href="/dashboard/vehicles/new" />}
          >
            <Plus className="h-3.5 w-3.5" />
            <PageTitle k="addVehicle" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Car className="h-4 w-4" />}
            iconClass="bg-primary/10 text-primary"
            label={<PageTitle k="statTotal" />}
            value={vehicles.length}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            iconClass="bg-green-500/10 text-green-400"
            label={<PageTitle k="statusActive" />}
            value={activeCount}
            sublabel={vehicles.length > 0 ? <PercentOfFleet percent={Math.round((activeCount / vehicles.length) * 100)} /> : undefined}
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            iconClass="bg-amber-500/10 text-amber-400"
            label={<PageTitle k="statusIdle" />}
            value={idleCount}
            sublabel={vehicles.length > 0 ? <PercentOfFleet percent={Math.round((idleCount / vehicles.length) * 100)} /> : undefined}
          />
          <StatCard
            icon={<WifiOff className="h-4 w-4" />}
            iconClass="bg-red-500/10 text-red-400"
            label={<PageTitle k="statusOffline" />}
            value={offlineCount}
            sublabel={vehicles.length > 0 ? <PercentOfFleet percent={Math.round((offlineCount / vehicles.length) * 100)} /> : undefined}
          />
        </div>
      </div>

      {/* ── Analytics grid ───────────────────────────────────────────────── */}
      {vehicles.length > 0 && (
        <div className="flex-shrink-0 px-5 sm:px-6 pb-5 grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <div className="lg:col-span-2">
            <ActivityCard points={activityPoints} movingNow={movingVehicles.length} avgSpeed={avgMovingSpeed} />
          </div>
          <FleetCompositionCard active={activeCount} idle={idleCount} offline={offlineCount} />

          <BatteryHealthCard counts={batteryCounts} />
          {hasFuelData ? (
            <FuelLevelsCard counts={fuelCounts} />
          ) : (
            <CurrentlyMovingCard vehicles={movingVehicles} />
          )}
          <AttentionPanel items={attentionItems} />
          {hasFuelData && <CurrentlyMovingCard vehicles={movingVehicles} />}
        </div>
      )}

      {/* ── Map + side panel ─────────────────────────────────────────────── */}
      <div className="flex px-5 sm:px-6 pb-6 gap-4">
        <div className="flex-1 h-[420px] sm:h-[500px] min-w-0">
          <LiveMap
            initialVehicles={mapVehicles}
            className="h-full w-full rounded-xl overflow-hidden border border-border"
          />
        </div>

        <aside className="hidden xl:flex flex-col w-68 flex-shrink-0 h-[500px] overflow-y-auto gap-1.5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <PageTitle k="vehicles" />
            </h2>
            <Link
              href="/dashboard/vehicles"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <PageTitle k="viewAll" />
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
              <Car className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground"><PageTitle k="noVehicles" /></p>
              <Link
                href="/dashboard/vehicles/new"
                className="text-xs text-primary hover:underline mt-1.5"
              >
                <PageTitle k="addOneArrow" />
              </Link>
            </div>
          ) : (
            vehicles.slice(0, 10).map((v) => (
              <Link
                key={v.id}
                href={`/dashboard/vehicles/${v.id}`}
                className="flex items-center gap-3 bg-card border border-border/60 rounded-xl p-3 hover:border-primary/30 hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 group"
              >
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Car className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-none mb-1">
                    {v.name ?? v.id}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {v.plateNumber}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge status={v.status} />
                  {isWeakBattery(v.battery.state) ? (
                    <BatteryBadge state={v.battery.state} voltage={v.battery.voltage} showVoltage />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(v.lastSeenAt)}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: React.ReactNode;
  value: number;
  sublabel?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-4 hover:border-border transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconClass}`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
          {value}
        </p>
        {sublabel && (
          <span className="text-[11px] text-muted-foreground tabular-nums">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
