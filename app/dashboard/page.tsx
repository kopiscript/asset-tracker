/**
 * app/dashboard/page.tsx
 * Main dashboard — shows a summary stats bar, the live map (60%+),
 * and a mini vehicle list on the right/bottom.
 */
import Link from "next/link";
import { Plus, Activity, Clock, WifiOff, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicMap } from "@/components/map/DynamicMap";
import { StatusBadge } from "@/components/StatusBadge";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";

export default async function DashboardPage() {
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return null;

  // Fetch all accessible vehicles with basic details
  const accesses = await prisma.vehicleAccess.findMany({
    where: { userId: dbUser.id },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          plateNumber: true,
          status: true,
          latitude: true,
          longitude: true,
          lastSeenAt: true,
          type: true,
        },
      },
    },
  });

  const vehicles = accesses.map((a) => ({
    ...a.vehicle,
    lastSeenAt: a.vehicle.lastSeenAt?.toISOString() ?? null,
    userRole: a.role,
  }));

  // Stats
  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const idleCount = vehicles.filter((v) => v.status === "idle").length;
  const offlineCount = vehicles.filter((v) => v.status === "offline").length;

  const mapVehicles = vehicles
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({
      id: v.id,
      name: v.name,
      plateNumber: v.plateNumber,
      status: v.status,
      latitude: v.latitude!,
      longitude: v.longitude!,
      lastSeenAt: v.lastSeenAt,
    }));

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Fleet overview — {vehicles.length} vehicle
              {vehicles.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-[#00c2cc] hover:bg-[#009aa3] text-[#0f1923] font-semibold"
            render={<Link href="/dashboard/vehicles/new" />}
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Car className="h-4 w-4 text-[#00c2cc]" />}
            label="Total"
            value={vehicles.length}
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-green-500" />}
            label="Active"
            value={activeCount}
            colour="text-green-400"
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
            label="Idle"
            value={idleCount}
            colour="text-yellow-400"
          />
          <StatCard
            icon={<WifiOff className="h-4 w-4 text-red-500" />}
            label="Offline"
            value={offlineCount}
            colour="text-red-400"
          />
        </div>
      </div>

      {/* ── Main area: map + side panel ───────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden px-4 sm:px-6 pb-4 gap-4 min-h-0">
        {/* Map takes 60%+ of the width */}
        <div className="flex-1 min-h-[300px] min-w-0">
          <DynamicMap
            vehicles={mapVehicles}
            className="h-full w-full rounded-xl overflow-hidden border border-border/50"
          />
        </div>

        {/* Side panel: recent vehicles (hidden on small screens) */}
        <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 overflow-y-auto gap-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">Vehicles</h2>
            <Link
              href="/dashboard/vehicles"
              className="text-xs text-[#00c2cc] hover:underline"
            >
              View all
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Car className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No vehicles yet</p>
              <Link
                href="/dashboard/vehicles/new"
                className="text-xs text-[#00c2cc] hover:underline mt-1"
              >
                Add one →
              </Link>
            </div>
          ) : (
            vehicles.slice(0, 10).map((v) => (
              <Link
                key={v.id}
                href={`/dashboard/vehicles/${v.id}`}
                className="flex items-center gap-3 bg-card border border-border/50 rounded-lg p-3 hover:border-[#00c2cc]/30 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <Car className="h-5 w-5 text-muted-foreground group-hover:text-[#00c2cc] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {v.name}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {v.plateNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(v.lastSeenAt)}
                  </p>
                </div>
                <StatusBadge status={v.status} />
              </Link>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Small stat card component ───────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  colour = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colour?: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
      <div className="p-1.5 bg-white/5 rounded-md">{icon}</div>
      <div>
        <p className={`text-xl font-bold leading-none ${colour}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
