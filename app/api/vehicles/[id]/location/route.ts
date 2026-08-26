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
import { isOverspeeding, detectHarshEvent, detectGeofenceTransitions } from "@/lib/trackscore";

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
    select: {
      id: true, imei: true, apiKey: true, speedLimitKmh: true,
      geofences: { where: { isActive: true }, select: { id: true, centerLat: true, centerLng: true, radiusM: true } },
    },
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
  const latitude = body.latitude as number;
  const longitude = body.longitude as number;

  try {
    // Previous ping, read BEFORE the insert — the baseline for harsh-event
    // and geofence-transition detection (MIROS TrackScore items 4/5/21-24).
    const prev = await prisma.telemetryRecord.findFirst({
      where: { vehicleId: vehicle.id, latitude: { not: null }, longitude: { not: null } },
      orderBy: { timestampUtc: "desc" },
      select: { latitude: true, longitude: true, speedKmh: true, timestampUtc: true },
    });

    await prisma.telemetryRecord.create({
      data: {
        vehicleId: vehicle.id,
        imei: vehicle.imei,
        timestampUtc,
        timestampMy,
        latitude,
        longitude,
        speedKmh,
      },
    });

    // ── TrackScore detection: overspeed, harsh accel/brake, geofence ──────
    const events: {
      type: string; speedKmh: number | null; detail: string; geofenceId?: string;
    }[] = [];

    if (isOverspeeding(speedKmh, vehicle.speedLimitKmh)) {
      events.push({
        type: "overspeed",
        speedKmh,
        detail: `${speedKmh!.toFixed(0)} km/h in a ${vehicle.speedLimitKmh} km/h zone`,
      });
    }

    const harsh = detectHarshEvent(prev, { speedKmh, timestampUtc });
    if (harsh) {
      events.push({
        type: harsh.type,
        speedKmh,
        detail: `${Math.abs(harsh.rateKmhPerS).toFixed(1)} km/h per second`,
      });
    }

    const geofenceTransitions = detectGeofenceTransitions(
      vehicle.geofences,
      prev && prev.latitude != null && prev.longitude != null
        ? { latitude: prev.latitude, longitude: prev.longitude }
        : null,
      { latitude, longitude }
    );
    for (const t of geofenceTransitions) {
      events.push({
        type: t.type,
        speedKmh,
        detail: t.type === "geofence_enter" ? "Entered geofence" : "Exited geofence",
        geofenceId: t.geofenceId,
      });
    }

    // Sequential creates — PrismaNeonHttp doesn't support createMany/$transaction.
    for (const e of events) {
      await prisma.trackingEvent.create({
        data: {
          vehicleId: vehicle.id,
          type: e.type,
          occurredAt: timestampUtc,
          speedKmh: e.speedKmh,
          latitude,
          longitude,
          detail: e.detail,
          geofenceId: e.geofenceId,
        },
      });
    }

    return Response.json({ data: { ok: true }, error: null });
  } catch (e) {
    console.error("[PATCH /api/vehicles/[id]/location]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}
