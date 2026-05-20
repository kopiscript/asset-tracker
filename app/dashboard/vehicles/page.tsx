import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiclesClient } from "./VehiclesClient";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/status";

export default async function VehiclesPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view vehicles.</p>
      </div>
    );
  }

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";

  let vehicles: {
    id: string; imei: string; name: string | null; plateNumber: string | null;
    type: string | null; driverName: string | null; isActive: boolean | null;
    latitude: number | null; longitude: number | null; lastSeenAt: string | null;
    status: string; userRole: string; orgId: string | null; orgName: string | null;
  }[] = [];

  if (isAdmin) {
    const rows = await prisma.vehicle.findMany({
      include: {
        org: { select: { id: true, name: true } },
        telemetryRecords: {
          where: { latitude: { not: null }, longitude: { not: null } },
          orderBy: { timestampUtc: "desc" },
          take: 1,
          select: { latitude: true, longitude: true, timestampUtc: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    vehicles = rows.map((v) => {
      const latest = v.telemetryRecords[0] ?? null;
      return {
        id: v.id.toString(), imei: v.imei, name: v.name, plateNumber: v.plateNumber,
        type: v.type, driverName: v.driverName, isActive: v.isActive,
        latitude: latest?.latitude ?? null, longitude: latest?.longitude ?? null,
        lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
        status: deriveStatus(v.isActive, latest?.timestampUtc ?? null),
        userRole: "owner", orgId: v.orgId, orgName: v.org?.name ?? null,
      };
    });
  } else {
    const [orgMemberships, fleetMemberships] = await Promise.all([
      prisma.orgMember.findMany({ where: { userId: dbUser.id }, select: { orgId: true, role: true } }),
      prisma.fleetMember.findMany({ where: { userId: dbUser.id }, select: { fleetId: true } }),
    ]);

    const ownerOrgIds = orgMemberships.filter((m) => m.role === "owner").map((m) => m.orgId);
    const memberFleetIds = fleetMemberships.map((m) => m.fleetId);
    const orgRoleMap = new Map(orgMemberships.map((m) => [m.orgId, m.role]));

    if (ownerOrgIds.length > 0 || memberFleetIds.length > 0) {
      const orClauses = [
        ...(ownerOrgIds.length > 0 ? [{ orgId: { in: ownerOrgIds } }] : []),
        ...(memberFleetIds.length > 0 ? [{ fleets: { some: { fleetId: { in: memberFleetIds } } } }] : []),
      ];

      const rows = await prisma.vehicle.findMany({
        where: { OR: orClauses },
        include: {
          org: { select: { id: true, name: true } },
          telemetryRecords: {
            where: { latitude: { not: null }, longitude: { not: null } },
            orderBy: { timestampUtc: "desc" },
            take: 1,
            select: { latitude: true, longitude: true, timestampUtc: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      vehicles = rows.map((v) => {
        const latest = v.telemetryRecords[0] ?? null;
        return {
          id: v.id.toString(), imei: v.imei, name: v.name, plateNumber: v.plateNumber,
          type: v.type, driverName: v.driverName, isActive: v.isActive,
          latitude: latest?.latitude ?? null, longitude: latest?.longitude ?? null,
          lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
          status: deriveStatus(v.isActive, latest?.timestampUtc ?? null),
          userRole: v.orgId ? (orgRoleMap.get(v.orgId) ?? "viewer") : "viewer",
          orgId: v.orgId, orgName: v.org?.name ?? null,
        };
      });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          render={<Link href="/dashboard/vehicles/new" />}
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <VehiclesClient initialVehicles={vehicles} />
    </div>
  );
}
