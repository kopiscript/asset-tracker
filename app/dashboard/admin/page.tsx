/**
 * app/dashboard/admin/page.tsx
 * Global admin panel — only accessible to users with usertype = "admin".
 * Shows all vehicles on a live map + a full user roster with their vehicles.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, Users, Activity, WifiOff, Building2 } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { LiveMap } from "@/components/dashboard/LiveMap";
import { StatusBadge } from "@/components/StatusBadge";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/status";
import { timeAgo } from "@/lib/format";
import type { MapVehicle } from "@/components/map/VehicleMap";
import { AdminAddVehicleForm } from "./AdminAddVehicleForm";
import { AdminAssignOrgCell } from "./AdminAssignOrgCell";

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
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-3xl font-semibold tabular-nums leading-none tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser || (dbUser.usertype !== "admin" && dbUser.usertype !== "system_admin")) redirect("/dashboard");

  // All vehicles with latest telemetry
  const vehicles = await prisma.vehicle.findMany({
    include: {
      org: { select: { name: true } },
      telemetryRecords: {
        where: { latitude: { not: null }, longitude: { not: null } },
        orderBy: { timestampUtc: "desc" },
        take: 1,
        select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // All orgs with member + vehicle + fleet counts
  const orgs = await prisma.organization.findMany({
    include: {
      _count: { select: { members: true, vehicles: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // All users with their org memberships
  const users = await prisma.user.findMany({
    select: {
      id:        true,
      name:      true,
      email:     true,
      usertype:  true,
      createdAt: true,
      orgMemberships: {
        select: {
          role: true,
          org: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const vehicleRows = vehicles.map((v) => {
    const latest = v.telemetryRecords[0] ?? null;
    return {
      id:          v.id.toString(),
      imei:        v.imei,
      name:        v.name,
      plateNumber: v.plateNumber,
      isActive:    v.isActive,
      latitude:    latest?.latitude  ?? null,
      longitude:   latest?.longitude ?? null,
      lastSeenAt:  latest?.timestampUtc ?? null,
      speed:       latest?.speedKmh ?? null,
      status:      deriveStatus(v.isActive, latest?.timestampUtc ?? null),
      orgId:       v.orgId ?? null,
      orgName:     v.org?.name ?? null,
    };
  });

  const orgOptions = orgs.map((o) => ({ id: o.id, name: o.name }));

  const mapVehicles: MapVehicle[] = vehicleRows
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({
      id:          v.id,
      name:        v.name ?? v.imei,
      plateNumber: v.plateNumber ?? "",
      status:      v.status,
      latitude:    v.latitude!,
      longitude:   v.longitude!,
      lastSeenAt:  v.lastSeenAt?.toISOString() ?? null,
    }));

  const activeCount  = vehicleRows.filter((v) => v.status === "active").length;
  const offlineCount = vehicleRows.filter((v) => v.status === "offline").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground leading-none tracking-tight">
          <PageTitle k="adminPanel" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          <PageTitle k="globalOverview" />
        </p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Car className="h-3.5 w-3.5 text-muted-foreground" />}
          label={<PageTitle k="vehicles" />}
          value={vehicles.length}
          valueClass="text-foreground"
        />
        <StatCard
          icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />}
          label={<PageTitle k="statUsers" />}
          value={users.length}
          valueClass="text-foreground"
        />
        <StatCard
          icon={<Activity className="h-3.5 w-3.5 text-green-600" />}
          label={<PageTitle k="statusActive" />}
          value={activeCount}
          valueClass="text-green-600"
        />
        <StatCard
          icon={<WifiOff className="h-3.5 w-3.5 text-red-500" />}
          label={<PageTitle k="statusOffline" />}
          value={offlineCount}
          valueClass="text-red-600"
        />
      </div>

      {/* ── Global map ─────────────────────────────────────────────────── */}
      <div className="h-80 lg:h-[28rem] rounded-xl overflow-hidden border border-border">
        <LiveMap initialVehicles={mapVehicles} className="h-full w-full" />
      </div>

      {/* ── Vehicle table ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between border-t border-border/40 pt-6 mb-4">
          <h2 className="text-sm font-semibold text-foreground"><PageTitle k="allVehicles" /></h2>
          <AdminAddVehicleForm orgs={orgOptions} />
        </div>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="colVehicle" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell"><PageTitle k="colOrg" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="status" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell"><PageTitle k="lastSeen" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell"><PageTitle k="colSpeed" /></th>
              </tr>
            </thead>
            <tbody>
              {vehicleRows.map((v) => (
                <tr key={v.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/vehicles/${v.id}`} className="hover:underline font-medium text-foreground">
                      {v.name ?? v.imei}
                    </Link>
                    {v.plateNumber && (
                      <p className="font-mono text-xs text-muted-foreground">{v.plateNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <AdminAssignOrgCell
                      vehicleId={v.id}
                      orgId={v.orgId}
                      orgName={v.orgName}
                      orgs={orgOptions}
                    />
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {v.lastSeenAt ? timeAgo(v.lastSeenAt) : <PageTitle k="never" />}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {v.speed != null ? `${v.speed.toFixed(1)} km/h` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicleRows.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground"><PageTitle k="noVehiclesInSystem" /></div>
          )}
          </div>
        </div>
      </div>

      {/* ── Org table ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground border-t border-border/40 pt-6 mb-4"><PageTitle k="allOrganisations" /></h2>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="organisation" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell"><PageTitle k="members" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="vehicles" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="colManage" /></th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{o.name}</p>
                    <p className="text-xs text-muted-foreground font-mono hidden sm:block truncate max-w-[160px]">{o.id}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {o._count.members}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> {o._count.vehicles}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orgs/${o.id}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      <PageTitle k="configure" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orgs.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground"><PageTitle k="noOrgsInSystem" /></div>
          )}
          </div>
        </div>
      </div>

      {/* ── User table ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground border-t border-border/40 pt-6 mb-4"><PageTitle k="allUsers" /></h2>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="colUser" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell"><PageTitle k="colRole" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"><PageTitle k="colOrgs" /></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell"><PageTitle k="colJoined" /></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full border ${
                      u.usertype === "admin"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {u.usertype}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.orgMemberships.length === 0 ? (
                        <span className="text-muted-foreground text-xs"><PageTitle k="noneAssigned" /></span>
                      ) : (
                        u.orgMemberships.slice(0, 3).map((m) => (
                          <Link
                            key={m.org.id}
                            href={`/dashboard/orgs/${m.org.id}`}
                            className="text-xs bg-muted px-2 py-1 rounded border border-border hover:border-primary/30 transition-colors"
                          >
                            {m.org.name}
                            <span className="ml-1 text-muted-foreground capitalize">({m.role})</span>
                          </Link>
                        ))
                      )}
                      {u.orgMemberships.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{u.orgMemberships.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    {u.createdAt ? timeAgo(u.createdAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground"><PageTitle k="noUsersInSystem" /></div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
