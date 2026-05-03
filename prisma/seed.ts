/**
 * prisma/seed.ts
 * Seeds the database with sample data for development and testing.
 *
 * Run with: npx prisma db seed
 *
 * ✏️ EDIT: Change DEMO_CLERK_ID below to your real Clerk user ID so the
 *          demo vehicles are linked to your account.
 *          Find your Clerk user ID in: Clerk Dashboard → Users → click your user → User ID
 */
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ✏️ EDIT: Replace with your real Clerk user ID to see the demo vehicles
const DEMO_CLERK_ID = "user_REPLACE_WITH_YOUR_CLERK_ID";
const DEMO_EMAIL = "demo@fleettrack.my"; // ✏️ EDIT: Replace with your real email

async function main() {
  console.log("🌱 Seeding database...");

  // Create (or find) the demo user
  const user = await prisma.user.upsert({
    where: { clerkId: DEMO_CLERK_ID },
    update: {},
    create: {
      clerkId: DEMO_CLERK_ID,
      email: DEMO_EMAIL,
      name: "Fleet Admin", // ✏️ EDIT: Your name
    },
  });

  console.log(`✅ User: ${user.email}`);

  // 5 realistic Malaysian vehicles with locations spread around Malaysia
  const vehiclesData = [
    {
      name: "KL Delivery Van 01",
      plateNumber: "WXY 1234",
      type: "Van",
      status: "active",
      fuelLevel: 72,
      mileage: 45230,
      driverName: "Ahmad Faizal bin Hassan",
      notes: "Used for Klang Valley deliveries. Oil change due next month.",
      latitude: 3.1569, // Kuala Lumpur city centre
      longitude: 101.7123,
      lastSeenAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      name: "Penang Lorry 02",
      plateNumber: "PDQ 5678",
      type: "Truck",
      status: "idle",
      fuelLevel: 45,
      mileage: 98750,
      driverName: "Lim Boon Keong",
      notes: "Heavy goods vehicle. Requires CDL driver.",
      latitude: 5.4145, // Georgetown, Penang
      longitude: 100.3292,
      lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      name: "JB Company Car 03",
      plateNumber: "JHH 9012",
      type: "Car",
      status: "offline",
      fuelLevel: 15,
      mileage: 67890,
      driverName: null,
      notes: "Fuel level critically low. Do not dispatch until refuelled.",
      latitude: 1.4927, // Johor Bahru
      longitude: 103.7414,
      lastSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      name: "Kuching Van 04",
      plateNumber: "QBD 3456",
      type: "Van",
      status: "active",
      fuelLevel: 88,
      mileage: 23100,
      driverName: "Mohd Zulfiqri bin Samat",
      notes: "East Malaysia operations. Recently serviced.",
      latitude: 1.5535, // Kuching, Sarawak
      longitude: 110.3593,
      lastSeenAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
    {
      name: "KK Motorcycle 05",
      plateNumber: "SAA 7890",
      type: "Motorcycle",
      status: "idle",
      fuelLevel: 60,
      mileage: 12450,
      driverName: "Jeffery Gunting",
      notes: "Used for last-mile delivery in Kota Kinabalu area.",
      latitude: 5.9804, // Kota Kinabalu, Sabah
      longitude: 116.0735,
      lastSeenAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    },
  ];

  for (const v of vehiclesData) {
    // Create vehicle
    const vehicle = await prisma.vehicle.upsert({
      where: { id: `seed-${v.plateNumber.replace(/\s/g, "").toLowerCase()}` },
      update: {
        status: v.status,
        lastSeenAt: v.lastSeenAt,
      },
      create: {
        id: `seed-${v.plateNumber.replace(/\s/g, "").toLowerCase()}`,
        name: v.name,
        plateNumber: v.plateNumber,
        type: v.type,
        status: v.status,
        fuelLevel: v.fuelLevel,
        mileage: v.mileage,
        driverName: v.driverName,
        notes: v.notes,
        latitude: v.latitude,
        longitude: v.longitude,
        lastSeenAt: v.lastSeenAt,
        ownerId: user.id,
      },
    });

    // Grant the demo user owner access
    await prisma.vehicleAccess.upsert({
      where: {
        vehicleId_userId: { vehicleId: vehicle.id, userId: user.id },
      },
      update: {},
      create: {
        vehicleId: vehicle.id,
        userId: user.id,
        role: "owner",
      },
    });

    console.log(`✅ Vehicle: ${vehicle.name} (${vehicle.plateNumber})`);
  }

  console.log("\n✅ Seed complete! 5 vehicles created.");
  console.log(
    `\n⚠️  Remember to set DEMO_CLERK_ID in prisma/seed.ts to your real Clerk user ID!`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
