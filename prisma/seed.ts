/**
 * prisma/seed.ts
 * Seeds the database with sample data for development and testing.
 *
 * Run with: npm run db:seed
 *
 * ✏️ EDIT: Change DEMO_EMAIL / DEMO_PASSWORD below to your preferred dev credentials.
 */
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { SIMULATION_ROUTES, VEHICLE_PHASE_MS, computePosition } from "../lib/simulation-routes";
import { randomUUID } from "crypto";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@fleettrack.my"; // ✏️ EDIT: your dev email
const DEMO_PASSWORD = "fleettrack123";   // ✏️ EDIT: your dev password

// KL and surrounding area coordinates (lat, lng)
const KL_LOCATIONS = {
  klcc:           { lat: 3.1579,  lng: 101.7133 }, // KLCC / Twin Towers area
  bukitBintang:   { lat: 3.1460,  lng: 101.7109 }, // Bukit Bintang
  bangsar:        { lat: 3.1310,  lng: 101.6841 }, // Bangsar
  montKiara:      { lat: 3.1718,  lng: 101.6602 }, // Mont Kiara
  chowKit:        { lat: 3.1715,  lng: 101.6979 }, // Chow Kit
  kepong:         { lat: 3.2108,  lng: 101.6374 }, // Kepong
  wangsa:         { lat: 3.2010,  lng: 101.7438 }, // Wangsa Maju
  ampang:         { lat: 3.1545,  lng: 101.7675 }, // Ampang
  cheras:         { lat: 3.0921,  lng: 101.7497 }, // Cheras
  bukitJalil:     { lat: 3.0534,  lng: 101.6928 }, // Bukit Jalil
  petalingJaya:   { lat: 3.1073,  lng: 101.6067 }, // PJ
  subangJaya:     { lat: 3.0565,  lng: 101.5874 }, // Subang Jaya
  damansara:      { lat: 3.1508,  lng: 101.6266 }, // Damansara
  pudu:           { lat: 3.1390,  lng: 101.7087 }, // Pudu / Imbi
};

// Slightly outside KL for variety
const OUTSIDE_KL = {
  penang:         { lat: 5.4145,  lng: 100.3292 }, // Georgetown, Penang
  johorBahru:     { lat: 1.4927,  lng: 103.7414 }, // JB
};

type VehicleSeed = {
  id: string;
  name: string;
  plateNumber: string;
  type: string;
  status: string;
  fuelLevel: number;
  mileage: number;
  driverName: string | null;
  notes: string | null;
  latitude: number;
  longitude: number;
  lastSeenAt: Date;
};

const now = Date.now();
const mins = (n: number) => new Date(now - n * 60 * 1000);
const hrs  = (n: number) => new Date(now - n * 60 * 60 * 1000);
const days = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

