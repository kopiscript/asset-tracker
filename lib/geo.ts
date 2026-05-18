const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sum Haversine distances across an ordered array of coordinate points (in km). */
export function totalDistanceKm(
  points: { latitude: number | null; longitude: number | null }[]
): number {
  const valid = points.filter(
    (p): p is { latitude: number; longitude: number } =>
      p.latitude != null && p.longitude != null
  );
  let total = 0;
  for (let i = 1; i < valid.length; i++) {
    total += haversineKm(
      valid[i - 1].latitude,
      valid[i - 1].longitude,
      valid[i].latitude,
      valid[i].longitude
    );
  }
  return total;
}

/**
 * Returns today's MY-time midnight as a "fake UTC" Date for querying the
 * timestamp_my column. That column stores MY local time with no timezone
 * info; Prisma reads it back as if the digits were UTC. So to filter
 * "since midnight MY time", we construct a Date whose UTC digits equal the
 * MY midnight wall-clock digits.
 */
export function todayMidnightMy(): Date {
  const MY_OFFSET_MS = 8 * 60 * 60 * 1000;
  const nowMy = new Date(Date.now() + MY_OFFSET_MS);
  return new Date(
    Date.UTC(nowMy.getUTCFullYear(), nowMy.getUTCMonth(), nowMy.getUTCDate(), 0, 0, 0, 0)
  );
}
