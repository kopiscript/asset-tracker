import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canManageFleet, getOrgRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FleetPageClient } from "./FleetPageClient";

export default async function FleetDetailPage(
  props: PageProps<"/dashboard/orgs/[id]/fleets/[fleetId]">
) {
  const { id: orgId, fleetId } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  const orgRole = isAdmin ? "owner" : await getOrgRole(dbUser.id, orgId);
  if (!orgRole) return notFound();

  const fleet = await prisma.fleet.findUnique({
    where: { id: fleetId },
    include: {
      vehicles: {
        include: {
          vehicle: { select: { id: true, name: true, plateNumber: true, type: true, isActive: true } },
        },
      },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!fleet || fleet.orgId !== orgId) return notFound();

  // All org members (admin/viewer) not yet in this fleet — for the "add member" dropdown
  const allOrgMembers = await prisma.orgMember.findMany({
    where: { orgId, role: { in: ["admin", "viewer"] } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const fleetMemberIds = new Set(fleet.members.map((m) => m.userId));
  const availableToAdd = allOrgMembers.filter((m) => !fleetMemberIds.has(m.userId));

  // All org vehicles not yet in this fleet — for the "add vehicle" dropdown
  const allOrgVehicles = await prisma.vehicle.findMany({
    where: { orgId },
    select: { id: true, name: true, plateNumber: true },
  });
  const fleetVehicleIds = new Set(fleet.vehicles.map((fv) => fv.vehicleId.toString()));
  const availableVehicles = allOrgVehicles.filter((v) => !fleetVehicleIds.has(v.id.toString()));

  const canManage = await canManageFleet(dbUser.id, fleetId);

  const orgMemberRoleMap = new Map(allOrgMembers.map((m) => [m.userId, m.role]));

  const roleColor = (role: string) =>
    role === "admin"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href={`/dashboard/orgs/${orgId}`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{fleet.name}</h1>
          <p className="text-sm text-muted-foreground">Fleet</p>
        </div>
      </div>

      {/* ── Vehicles ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Car className="h-4 w-4" /> Vehicles ({fleet.vehicles.length})
          </h2>
          {canManage && availableVehicles.length > 0 && (
            <FleetPageClient orgId={orgId} fleetId={fleetId} action="add-vehicle" options={availableVehicles.map((v) => ({ id: v.id.toString(), label: `${v.name ?? v.id.toString()} — ${v.plateNumber ?? ""}` }))} />
          )}
        </div>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {fleet.vehicles.map((fv, i) => (
            <div key={fv.vehicleId.toString()} className={`flex items-center gap-3 px-4 py-3 ${i < fleet.vehicles.length - 1 ? "border-b border-border/30" : ""}`}>
              <Link href={`/dashboard/vehicles/${fv.vehicle.id.toString()}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors flex-1">
                {fv.vehicle.name ?? fv.vehicle.id.toString()}
              </Link>
              {fv.vehicle.plateNumber && (
                <span className="font-mono text-xs text-muted-foreground">{fv.vehicle.plateNumber}</span>
              )}
              {canManage && (
                <FleetPageClient orgId={orgId} fleetId={fleetId} action="remove-vehicle" targetId={fv.vehicleId.toString()} />
              )}
            </div>
          ))}
          {fleet.vehicles.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No vehicles in this fleet.</div>
          )}
        </div>
      </div>

      {/* ── Members with fleet access ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> Fleet Access ({fleet.members.length})
          </h2>
          {canManage && availableToAdd.length > 0 && (
            <FleetPageClient orgId={orgId} fleetId={fleetId} action="add-member" options={availableToAdd.map((m) => ({ id: m.userId, label: `${m.user.name} (${m.role})` }))} />
          )}
        </div>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          {fleet.members.map((m, i) => (
            <div key={m.userId} className={`flex items-center gap-3 px-4 py-3 ${i < fleet.members.length - 1 ? "border-b border-border/30" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">{(m.user.name ?? m.user.email)[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
              </div>
              <Badge className={`text-xs capitalize border ${roleColor(orgMemberRoleMap.get(m.userId) ?? "viewer")}`}>
                {orgMemberRoleMap.get(m.userId) ?? "viewer"}
              </Badge>
              {canManage && (
                <FleetPageClient orgId={orgId} fleetId={fleetId} action="remove-member" targetId={m.userId} />
              )}
            </div>
          ))}
          {fleet.members.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No users have access to this fleet yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
