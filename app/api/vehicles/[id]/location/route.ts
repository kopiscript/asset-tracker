/**
 * app/api/vehicles/[id]/location/route.ts
 * PATCH — receive a GPS ping from a hardware device and store it.
 *
 * Auth: API key in Authorization header (Bearer <key>).
 * Rate limit: derived from the vehicle's organisation plan via lib/plans.ts.
 *
 * Body: { latitude, longitude, speed?, recordedAt? }
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getPlan, type PlanKey } from "@/lib/plans";

const MY_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8

// Redis singleton — shared across all requests in the same function instance
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else if (process.env.NODE_ENV === "production") {
  console.warn("[location] Rate limiting disabled — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
}

// One Ratelimit instance per plan, created lazily and cached for the process lifetime
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(plan: string): Ratelimit | null {
  if (!redis) return null;
  if (limiterCache.has(plan)) return limiterCache.get(plan)!;
  const { rateMax, rateWindow } = getPlan(plan);
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rateMax, rateWindow as `${number} ${"s" | "m" | "h" | "d"}`),
    prefix: `rl:location:${plan}`,
  });
  limiterCache.set(plan, limiter);
  return limiter;
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
    select: {
      id: true,
      imei: true,
      apiKey: true,
      org: { select: { plan: true } },
    },
  });
  if (!vehicle) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  if (!vehicle.apiKey) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const valid = await bcrypt.compare(providedKey, vehicle.apiKey);
  if (!valid) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // Per-plan rate limit
  const plan = (vehicle.org?.plan ?? "free") as PlanKey;
  const limiter = getLimiter(plan);
  if (limiter) {
    const { success } = await limiter.limit(`vehicle:${id}`);
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
