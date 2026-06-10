import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Activity, Clock, WifiOff, Car, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/dashboard/LiveMap";
import { StatusBadge } from "@/components/StatusBadge";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { FleetSubtitle } from "@/components/dashboard/FleetSubtitle";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { deriveStatus } from "@/lib/status";
import { deriveBatteryHealth, isWeakBattery } from "@/lib/telemetry";
import { BatteryBadge } from "@/components/BatteryBadge";

export default async function DashboardPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return null;
  if (dbUser.usertype === "admin" || dbUser.usertype === "system_admin") redirect("/dashboard/admin");

  // Collect accessible vehicles via org membership (any role)
  const orgMemberships = await prisma.orgMember.findMany({
    where: { userId: dbUser.id },
    select: { orgId: true, role: true },
  });

  const allOrgIds = orgMemberships.map((m) => m.orgId);
  const orgRoleMap = new Map(orgMemberships.map((m) => [m.orgId, m.role]));

  const vehicleRows = allOrgIds.length === 0
    ? []
    : await prisma.vehicle.findMany({
        where: { orgId: { in: allOrgIds } },
        select: {
          id: true, name: true, plateNumber: true, type: true, isActive: true, orgId: true,
          telemetryRecords: {
            where: { latitude: { not: null }, longitude: { not: null } },
            orderBy: { timestampUtc: "desc" },
            take: 1,
            select: {
              latitude: true, longitude: true, timestampUtc: true,
              carBatteryVoltage: true, externalVoltage: true,
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
      userRole: v.orgId ? (orgRoleMap.get(v.orgId) ?? "viewer") : "viewer",
    };
  });

  const activeCount  = vehicles.filter((v) => v.status === "active").length;
  const idleCount    = vehicles.filter((v) => v.status === "idle").length;
  const offlineCount = vehicles.filter((v) => v.status === "offline").length;

  // Fleet battery alert: vehicles whose car battery is low or critical.
  const weakBatteryVehicles = vehicles.filter((v) => isWeakBattery(v.battery.state));

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
    <div className="flex flex-col h-full">
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
            icon={<Car className="h-3.5 w-3.5 text-muted-foreground" />}
            label={<PageTitle k="statTotal" />}
            value={vehicles.length}
            valueClass="text-foreground"
          />
          <StatCard
            icon={<Activity className="h-3.5 w-3.5 text-green-600" />}
            label={<PageTitle k="statusActive" />}
            value={activeCount}
            valueClass="text-green-600"
          />
          <StatCard
            icon={<Clock className="h-3.5 w-3.5 text-amber-500" />}
            label={<PageTitle k="statusIdle" />}
            value={idleCount}
            valueClass="text-amber-600"
          />
          <StatCard
            icon={<WifiOff className="h-3.5 w-3.5 text-red-500" />}
            label={<PageTitle k="statusOffline" />}
            value={offlineCount}
            valueClass="text-red-600"
          />
        </div>

        {/* Battery attention banner */}
        {weakBatteryVehicles.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-amber-300">
                <PageTitle k="batteryAlertTitle" />
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mb-2.5">
              <PageTitle k="batteryAlertDesc" />
            </p>
            <div className="flex flex-wrap gap-2">
              {weakBatteryVehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/dashboard/vehicles/${v.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-background/40 border border-amber-500/20 px-2.5 py-1 hover:bg-background/60 transition-colors"
                >
                  <span className="text-xs font-medium text-foreground">{v.name ?? v.id}</span>
                  <BatteryBadge state={v.battery.state} voltage={v.battery.voltage} showVoltage />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Map + side panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden px-5 sm:px-6 pb-5 gap-4 min-h-0">
        <div className="flex-1 min-h-[300px] min-w-0">
          <LiveMap
            initialVehicles={mapVehicles}
            className="h-full w-full rounded-xl overflow-hidden border border-border"
          />
        </div>

        <aside className="hidden xl:flex flex-col w-68 flex-shrink-0 overflow-y-auto gap-1.5">
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
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/20 hover:bg-card/80 transition-all duration-150 group"
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
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className={`text-3xl font-semibold tabular-nums leading-none tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
