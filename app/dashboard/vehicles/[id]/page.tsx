/**
 * app/dashboard/vehicles/[id]/page.tsx
 * Single vehicle detail page.
 * In Next.js 16, params is a Promise — must be awaited.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteVehicleButton } from "./DeleteVehicleButton";
import { VehicleDetailTabs } from "./VehicleDetailTabs";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit, canShare } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/status";
import { totalDistanceKm, todayMidnightMy } from "@/lib/geo";

export default async function VehicleDetailPage(
  props: PageProps<"/dashboard/vehicles/[id]">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const isAdmin = dbUser.usertype === "admin";

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: BigInt(id) },
    include: {
      owner: { select: { name: true, email: true } },
      telemetryRecords: {
        orderBy: { timestampUtc: "desc" },
        take: 1,
        select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
      },
    },
  });
  if (!vehicle) return notFound();

  // Access gate — admins bypass vehicle_access check
  if (!isAdmin) {
    const access = await prisma.vehicleAccess.findUnique({
      where: { vehicleId_userId: { vehicleId: BigInt(id), userId: dbUser.id } },
    });
    if (!access) return notFound();
  }

  const access = isAdmin
    ? null
    : await prisma.vehicleAccess.findUnique({
        where: { vehicleId_userId: { vehicleId: BigInt(id), userId: dbUser.id } },
      });

  const userRole    = isAdmin ? "admin" : (access?.role ?? "viewer");
  const userCanEdit = isAdmin || userRole === "editor" || userRole === "owner";
  const userCanShare = !isAdmin && userRole === "owner";

  const latest    = vehicle.telemetryRecords[0] ?? null;
  const latitude  = latest?.latitude  ?? null;
  const longitude = latest?.longitude ?? null;
  const lastSeenAt = latest?.timestampUtc ?? null;
  const speed     = latest?.speedKmh ?? null;
  const status    = deriveStatus(vehicle.isActive, lastSeenAt);

  // Today's mileage — query pings from MY midnight to now, compute Haversine sum
  const midnight = todayMidnightMy();
  const todayPings = await prisma.telemetryRecord.findMany({
    where: {
      vehicleId:   BigInt(id),
      timestampMy: { gte: midnight },
      latitude:    { not: null },
      longitude:   { not: null },
    },
    orderBy: { timestampMy: "asc" },
    select: { latitude: true, longitude: true },
  });
  const todayKm = totalDistanceKm(todayPings);

  const mapVehicles =
    latitude != null && longitude != null
      ? [{
          id,
          name: vehicle.name ?? id,
          plateNumber: vehicle.plateNumber ?? "",
          status,
          latitude,
          longitude,
          lastSeenAt: lastSeenAt?.toISOString() ?? null,
        }]
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
            <Button variant="outline" size="sm" className="gap-1.5" render={<Link href={`/dashboard/vehicles/${id}/edit`} />}>
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {userCanShare && (
            <Button variant="outline" size="sm" className="gap-1.5" render={<Link href={`/dashboard/vehicles/${id}/share`} />}>
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
          {userRole === "owner" && (
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
          ownerName:   vehicle.owner?.name ?? null,
          ownerEmail:  vehicle.owner?.email ?? null,
          userRole,
        }}
        mapVehicles={mapVehicles}
        latitude={latitude}
        longitude={longitude}
        lastSeenAt={lastSeenAt?.toISOString() ?? null}
        speed={speed}
        todayKm={todayKm}
      />
    </div>
  );
}