const vehiclesData: VehicleSeed[] = [
  // ── KL active vehicles ────────────────────────────────────────
  {
    id:          "seed-wxb3821",
    name:        "KL Delivery Van 01",
    plateNumber: "WXB 3821",
    type:        "Van",
    status:      "active",
    fuelLevel:   74,
    mileage:     48230,
    driverName:  "Ahmad Faizal bin Hassan",
    notes:       "Klang Valley deliveries. Service due in 2,000 km.",
    latitude:    KL_LOCATIONS.klcc.lat,
    longitude:   KL_LOCATIONS.klcc.lng,
    lastSeenAt:  mins(4),
  },
  {
    id:          "seed-wkk5512",
    name:        "Proton X70 – Exec Fleet",
    plateNumber: "WKK 5512",
    type:        "Car",
    status:      "active",
    fuelLevel:   61,
    mileage:     22100,
    driverName:  "Nurul Ain binti Rozali",
    notes:       "Executive pool car. Requires manager approval to book.",
    latitude:    KL_LOCATIONS.bukitBintang.lat,
    longitude:   KL_LOCATIONS.bukitBintang.lng,
    lastSeenAt:  mins(8),
  },
  {
    id:          "seed-wbc1190",
    name:        "Perodua Myvi – Sales Team A",
    plateNumber: "WBC 1190",
    type:        "Car",
    status:      "active",
    fuelLevel:   52,
    mileage:     35760,
    driverName:  "Tan Wei Liang",
    notes:       "Sales rep vehicle. Weekly mileage report required.",
    latitude:    KL_LOCATIONS.bangsar.lat,
    longitude:   KL_LOCATIONS.bangsar.lng,
    lastSeenAt:  mins(12),
  },
  {
    id:          "seed-wja7734",
    name:        "Toyota Hiace – Shuttle 01",
    plateNumber: "WJA 7734",
    type:        "Van",
    status:      "active",
    fuelLevel:   83,
    mileage:     91400,
    driverName:  "Ravindran a/l Subramaniam",
    notes:       "Staff shuttle, Bangsar South ↔ KLCC corridor.",
    latitude:    KL_LOCATIONS.montKiara.lat,
    longitude:   KL_LOCATIONS.montKiara.lng,
    lastSeenAt:  mins(3),
  },
  {
    id:          "seed-wga2208",
    name:        "Ford Ranger – Site Crew",
    plateNumber: "WGA 2208",
    type:        "Truck",
    status:      "active",
    fuelLevel:   47,
    mileage:     67300,
    driverName:  "Mohd Zulfiqri bin Samat",
    notes:       "Construction site logistics. Heavy load rated.",
    latitude:    KL_LOCATIONS.cheras.lat,
    longitude:   KL_LOCATIONS.cheras.lng,
    lastSeenAt:  mins(7),
  },

  // ── KL idle vehicles ──────────────────────────────────────────
  {
    id:          "seed-wdb8843",
    name:        "Perodua Axia – Admin Pool",
    plateNumber: "WDB 8843",
    type:        "Car",
    status:      "idle",
    fuelLevel:   39,
    mileage:     19850,
    driverName:  null,
    notes:       "Available for booking. Park Bay B-12.",
    latitude:    KL_LOCATIONS.kepong.lat,
    longitude:   KL_LOCATIONS.kepong.lng,
    lastSeenAt:  mins(55),
  },
  {
    id:          "seed-wec4471",
    name:        "Honda HR-V – Sales Team B",
    plateNumber: "WEC 4471",
    type:        "Car",
    status:      "idle",
    fuelLevel:   66,
    mileage:     28900,
    driverName:  "Chong Mei Ling",
    notes:       "Driver at lunch break. Parked Ampang Point.",
    latitude:    KL_LOCATIONS.ampang.lat,
    longitude:   KL_LOCATIONS.ampang.lng,
    lastSeenAt:  mins(38),
  },
  {
    id:          "seed-wfd9901",
    name:        "Mitsubishi Triton – Maintenance",
    plateNumber: "WFD 9901",
    type:        "Truck",
    status:      "idle",
    fuelLevel:   55,
    mileage:     103200,
    driverName:  "Zainal Abidin bin Othman",
    notes:       "Maintenance crew. Back at depot by 5 pm.",
    latitude:    KL_LOCATIONS.wangsa.lat,
    longitude:   KL_LOCATIONS.wangsa.lng,
    lastSeenAt:  mins(22),
  },
  {
    id:          "seed-wma3356",
    name:        "Proton Persona – Finance Dept",
    plateNumber: "WMA 3356",
    type:        "Car",
    status:      "idle",
    fuelLevel:   29,
    mileage:     44100,
    driverName:  "Siti Norzahra binti Kamal",
    notes:       "Low fuel — top up before next dispatch.",
    latitude:    KL_LOCATIONS.damansara.lat,
    longitude:   KL_LOCATIONS.damansara.lng,
    lastSeenAt:  hrs(1),
  },

  // ── Selangor / suburban KL ────────────────────────────────────
  {
    id:          "seed-bsk6627",
    name:        "Toyota Vios – PJ Hub",
    plateNumber: "BSK 6627",
    type:        "Car",
    status:      "idle",
    fuelLevel:   71,
    mileage:     31500,
    driverName:  "Lee Kok Wai",
    notes:       "Petaling Jaya operations. Key in management office.",
    latitude:    KL_LOCATIONS.petalingJaya.lat,
    longitude:   KL_LOCATIONS.petalingJaya.lng,
    lastSeenAt:  hrs(2),
  },
  {
    id:          "seed-bpj1188",
    name:        "Perodua Bezza – Subang Ops",
    plateNumber: "BPJ 1188",
    type:        "Car",
    status:      "active",
    fuelLevel:   88,
    mileage:     11200,
    driverName:  "Priya a/p Krishnamurthy",
    notes:       "Subang Jaya area. Recently purchased, first service at 15,000 km.",
    latitude:    KL_LOCATIONS.subangJaya.lat,
    longitude:   KL_LOCATIONS.subangJaya.lng,
    lastSeenAt:  mins(18),
  },

  // ── Offline / out-of-region vehicles ─────────────────────────
  {
    id:          "seed-pdq5678",
    name:        "Penang Lorry – North Hub",
    plateNumber: "PDQ 5678",
    type:        "Truck",
    status:      "offline",
    fuelLevel:   44,
    mileage:     98750,
    driverName:  "Lim Boon Keong",
    notes:       "Heavy goods vehicle. Stationed in Penang depot.",
    latitude:    OUTSIDE_KL.penang.lat,
    longitude:   OUTSIDE_KL.penang.lng,
    lastSeenAt:  days(1),
  },
  {
    id:          "seed-jhh9012",
    name:        "JB Company Car – South Hub",
    plateNumber: "JHH 9012",
    type:        "Car",
    status:      "offline",
    fuelLevel:   14,
    mileage:     67890,
    driverName:  null,
    notes:       "Critically low fuel. Do not dispatch until refuelled. Battery also weak.",
    latitude:    OUTSIDE_KL.johorBahru.lat,
    longitude:   OUTSIDE_KL.johorBahru.lng,
    lastSeenAt:  days(3),
  },
];

