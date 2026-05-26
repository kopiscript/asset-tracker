/**
 * app/api/vehicles/[id]/location/route.ts
 * PATCH — receive a GPS ping from a hardware device and store it.
 *
 * Auth: API key in Authorization header (Bearer <key>).
 * The key is stored as a field on the vehicle record (set manually via Prisma Studio for v1).
 *
 * Body: { latitude, longitude, speed?, recordedAt? }
 *
 * Writes one row to telemetry_records. The vehicle's current position is always
 * derived from the latest telemetry row — nothing is stored on vehicles directly.
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const MY_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

// Rate limiter: 2 pings per minute per vehicle. Requires UPSTASH_REDIS_REST_URL + TOKEN env vars.
// Gracefully bypassed when Upstash is not configured (logs a warning in production).
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(2, "1 m"),
    prefix: "rl:location",
  });
} else if (process.env.NODE_ENV === "production") {
  console.warn("[location] Rate limiting disabled — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/location">
) {
  const { id } = await ctx.params;

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
  // If the vehicle has an API key configured, the provided key must match its bcrypt hash
  if (vehicle.apiKey !== null) {
    const valid = await bcrypt.compare(providedKey, vehicle.apiKey);
    if (!valid) {
      return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
  }

  // Rate limit: 2 pings/min per vehicle
  if (ratelimit) {
    const { success } = await ratelimit.limit(`vehicle:${id}`);
    if (!success) {
      return Response.json({ data: null, error: "Too many requests" }, { status: 429 });
    }
  }

  let body: { latitude?: unknown; longitude?: unknown; speed?: unknown; recordedAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ data: null, error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return Response.json(
      { data: null, error: "latitude and longitude must be numbers" },
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
