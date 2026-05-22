/**
 * app/api/vehicles/[id]/history/route.ts
 * GET — on-demand location history for a single vehicle.
 *
 * Query params (MY time, no timezone — treated as UTC digits matching timestamp_my column):
 *   from=YYYY-MM-DDTHH:mmZ   e.g. 2026-05-18T00:00Z
 *   to=YYYY-MM-DDTHH:mmZ     e.g. 2026-05-18T23:59Z
 *
 * Deduplication: one record per minute bucket (DISTINCT ON). The GPS hardware
 * occasionally sends duplicate payloads within the same minute; we keep the first.
 *
 * Max window: 30 days. Returns up to 5 000 points.
 */
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canView } from "@/lib/permissions";
import { todayMidnightMy, totalDistanceKm } from "@/lib/geo";

const MAX_DAYS = 30;
const MAX_POINTS = 5000;
const MY_OFFSET_MS = 8 * 60 * 60 * 1000;
const TRIP_GAP_MS = 10 * 60 * 1000; // 10-minute silence = new trip

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/history">
) {
  const { id } = await ctx.params;

  const dbUser = await getOrCreateDbUser();
  if (!dbUser) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = dbUser.usertype === "admin" || dbUser.usertype === "system_admin";
  if (!isAdmin && !(await canView(dbUser.id, id))) {
    return Response.json({ data: null, error: "Not found" }, { status: 404 });
  }

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default: today midnight MY → now MY (both as "fake UTC" matching timestamp_my column)
  const now = new Date();
  const nowMyFakeUtc = new Date(now.getTime() + MY_OFFSET_MS);

  const from = fromParam ? new Date(fromParam) : todayMidnightMy();
  const to   = toParam   ? new Date(toParam)   : nowMyFakeUtc;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return Response.json({ data: null, error: "Invalid date range" }, { status: 400 });
  }

  // Enforce 30-day max window
  const windowDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (windowDays > MAX_DAYS) {
    return Response.json(
      { data: null, error: `Maximum history window is ${MAX_DAYS} days` },
      { status: 400 }
    );
  }

  try {
    // DISTINCT ON deduplicates same-minute duplicates from the hardware.
    // We filter and order on timestamp_my (MY local time, stored as fake-UTC).
    //
    // timestamp_my is TIMESTAMP WITHOUT TIME ZONE. Returning it as a raw Date
    // causes JS to re-interpret it in the local server timezone, shifting the
    // value on non-UTC machines (e.g. UTC+8 dev environments). Using to_char
    // returns a plain text string with an explicit Z suffix so the client
    // always reads the digits as-is, with no timezone shift applied.
    type Row = {
      latitude: number;
      longitude: number;
      timestamp_my: string;   // text from to_char — MY time digits + literal Z
      speed_kmh: number | null;
    };

    const rows = await prisma.$queryRawUnsafe<Row[]>(
      `
      SELECT DISTINCT ON (date_trunc('minute', timestamp_my))
        latitude,
        longitude,
        to_char(timestamp_my, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS timestamp_my,
        speed_kmh
      FROM telemetry_records
      WHERE vehicle_id = $1
        AND timestamp_my >= $2
        AND timestamp_my <= $3
        AND latitude  IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY date_trunc('minute', timestamp_my), timestamp_my ASC
      LIMIT $4
      `,
      BigInt(id),
      from,
      to,
      MAX_POINTS
    );

    type Point = { latitude: number; longitude: number; timestampMy: string; speedKmh: number | null };
    type TripRecord = {
      id: number;
      startedAt: string;
      endedAt: string;
      durationMinutes: number;
      distanceKm: number;
      pointCount: number;
      points: Point[];
    };

    const allPoints: Point[] = rows.map((r) => ({
      latitude:    r.latitude,
      longitude:   r.longitude,
      timestampMy: r.timestamp_my,
      speedKmh:    r.speed_kmh,
    }));

    // Segment points into trips by a 10-minute silence threshold
    const trips: TripRecord[] = [];
    let currentPoints: Point[] = [];

    for (const pt of allPoints) {
      if (currentPoints.length === 0) {
        currentPoints.push(pt);
      } else {
        const lastPt = currentPoints[currentPoints.length - 1];
        const gapMs = new Date(pt.timestampMy).getTime() - new Date(lastPt.timestampMy).getTime();
        if (gapMs > TRIP_GAP_MS) {
          trips.push(buildTrip(trips.length + 1, currentPoints));
          currentPoints = [pt];
        } else {
          currentPoints.push(pt);
        }
      }
    }
    if (currentPoints.length > 0) {
      trips.push(buildTrip(trips.length + 1, currentPoints));
    }

    return Response.json({ data: trips, error: null });
  } catch (e) {
    console.error("[GET /api/vehicles/[id]/history]", e);
    return Response.json({ data: null, error: "Internal server error." }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Point = { latitude: number; longitude: number; timestampMy: string; speedKmh: number | null };

function buildTrip(id: number, pts: Point[]) {
  const startedAt = pts[0].timestampMy;
  const endedAt   = pts[pts.length - 1].timestampMy;
  const durationMinutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000
  );
  const distanceKm = Math.round(totalDistanceKm(pts) * 10) / 10;
  return { id, startedAt, endedAt, durationMinutes, distanceKm, pointCount: pts.length, points: pts };
}
