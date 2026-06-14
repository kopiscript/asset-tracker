import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteVehicleButton } from "./DeleteVehicleButton";
import { VehicleDetailTabs } from "./VehicleDetailTabs";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getEffectiveVehicleRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/status";
import { totalDistanceKm, todayMidnightMy } from "@/lib/geo";

export default async function VehicleDetailPage(
  props: PageProps<"/dashboard/vehicles/[id]">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const userRole = await getEffectiveVehicleRole(dbUser.id, id);
  if (!userRole) return notFound();

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: BigInt(id) },
    include: {
      org: { select: { id: true, name: true } },
      telemetryRecords: {
        where: { latitude: { not: null }, longitude: { not: null } },
        orderBy: { timestampUtc: "desc" },
        take: 1,
        select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
      },
    },
  });
  if (!vehicle) return notFound();

  const userCanEdit   = userRole === "owner" || userRole === "admin";
  const userCanDelete = userRole === "owner";

  const latest    = vehicle.telemetryRecords[0] ?? null;
  const latitude  = latest?.latitude  ?? null;
  const longitude = latest?.longitude ?? null;
  const lastSeenAt = latest?.timestampUtc ?? null;
  const speed     = latest?.speedKmh ?? null;
  const status    = deriveStatus(vehicle.isActive, lastSeenAt);

  const midnight = todayMidnightMy();
  // Deduplicate to 1 point per minute — same logic as the history endpoint.
  // Without this, high-frequency GPS devices (pings every 5-30s) transfer thousands
  // of rows from Neon on every page load; 1/min caps it at 1 440 rows per 24 h.
  const todayPings = await prisma.$queryRawUnsafe<{ latitude: number; longitude: number }[]>(
    `
    SELECT DISTINCT ON (date_trunc('minute', timestamp_my))
      latitude, longitude
    FROM telemetry_records
    WHERE vehicle_id = $1
      AND timestamp_my >= $2
      AND latitude  IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY date_trunc('minute', timestamp_my), timestamp_my ASC
    LIMIT 1440
    `,
    BigInt(id),
    midnight,
  );
  const todayKm = totalDistanceKm(todayPings);

  const mapVehicles =
    latitude != null && longitude != null
      ? [{ id, name: vehicle.name ?? id, plateNumber: vehicle.plateNumber ?? "", status, latitude, longitude, lastSeenAt: lastSeenAt?.toISOString() ?? null }]
      : [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/dashboard/vehicles" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{vehicle.name ?? id}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs bg-muted text-foreground px-2 py-0.5 rounded border border-border">
                {vehicle.plateNumber}
              </span>
              {vehicle.type && (
                <Badge variant="secondary" className="text-xs">{vehicle.type}</Badge>
              )}
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userCanEdit && (
            <Button variant="outline" size="sm" className="gap-1.5 active:scale-[0.98] transition-transform" render={<Link href={`/dashboard/vehicles/${id}/edit`} />}>
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {userCanDelete && (
            <DeleteVehicleButton vehicleId={id} vehicleName={vehicle.name ?? id} />
          )}
        </div>
      </div>

      {/* ── Tabs (Overview + History) ───────────────────────────────────── */}
      <VehicleDetailTabs
        vehicle={{
          id,
          imei:        vehicle.imei,
          name:        vehicle.name,
          plateNumber: vehicle.plateNumber,
          driverName:  vehicle.driverName,
          orgName:     vehicle.org?.name ?? null,
          userRole,
        }}
        mapVehicles={mapVehicles}
        lastSeenAt={lastSeenAt?.toISOString() ?? null}
        speed={speed}
        todayKm={todayKm}
      />
    </div>
  );
}
