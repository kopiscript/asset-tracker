/**
 * app/api/vehicles/[id]/location/route.ts
 * PATCH — receive a GPS ping from a hardware device and store it.
 *
 * Auth: API key in Authorization header (Bearer <key>).
 *   - The vehicle MUST have an apiKey provisioned; the token must bcrypt-match it.
 *   - A vehicle with no apiKey rejects all pings (fail closed). Provision a key
 *     via POST /api/vehicles/[id]/api-key before the device can report.
 *
 * Body: { latitude, longitude, speed?, recordedAt? }
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const MY_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/location">
) {
  const { id } = await ctx.params;

  if (!(await rateLimit("location", `${clientIp(request)}:${id}`, 60, "60 s"))) {
    return Response.json({ data: null, error: "Too many requests" }, { status: 429 });
  }

  // API key auth
  const authHeader = request.headers.get("Authorization");
  const providedKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!providedKey) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: BigInt(id) },
    select: { id: true, imei: true, apiKey: true },
  });
  if (!vehicle) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  // Fail closed: a vehicle with no provisioned API key cannot receive pings.
  // (Previously a null apiKey accepted ANY bearer token — an auth bypass that let
  // anyone inject telemetry, since vehicle IDs are sequential and enumerable.)
  if (vehicle.apiKey === null) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const valid = await bcrypt.compare(providedKey, vehicle.apiKey);
  if (!valid) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  let body: { latitude?: unknown; longitude?: unknown; speed?: unknown; recordedAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number" ||
    !Number.isFinite(body.latitude) ||
    !Number.isFinite(body.longitude) ||
    body.latitude < -90 || body.latitude > 90 ||
    body.longitude < -180 || body.longitude > 180
  ) {
    return Response.json(
      { data: null, error: "latitude and longitude must be valid coordinates" },
      { status: 400 }
    );
  }

  const timestampUtc =
    typeof body.recordedAt === "string" ? new Date(body.recordedAt) : new Date();
  const timestampMy = new Date(timestampUtc.getTime() + MY_OFFSET_MS);
  const speedKmh = typeof body.speed === "number" ? body.speed : null;

  try {
    await prisma.telemetryRecord.create({
      data: {
        vehicleId: vehicle.id,
        imei: vehicle.imei,
        timestampUtc,
        timestampMy,
        latitude: body.latitude as number,
        longitude: body.longitude as number,
        speedKmh,
      },
    });

    return Response.json({ data: { ok: true }, error: null });
  } catch (e) {
    console.error("[PATCH /api/vehicles/[id]/location]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
