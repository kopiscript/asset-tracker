/**
 * lib/simulation-routes.ts
 * Pre-defined looping GPS routes for seeded vehicles.
 * Used by both the seed script (historical pings) and the simulate/tick endpoint (live movement).
 *
 * Routes are arrays of [lat, lng] waypoints that form a closed loop around real KL streets.
 * Vehicles traverse the loop continuously; position is derived from (currentTime % loopMs).
 */

export type RouteWaypoint = [number, number]; // [lat, lng]

export interface SimRoute {
  waypoints: RouteWaypoint[];
  loopMinutes: number; // total time to complete one loop
  speedKph: number;    // approximate city speed
}

// Keyed by the vehicle seed ID from prisma/seed.ts
export const SIMULATION_ROUTES: Record<string, SimRoute> = {
  // ─── Active KL vehicles ──────────────────────────────────────────────────

  "seed-wxb3821": {  // KL Delivery Van 01 — KLCC / Jalan Ampang loop
    loopMinutes: 18,
    speedKph: 35,
    waypoints: [
      [3.1579, 101.7133], // KLCC / Suria KLCC entrance
      [3.1600, 101.7160],
      [3.1635, 101.7200], // Jalan Ampang north
      [3.1665, 101.7240],
      [3.1680, 101.7270], // Jln Tun Razak junction
      [3.1660, 101.7295],
      [3.1630, 101.7290],
      [3.1600, 101.7270],
      [3.1570, 101.7255], // Jln Tun Razak south
      [3.1530, 101.7230],
      [3.1500, 101.7210],
      [3.1480, 101.7190], // Jln Imbi / Pudu fringe
      [3.1460, 101.7165],
      [3.1465, 101.7140],
      [3.1480, 101.7120],
      [3.1510, 101.7115], // back towards KLCC
      [3.1540, 101.7120],
      [3.1560, 101.7128],
    ],
  },

  "seed-wkk5512": {  // Proton X70 Exec — Bukit Bintang / Pavilion KL loop
    loopMinutes: 14,
    speedKph: 30,
    waypoints: [
      [3.1460, 101.7109], // Pavilion KL
      [3.1480, 101.7085],
      [3.1505, 101.7065], // Jln Sultan Ismail
      [3.1525, 101.7045],
      [3.1520, 101.7020],
      [3.1500, 101.7005],
      [3.1475, 101.7015],
      [3.1455, 101.7040],
      [3.1445, 101.7070],
      [3.1450, 101.7095],
    ],
  },

  "seed-wbc1190": {  // Perodua Myvi Sales — Bangsar / Abdullah Hukum loop
    loopMinutes: 16,
    speedKph: 40,
    waypoints: [
      [3.1310, 101.6841], // Bangsar Shopping Centre
      [3.1335, 101.6865],
      [3.1355, 101.6890],
      [3.1380, 101.6885],
      [3.1400, 101.6860],
      [3.1390, 101.6825],
      [3.1370, 101.6800],
      [3.1345, 101.6795],
      [3.1315, 101.6810],
      [3.1295, 101.6830],
      [3.1300, 101.6855],
    ],
  },

  "seed-wja7734": {  // Toyota Hiace Shuttle — Mont Kiara / Sri Hartamas loop
    loopMinutes: 20,
    speedKph: 45,
    waypoints: [
      [3.1718, 101.6602], // Mont Kiara 1 Utama area
      [3.1745, 101.6580],
      [3.1775, 101.6565],
      [3.1805, 101.6585],
      [3.1825, 101.6620],
      [3.1820, 101.6660],
      [3.1800, 101.6700],
      [3.1775, 101.6730],
      [3.1745, 101.6730],
      [3.1715, 101.6715],
      [3.1700, 101.6685],
      [3.1705, 101.6650],
    ],
  },

  "seed-wga2208": {  // Ford Ranger Site Crew — Cheras / Connaught loop
    loopMinutes: 22,
    speedKph: 40,
    waypoints: [
      [3.0921, 101.7497], // Taman Connaught
      [3.0945, 101.7520],
      [3.0975, 101.7540],
      [3.1005, 101.7535],
      [3.1030, 101.7510],
      [3.1025, 101.7480],
      [3.0998, 101.7460],
      [3.0968, 101.7455],
      [3.0940, 101.7468],
      [3.0922, 101.7485],
    ],
  },

  "seed-bpj1188": {  // Perodua Bezza — Subang Jaya / SS15 loop
    loopMinutes: 15,
    speedKph: 40,
    waypoints: [
      [3.0565, 101.5874], // Subang Jaya SS15
      [3.0588, 101.5900],
      [3.0610, 101.5928],
      [3.0622, 101.5958],
      [3.0608, 101.5982],
      [3.0582, 101.5978],
      [3.0558, 101.5958],
      [3.0540, 101.5930],
      [3.0535, 101.5902],
      [3.0550, 101.5880],
    ],
  },
};

// ─── Interpolation helpers ──────────────────────────────────────────────────

/** Total distance of a route in degrees (rough approximation). */
function routeLength(waypoints: RouteWaypoint[]): number {
  let total = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const a = waypoints[i];
    const b = waypoints[(i + 1) % waypoints.length];
    const dLat = b[0] - a[0];
    const dLng = b[1] - a[1];
    total += Math.sqrt(dLat * dLat + dLng * dLng);
  }
  return total;
}

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  heading: number; // degrees, 0 = north
  speed: number;   // km/h
}

/**
 * Computes where a vehicle is on its route at a given moment.
 * Deterministic: same timestamp → same position (no state needed).
 *
 * @param route   The route definition
 * @param atMs    Unix timestamp in milliseconds (defaults to now)
 * @param phaseMs Offset so vehicles don't all start at the same waypoint
 */
export function computePosition(
  route: SimRoute,
  atMs: number = Date.now(),
  phaseMs = 0
): VehiclePosition {
  const loopMs = route.loopMinutes * 60 * 1000;
  const elapsed = ((atMs + phaseMs) % loopMs + loopMs) % loopMs;
  const progress = elapsed / loopMs; // 0..1 along the full loop

  const wp = route.waypoints;
  const n = wp.length;

  // Distribute progress uniformly across segments (equal time per segment)
  const scaled = progress * n;
  const segIdx = Math.floor(scaled) % n;
  const t = scaled - Math.floor(scaled); // 0..1 within segment

  const from = wp[segIdx];
  const to = wp[(segIdx + 1) % n];

  const latitude = from[0] + (to[0] - from[0]) * t;
  const longitude = from[1] + (to[1] - from[1]) * t;

  // Heading: angle from north (atan2 with lat/lng swapped for geographic convention)
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

  return { latitude, longitude, heading, speed: route.speedKph };
}

/** Phase offsets so each vehicle starts at a different point in its loop. */
export const VEHICLE_PHASE_MS: Record<string, number> = {
  "seed-wxb3821": 0,
  "seed-wkk5512": 3 * 60 * 1000,
  "seed-wbc1190": 6 * 60 * 1000,
  "seed-wja7734": 9 * 60 * 1000,
  "seed-wga2208": 12 * 60 * 1000,
  "seed-bpj1188": 2 * 60 * 1000,
};
