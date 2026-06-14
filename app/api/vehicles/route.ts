import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
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

    let vehiclesRaw;

    if (isAdmin) {
      vehiclesRaw = await prisma.vehicle.findMany({
        select: {
          id: true, imei: true, name: true, plateNumber: true, type: true,
          driverName: true, isActive: true, orgId: true,
          org: { select: { id: true, name: true } },
          telemetryRecords: {
            where: { latitude: { not: null }, longitude: { not: null } },
            orderBy: { timestampUtc: "desc" },
            take: 1,
            select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
          },
        },
      });
    } else {
      const orgMemberships = await prisma.orgMember.findMany({
        where: { userId: dbUser.id },
        select: { orgId: true, role: true, vehicleAccess: { select: { vehicleId: true } } },
      });

      if (orgMemberships.length === 0) {
        return Response.json({ data: [], error: null });
      }

      // For restricted viewers (has allowlist rows), only include their granted vehicles
      const orClauses = orgMemberships.map((m) => {
        if (m.role === "viewer" && m.vehicleAccess.length > 0) {
          return { orgId: m.orgId, id: { in: m.vehicleAccess.map((a) => a.vehicleId) } };
        }
        return { orgId: m.orgId };
      });

      vehiclesRaw = await prisma.vehicle.findMany({
        where: { OR: orClauses },
        select: {
          id: true, imei: true, name: true, plateNumber: true, type: true,
          driverName: true, isActive: true, orgId: true,
          org: { select: { id: true, name: true } },
          telemetryRecords: {
            where: { latitude: { not: null }, longitude: { not: null } },
            orderBy: { timestampUtc: "desc" },
            take: 1,
            select: { latitude: true, longitude: true, timestampUtc: true, speedKmh: true },
          },
        },
      });

      // Build role map: orgId -> role
      const orgRoleMap = new Map(orgMemberships.map((m) => [m.orgId, m.role]));

      const vehicles = vehiclesRaw.map((v) => {
        const latest = v.telemetryRecords[0] ?? null;
        const userRole = v.orgId ? (orgRoleMap.get(v.orgId) ?? "viewer") : "viewer";
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
          lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
          speed: latest?.speedKmh ?? null,
          status: deriveStatus(v.isActive, latest?.timestampUtc ?? null),
          orgId: v.orgId,
          orgName: v.org?.name ?? null,
          userRole,
        };
      });

      return Response.json({ data: vehicles, error: null });
    }

    // System admin path
    const vehicles = vehiclesRaw.map((v) => {
      const latest = v.telemetryRecords[0] ?? null;
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
        lastSeenAt: latest?.timestampUtc?.toISOString() ?? null,
        speed: latest?.speedKmh ?? null,
        status: deriveStatus(v.isActive, latest?.timestampUtc ?? null),
        orgId: v.orgId,
        orgName: v.org?.name ?? null,
        userRole: "owner",
      };
    });

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
