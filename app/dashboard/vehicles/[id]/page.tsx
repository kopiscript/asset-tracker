/**
 * app/dashboard/vehicles/[id]/page.tsx
 * Single vehicle detail page.
 * In Next.js 16, params is a Promise — must be awaited.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, Share2, MapPin, User, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DynamicMap } from "@/components/map/DynamicMap";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteVehicleButton } from "./DeleteVehicleButton";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit, canShare } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";

function deriveStatus(isActive: boolean | null, lastSeenAt: Date | null): string {
  if (!isActive) return "offline";
  if (!lastSeenAt) return "idle";
  const minAgo = (Date.now() - lastSeenAt.getTime()) / 60000;
  return minAgo < 10 ? "active" : minAgo < 60 ? "idle" : "offline";
}

export default async function VehicleDetailPage(
  props: PageProps<"/dashboard/vehicles/[id]">
) {
  const { id } = await props.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return notFound();

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: BigInt(id) },
    include: {
      owner: { select: { name: true, email: true } },
      telemetryRecords: {
        orderBy: { timestampUtc: "desc" },
        take: 1,
        select: { latitude: true, longitude: true, timestampUtc: true },
      },
    },
  });
  if (!vehicle) return notFound();

  const access = await prisma.vehicleAccess.findUnique({
    where: { vehicleId_userId: { vehicleId: BigInt(id), userId: dbUser.id } },
  });
  if (!access) return notFound();

  const userCanEdit = await canEdit(dbUser.id, id);
  const userCanShare = await canShare(dbUser.id, id);
  const userRole = access.role;

  const latest = vehicle.telemetryRecords[0] ?? null;
  const latitude = latest?.latitude ?? null;
  const longitude = latest?.longitude ?? null;
  const lastSeenAt = latest?.timestampUtc ?? null;
  const status = deriveStatus(vehicle.isActive, lastSeenAt);

  const mapVehicles =
    latitude != null && longitude != null
      ? [
          {
            id,
            name: vehicle.name ?? id,
            plateNumber: vehicle.plateNumber ?? "",
            status,
            latitude,
            longitude,
            lastSeenAt: lastSeenAt?.toISOString() ?? null,
          },
        ]
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
                <Badge variant="secondary" className="text-xs">
                  {vehicle.type}
                </Badge>
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

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4">
        <div className="h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden border border-border/50">
          <DynamicMap
            vehicles={mapVehicles}
            focusVehicleId={id}
            className="h-full w-full"
          />
        </div>
        {latitude == null && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            No GPS location recorded yet. Map is centred on Kuala Lumpur.
          </p>
        )}
      </div>

      {/* ── Details grid ────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Vehicle Info</h2>
            <div className="space-y-3">
              <DetailRow icon={<User className="h-4 w-4" />} label="Driver">
                {vehicle.driverName ?? "No driver assigned"}
              </DetailRow>
              <Separator className="bg-border/50" />
              <DetailRow icon={<Clock className="h-4 w-4" />} label="Last Seen">
                {lastSeenAt ? timeAgo(lastSeenAt) : "Never"}
              </DetailRow>
              <Separator className="bg-border/50" />
              <DetailRow icon={<FileText className="h-4 w-4" />} label="IMEI">
                <span className="font-mono text-xs">{vehicle.imei}</span>
              </DetailRow>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Additional Info</h2>
            <div className="space-y-3">
              <DetailRow icon={<User className="h-4 w-4" />} label="Owner">
                {vehicle.owner?.name ?? vehicle.owner?.email ?? "—"}
              </DetailRow>
              <Separator className="bg-border/50" />
              <DetailRow icon={<div className="h-4 w-4 text-xs">👤</div>} label="Your Role">
                <span className="capitalize">{userRole}</span>
              </DetailRow>
              {latitude != null && (
                <>
                  <Separator className="bg-border/50" />
                  <DetailRow icon={<MapPin className="h-4 w-4" />} label="Coordinates">
                    <span className="font-mono text-xs">
                      {latitude.toFixed(5)}, {longitude?.toFixed(5)}
                    </span>
                  </DetailRow>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground mt-0.5">{children}</div>
      </div>
    </div>
  );
}
