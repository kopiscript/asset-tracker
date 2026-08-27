import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { FleetSubtitle } from "@/components/dashboard/FleetSubtitle";
import { DashboardMapPanel } from "@/components/dashboard/DashboardMapPanel";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getAccessibleVehicleFilter } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/status";
import {
  deriveBatteryHealth,
  isWeakBattery,
  deriveFuelLevel,
  isLowFuel,
  deriveCoolantTemp,
  isOverheating,
} from "@/lib/telemetry";
import type { AttentionItem } from "@/components/dashboard/analytics/AttentionPanel";

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
              carBatteryVoltage: true, externalVoltage: true,
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
      isActive: v.isActive,
      latitude: latest?.latitude ?? null,
      longitude: latest?.longitude ?? null,
      lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
      status: deriveStatus(v.isActive, latest?.timestampUtc ?? null),
      battery: deriveBatteryHealth(latest?.carBatteryVoltage, latest?.externalVoltage),
      fuel: deriveFuelLevel(latest?.fuel_level_obd),
      coolant: deriveCoolantTemp(latest?.engine_coolant_temp),
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
      <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 pt-5 pb-4">
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

      {/* ── Big map with a floating, collapsible overview panel ──────────── */}
      <DashboardMapPanel
        mapVehicles={mapVehicles}
        vehicles={vehicles.map((v) => ({
          id: v.id,
          name: v.name,
          plateNumber: v.plateNumber,
          status: v.status,
          lastSeenAt: v.lastSeenAt,
          battery: v.battery,
        }))}
        attentionItems={attentionItems}
        activeCount={activeCount}
        idleCount={idleCount}
        offlineCount={offlineCount}
      />
    </div>
  );
}