async function upsertUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({ data: { email, name, password } });
}

async function upsertVehicle(v: VehicleSeed, ownerId: string) {
  const existing = await prisma.vehicle.findUnique({ where: { id: v.id } });
  if (existing) {
    return prisma.vehicle.update({
      where: { id: v.id },
      data:  { status: v.status, fuelLevel: v.fuelLevel, latitude: v.latitude, longitude: v.longitude, lastSeenAt: v.lastSeenAt },
    });
  }
  return prisma.vehicle.create({
    data: {
      id:          v.id,
      name:        v.name,
      plateNumber: v.plateNumber,
      type:        v.type,
      status:      v.status,
      fuelLevel:   v.fuelLevel,
      mileage:     v.mileage,
      driverName:  v.driverName,
      notes:       v.notes,
      latitude:    v.latitude,
      longitude:   v.longitude,
      lastSeenAt:  v.lastSeenAt,
      ownerId,
    },
  });
}

async function upsertAccess(vehicleId: string, userId: string) {
  const existing = await prisma.vehicleAccess.findUnique({
    where: { vehicleId_userId: { vehicleId, userId } },
  });
  if (!existing) {
    await prisma.vehicleAccess.create({ data: { vehicleId, userId, role: "owner" } });
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await upsertUser(DEMO_EMAIL, "Fleet Admin", hashedPassword);

  console.log(`✅ User: ${user.email} (password: ${DEMO_PASSWORD})`);

  for (const v of vehiclesData) {
    const vehicle = await upsertVehicle(v, user.id);
    await upsertAccess(vehicle.id, user.id);

    const pin = v.status === "active" ? "🟢" : v.status === "idle" ? "🟡" : "🔴";
    console.log(`${pin} ${vehicle.name} (${vehicle.plateNumber})`);
  }

  // ── Location history ───────────────────────────────────────────────────
  // Generate 3 hours of GPS pings at 30-second intervals for routed vehicles.
  // Uses the same deterministic position function as the live simulation.
  console.log("\n📍 Seeding location history...");

  const INTERVAL_S = 30;          // ping every 30 seconds
  const HISTORY_HOURS = 3;        // go back 3 hours
  const totalPings = (HISTORY_HOURS * 3600) / INTERVAL_S; // 360 pings per vehicle
  const nowMs = Date.now();

  for (const [vehicleId, route] of Object.entries(SIMULATION_ROUTES)) {
    // Skip if already seeded (idempotent)
    const existing = await prisma.locationHistory.findFirst({ where: { vehicleId } });
    if (existing) {
      console.log(`   ⏭  ${vehicleId}: already has history, skipping`);
      continue;
    }

    const phaseMs = VEHICLE_PHASE_MS[vehicleId] ?? 0;
    const pings: { id: string; vehicleId: string; latitude: number; longitude: number; speed: number; heading: number; recordedAt: Date }[] = [];

    for (let i = totalPings; i >= 0; i--) {
      const atMs = nowMs - i * INTERVAL_S * 1000;
      const pos = computePosition(route, atMs, phaseMs);
      pings.push({
        id: randomUUID(),
        vehicleId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        heading: pos.heading,
        recordedAt: new Date(atMs),
      });
    }

    // Bulk-insert using raw SQL (no transaction needed) in chunks of 100 rows
    const CHUNK = 100;
    for (let i = 0; i < pings.length; i += CHUNK) {
      const chunk = pings.slice(i, i + CHUNK);
      // Build parameterised query: ($1,$2,...), ($7,$8,...), ...
      const placeholders = chunk.map((_, j) => {
        const b = j * 7;
        return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7})`;
      }).join(",");
      const params = chunk.flatMap(p => [p.id, p.vehicleId, p.latitude, p.longitude, p.speed, p.heading, p.recordedAt]);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "LocationHistory" (id,"vehicleId",latitude,longitude,speed,heading,"recordedAt") VALUES ${placeholders}`,
        ...params
      );
    }
    console.log(`   📍 ${vehicleId}: ${pings.length} pings inserted`);
  }

  console.log(`\n✅ Seed complete — ${vehiclesData.length} vehicles created.`);
  console.log(`\n🔑 Sign in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
