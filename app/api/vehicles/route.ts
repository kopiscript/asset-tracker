import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { getAccessibleVehicleFilter } from "@/lib/permissions";
import { deriveStatus } from "@/lib/status";

// GET /api/vehicles — list all vehicles the current user can access
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  try {
    const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";

    type LatestRow = {
      vehicle_id: bigint;
      latitude: number | null;
      longitude: number | null;
      timestamp_utc: Date | null;
      speed_kmh: number | null;
    };

    // Fetch latest telemetry per vehicle in one query using DISTINCT ON.
    // This avoids the nested-include + take/orderBy pattern that requires
    // Prisma to use transactions, which PrismaNeonHttp does not support.
    async function latestTelemetry(ids: bigint[]): Promise<Map<string, LatestRow>> {
      if (ids.length === 0) return new Map();
      const rows: LatestRow[] = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT ON (vehicle_id) vehicle_id, latitude, longitude, timestamp_utc, speed_kmh
         FROM telemetry_records
         WHERE vehicle_id = ANY($1::bigint[])
           AND latitude IS NOT NULL
           AND longitude IS NOT NULL
         ORDER BY vehicle_id, timestamp_utc DESC`,
        ids
      );
      return new Map(rows.map((r) => [r.vehicle_id.toString(), r]));
    }

    function shapeVehicle(
      v: { id: bigint; imei: string; name: string | null; plateNumber: string | null; type: string | null; driverName: string | null; isActive: boolean | null; orgId: string | null; org: { id: string; name: string } | null },
      telemetryMap: Map<string, LatestRow>,
      userRole: string
    ) {
      const latest = telemetryMap.get(v.id.toString()) ?? null;
      return {
        id: v.id.toString(),
        imei: v.imei,
        name: v.name,
        plateNumber: v.plateNumber,
        type: v.type,
        driverName: v.driverName,
        isActive: v.isActive,
        latitude: latest?.latitude ?? null,
        longitude: latest?.longitude ?? null,
        lastSeenAt: latest?.timestamp_utc?.toISOString() ?? null,
        speed: latest?.speed_kmh ?? null,
        status: deriveStatus(v.isActive, latest?.timestamp_utc ?? null),
        orgId: v.orgId,
        orgName: v.org?.name ?? null,
        userRole,
      };
    }

    type VehicleRow = Parameters<typeof shapeVehicle>[0];

    if (isAdmin) {
      const rows = await prisma.vehicle.findMany({
        include: { org: { select: { id: true, name: true } } },
      }) as VehicleRow[];
      const tm = await latestTelemetry(rows.map((v) => v.id));
      const vehicles = rows.map((v) => shapeVehicle(v, tm, "owner"));
      return Response.json({ data: vehicles, error: null });
    }

    const access = await getAccessibleVehicleFilter(dbUser.id);
    if (!access) {
      return Response.json({ data: [], error: null });
    }
    const rows = await prisma.vehicle.findMany({
      where: { OR: access.orClauses },
      include: { org: { select: { id: true, name: true } } },
    }) as VehicleRow[];
    const tm = await latestTelemetry(rows.map((v) => v.id));
    const orgRoleMap = access.orgRoleMap as Map<string, string>;
    const vehicles = rows.map((v) =>
      shapeVehicle(v, tm, v.orgId ? (orgRoleMap.get(v.orgId) ?? "viewer") : "viewer")
    );
    return Response.json({ data: vehicles, error: null });
  } catch (e) {
    console.error("[GET /api/vehicles]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/vehicles — create a new vehicle
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "User not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.imei || typeof body.imei !== "string") {
    return Response.json({ data: null, error: "IMEI is required." }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string") {
    return Response.json({ data: null, error: "Vehicle name is required." }, { status: 400 });
  }
  if (!body.plateNumber || typeof body.plateNumber !== "string") {
    return Response.json({ data: null, error: "Plate number is required." }, { status: 400 });
  }

  // Resolve orgId: use provided orgId if the user is an owner there, or auto-pick their first owned org
  let orgId: string | null = null;
  if (body.orgId && typeof body.orgId === "string") {
    const membership = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: dbUser.id, orgId: body.orgId } },
      select: { role: true },
    });
    const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
    if (!isAdmin && membership?.role !== "owner") {
      return Response.json(
        { data: null, error: "You must be an org owner to add vehicles." },
        { status: 403 }
      );
    }
    orgId = body.orgId;
  } else {
    // Auto-pick the user's first owned org
    const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
    if (!isAdmin) {
      const firstOwned = await prisma.orgMember.findFirst({
        where: { userId: dbUser.id, role: "owner" },
        select: { orgId: true },
      });
      orgId = firstOwned?.orgId ?? null;
    }
  }

  try {
    const v = await prisma.vehicle.create({
      data: {
        imei: (body.imei as string).trim().toUpperCase(),
        name: body.name as string,
        plateNumber: (body.plateNumber as string).toUpperCase(),
        type: body.type && typeof body.type === "string" ? body.type : null,
        driverName: body.driverName && typeof body.driverName === "string" ? body.driverName : null,
        isActive: true,
        orgId,
      },
    });

    return Response.json(
      { data: { ...v, id: v.id.toString() }, error: null },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/vehicles]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
