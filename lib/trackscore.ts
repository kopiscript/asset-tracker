/**
 * lib/trackscore.ts
 * Pure detection helpers for the MIROS TrackScore criteria that can be
 * computed from telemetry alone: overspeed, harsh acceleration/braking, and
 * geofence enter/exit. No React, no DB — safe to import from API routes and
 * server components alike.
 *
 * Reference: MCP No. 557 "TrackScore: Guideline on Heavy Vehicle Tracking
 * System" (MIROS, 2025), Table 1 items 4/5/8/9/21-24.
 */

// ── Overspeed (item 8/9) ─────────────────────────────────────────────────

export function isOverspeeding(speedKmh: number | null, limitKmh: number | null): boolean {
  if (speedKmh == null || limitKmh == null) return false;
  return speedKmh > limitKmh;
}

// ── Harsh acceleration / braking (item 21-24) ────────────────────────────

/**
 * Rate-of-change thresholds, in km/h per second. ~2.5 m/s^2 is the commonly
 * cited harsh-acceleration/braking boundary in fleet telematics literature
 * (roughly 9 km/h gained or lost per second).
 */
export const HARSH_ACCEL_KMH_PER_S = 9;
export const HARSH_BRAKE_KMH_PER_S = 9;

/** Only evaluate a delta between two pings this close together — a wide gap
 * (sparse reporting) makes a speed delta meaningless as a harsh-event signal. */
export const MAX_EVENT_GAP_SECONDS = 15;

export type HarshEvent = { type: "harsh_accel" | "harsh_brake"; rateKmhPerS: number } | null;

export function detectHarshEvent(
  prev: { speedKmh: number | null; timestampUtc: Date } | null,
  curr: { speedKmh: number | null; timestampUtc: Date }
): HarshEvent {
  if (!prev || prev.speedKmh == null || curr.speedKmh == null) return null;
  const deltaSeconds = (curr.timestampUtc.getTime() - prev.timestampUtc.getTime()) / 1000;
  if (deltaSeconds <= 0 || deltaSeconds > MAX_EVENT_GAP_SECONDS) return null;

  const deltaSpeed = curr.speedKmh - prev.speedKmh;
  const rate = deltaSpeed / deltaSeconds;

  if (rate >= HARSH_ACCEL_KMH_PER_S) return { type: "harsh_accel", rateKmhPerS: rate };
  if (rate <= -HARSH_BRAKE_KMH_PER_S) return { type: "harsh_brake", rateKmhPerS: rate };
  return null;
}

// ── Geofence enter/exit (item 4/5) ───────────────────────────────────────

/** Great-circle distance between two coordinates, in metres. */
export function haversineMeters(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isInsideGeofence(
  lat: number, lng: number, geofence: { centerLat: number; centerLng: number; radiusM: number }
): boolean {
  return haversineMeters(lat, lng, geofence.centerLat, geofence.centerLng) <= geofence.radiusM;
}

export interface GeofenceTransition {
  geofenceId: string;
  type: "geofence_enter" | "geofence_exit";
}

/** Compares position before/after a ping against each active geofence and
 * returns the transitions (enter/exit) that occurred, if any. */
export function detectGeofenceTransitions(
  geofences: { id: string; centerLat: number; centerLng: number; radiusM: number }[],
  prev: { latitude: number; longitude: number } | null,
  curr: { latitude: number; longitude: number }
): GeofenceTransition[] {
  const transitions: GeofenceTransition[] = [];
  for (const g of geofences) {
    const wasInside = prev ? isInsideGeofence(prev.latitude, prev.longitude, g) : null;
    const isInside = isInsideGeofence(curr.latitude, curr.longitude, g);
    if (wasInside === isInside) continue; // no change (or no prior position to compare)
    if (wasInside === null) continue; // first-ever ping: don't fire a transition, just establish state
    transitions.push({ geofenceId: g.id, type: isInside ? "geofence_enter" : "geofence_exit" });
  }
  return transitions;
}
