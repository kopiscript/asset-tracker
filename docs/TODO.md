# Atlas v1 — Implementation To-Do

> **Before you start:** Read `CLAUDE.md` in the project root first. It documents breaking changes in Next.js 16, Prisma 7, shadcn/ui, and NextAuth v5 that are not obvious from training data and will save you hours of debugging.

**Last updated:** 2026-05-17  
**PRD:** `docs/PRD.md`  
**Progress:** 9 of 20 tasks complete

---

## How to use this file with Claude

- `[ ]` = not started · `[~]` = in progress · `[x]` = done
- **Session start:** Claude will read this file automatically and tell you what's open. It will ask what you are working on today.
- **Session end:** Say **"session end"** — Claude will mark completed tasks, add notes where implementation diverged from the plan, and update `docs/PRD.md` if any decisions were made.
- Do not mark a task done until it is tested end-to-end.
- If a task diverges from the spec, note it inline beneath the checkbox so the next developer has context.

---

## ⚠️ Decision gate — API key storage (resolve before Phase 2)

The `PATCH /api/vehicles/[id]/location` endpoint must authenticate GPS hardware. Hardware devices cannot hold a browser session, so API key auth is required.

| Option | Approach | Verdict |
|---|---|---|
| A | Single global env var `VEHICLE_API_KEY` | All vehicles share one key — no per-device revocation |
| **B — recommended** | `apiKey String?` field on the `Vehicle` model | Per-vehicle key, set manually via Prisma Studio, no UI needed for v1 |
| C | Separate `ApiKey` table | Overkill for v1 |

**Recommended: Option B.** Add `apiKey String?` to `Vehicle` in the same migration as `LocationHistory`. Hardware sends `Authorization: Bearer <key>`, the endpoint fetches the vehicle by ID and compares `vehicle.apiKey === providedKey`.

> **Security note:** Plaintext storage is acceptable for v1 (manually issued, low volume). Plan to hash with bcrypt before production.

---

## Phase 1 — Database
**Must be done first. Everything else depends on it.**

### What changes in `prisma/schema.prisma`

Add `apiKey` to `Vehicle` and append the new `LocationHistory` model. The `Vehicle` model also needs a relation field.

```prisma
// Inside model Vehicle — add this field:
apiKey     String?

// Add the relation field too:
locationHistory LocationHistory[]
```

```prisma
// New model — add after Vehicle:
model LocationHistory {
  id         String   @id @default(cuid())
  vehicleId  String
  latitude   Float
  longitude  Float
  speed      Float?
  recordedAt DateTime

  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@index([vehicleId, recordedAt])
}
```

> **Prisma 7 reminder:** Do NOT add `url = env(...)` to the datasource block in `schema.prisma`. The URL lives in `prisma.config.ts` only. Adding it to the schema is a hard error.

### Commands

```bash
npm run db:migrate     # name the migration: add_location_history
npm run db:generate    # regenerate Prisma client after schema changes
npm run db:studio      # verify the new table exists + set an apiKey on a vehicle for testing
```

After `db:generate`, the generated client is at `lib/generated/prisma/client.ts`. Import from `@/lib/generated/prisma/client`, not from `@prisma/client`.

### Tasks

- [ ] **1.1** Add `apiKey String?` to `Vehicle` model in `prisma/schema.prisma`
- [x] **1.2** Add `locationHistory LocationHistory[]` relation to `Vehicle`
- [x] **1.3** Add the `LocationHistory` model (with `@@index([vehicleId, recordedAt])`)
  > Added `heading Float?` field (not in original spec) — needed for simulation and useful for IoT hardware that sends bearing.
  > `recordedAt` uses `@default(now())` so the field is optional on insert.
- [x] **1.4** Run `npm run db:migrate` — used `prisma db push` instead (dev only, no named migration file)
  > ⚠️ Before production: run a proper `npm run db:migrate` with migration name `add_location_history` to get a versioned migration file.
- [x] **1.5** Run `npm run db:generate`
- [ ] **1.6** Open `npm run db:studio`, navigate to `Vehicle`, set `apiKey` on at least one row for testing

---

## Phase 2 — IoT endpoint rewrite
**Depends on Phase 1.**

### What currently exists

`app/api/vehicles/[id]/location/route.ts` — already has a comment flagging where API key auth needs to go. Currently uses session auth + `canEdit` permission check, which blocks hardware devices.

The current body only accepts `{ latitude, longitude }`. The rewrite must also accept `speed?` and `recordedAt?`.

### What to change

**Remove** these imports (no longer needed):
```typescript
import { auth } from "@/auth";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canEdit } from "@/lib/permissions";
```

**Replace** the entire `PATCH` handler with this structure:

```typescript
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/location">
) {
  const { id } = await ctx.params;

  // 1. API key auth
  const authHeader = request.headers.get("Authorization");
  const providedKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (!providedKey) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { apiKey: true },
  });
  if (!vehicle || !vehicle.apiKey || vehicle.apiKey !== providedKey) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
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

  const recordedAt =
    typeof body.recordedAt === "string" ? new Date(body.recordedAt) : new Date();
  const speed =
    typeof body.speed === "number" ? body.speed : null;

  // 3. Dual write — atomic
  await prisma.$transaction([
    prisma.vehicle.update({
      where: { id },
      data: {
        latitude: body.latitude,
        longitude: body.longitude,
        lastSeenAt: new Date(),
        status: "active",
      },
    }),
    prisma.locationHistory.create({
      data: {
        vehicleId: id,
        latitude: body.latitude,
        longitude: body.longitude,
        speed,
        recordedAt,
      },
    }),
  ]);

  return Response.json({ data: { ok: true }, error: null });
}
```

> **Note:** `prisma.$transaction([...])` with an array is the sequential form — both writes commit together or neither does.

### How to test

```bash
# Replace <vehicle-id> and <api-key> with values from db:studio
curl -X PATCH http://localhost:3000/api/vehicles/<vehicle-id>/location \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 3.1390, "longitude": 101.6869, "speed": 60}'
```

Expected response: `{"data":{"ok":true},"error":null}`

### Tasks

- [ ] **2.1** Remove session auth imports and logic from `app/api/vehicles/[id]/location/route.ts`
- [ ] **2.2** Add API key validation (fetch vehicle, compare `vehicle.apiKey`)
- [ ] **2.3** Extend body parsing to accept `speed?` and `recordedAt?`
- [ ] **2.4** Wrap dual write in `prisma.$transaction([])`
- [ ] **2.5** Test with curl — confirm `LocationHistory` row appears in Prisma Studio

---

## Phase 3 — Trip history endpoint (new file)
**Depends on Phase 1.**

### Create this file

`app/api/vehicles/[id]/history/route.ts`

### Full implementation

```typescript
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user-sync";
import { canView } from "@/lib/permissions";

const GAP_MS = 10 * 60 * 1000;       // 10 minutes between pings = new trip
const MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BATCH_SIZE = 500;

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/vehicles/[id]/history">
) {
  const { id } = await ctx.params;

  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const dbUser = await getOrCreateDbUser();
  if (!dbUser) return Response.json({ data: null, error: "User not found" }, { status: 404 });

  const allowed = await canView(dbUser.id, id);
  if (!allowed) return Response.json({ data: null, error: "Forbidden" }, { status: 403 });

  // Validate query params
  const { searchParams } = request.nextUrl;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!fromStr || !toStr) {
    return Response.json(
      { data: null, error: "from and to query params are required (ISO 8601)" },
      { status: 400 }
    );
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return Response.json({ data: null, error: "Invalid date format" }, { status: 400 });
  }
  if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
    return Response.json(
      { data: null, error: "Date range cannot exceed 30 days" },
      { status: 400 }
    );
  }

  // Cursor-based fetch + trip segmentation
  type Point = { lat: number; lng: number; speed: number | null; recordedAt: string };
  type Trip = {
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
    points: Point[];
  };

  const trips: Trip[] = [];
  let currentPoints: Point[] = [];
  let lastTime: number | null = null;
  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.locationHistory.findMany({
      where: { vehicleId: id, recordedAt: { gte: from, lte: to } },
      orderBy: { recordedAt: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, latitude: true, longitude: true, speed: true, recordedAt: true },
    });

    for (const ping of batch) {
      const pingTime = ping.recordedAt.getTime();

      if (lastTime !== null && pingTime - lastTime > GAP_MS) {
        // Gap exceeded — close current trip and start a new one
        if (currentPoints.length > 0) {
          trips.push(closeTrip(currentPoints));
        }
        currentPoints = [];
      }

      currentPoints.push({
        lat: ping.latitude,
        lng: ping.longitude,
        speed: ping.speed,
        recordedAt: ping.recordedAt.toISOString(),
      });
      lastTime = pingTime;
    }

    if (batch.length < BATCH_SIZE) break;
    cursor = batch[batch.length - 1].id;
  }

  // Close the last open trip
  if (currentPoints.length > 0) {
    trips.push(closeTrip(currentPoints));
  }

  return Response.json({ data: trips, error: null });
}

function closeTrip(points: { lat: number; lng: number; speed: number | null; recordedAt: string }[]) {
  const startedAt = points[0].recordedAt;
  const endedAt = points[points.length - 1].recordedAt;
  const durationMinutes = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000
  );
  return { startedAt, endedAt, durationMinutes, points };
}
```

### Tasks

- [ ] **3.1** Create `app/api/vehicles/[id]/history/route.ts` with the GET handler above
- [ ] **3.2** Verify param validation: test with missing `from`/`to`, >30 day range
- [ ] **3.3** Verify segmentation: push a few pings to `LocationHistory` directly in Prisma Studio with a 10+ min gap and confirm two trips are returned
- [ ] **3.4** Verify forbidden access: call with a user who has no `VehicleAccess` row — should return 403

---

## Phase 4 — Live map polling + "Last updated" indicator
**Independent — can be done at any time, no dependencies.**

### Context

`app/dashboard/page.tsx` is currently a **server component**. It renders once on load — there is no polling. To add 60-second polling, we need to extract the map area into a `"use client"` component that calls `GET /api/vehicles` on an interval.

### Create this file

`components/dashboard/LiveMap.tsx` — a client component that owns the polling logic.

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { DynamicMap } from "@/components/map/DynamicMap";
import type { MapVehicle } from "@/components/map/VehicleMap";
import { timeAgo } from "@/lib/format";

interface LiveMapProps {
  initialVehicles: MapVehicle[];
  className?: string;
}

export function LiveMap({ initialVehicles, className }: LiveMapProps) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [, forceRender] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (json.data) {
        setVehicles(
          json.data
            .filter((v: MapVehicle) => v.latitude != null && v.longitude != null)
        );
        setLastRefreshed(new Date());
      }
    } catch {
      // keep showing stale data silently
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 60_000);
    // Tick "X ago" label every 10 seconds without re-fetching
    const tick = setInterval(() => forceRender((n) => n + 1), 10_000);
    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
  }, [refresh]);

  return (
    <div className="relative h-full w-full">
      <DynamicMap vehicles={vehicles} className={className} />
      <span className="absolute bottom-2 right-2 z-[1000] text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded-full pointer-events-none">
        Updated {timeAgo(lastRefreshed)}
      </span>
    </div>
  );
}
```

Then in `app/dashboard/page.tsx`, replace:
```tsx
<DynamicMap vehicles={mapVehicles} className="h-full w-full rounded-xl overflow-hidden border border-border/50" />
```
with:
```tsx
<LiveMap initialVehicles={mapVehicles} className="h-full w-full rounded-xl overflow-hidden border border-border/50" />
```
And add the import: `import { LiveMap } from "@/components/dashboard/LiveMap";`

> **Gotcha:** `timeAgo()` is already in `lib/format.ts` — use it, don't write a new one.

> **BM translation:** Add `lastUpdated: { en: "Updated", bm: "Dikemaskini" }` to `lib/translations.ts` if you want the label translated. Check current keys in that file first to avoid duplicates.

### Tasks

- [x] **4.1** Create `components/dashboard/LiveMap.tsx` with polling logic and "Updated Xs ago" label
  > Implemented with simulation tick instead of plain polling. Calls `POST /api/simulate/tick` every 5 s, which advances active vehicles along KL routes, writes to DB, and returns updated positions. Badge shows "Live · just now" with green pulse.
- [x] **4.2** Replace `<DynamicMap>` in `app/dashboard/page.tsx` with `<LiveMap initialVehicles={mapVehicles} />`
- [x] **4.3** Verify `clearInterval` fires on unmount (navigate away from dashboard and back — no console errors)
- [x] **4.4** Confirm label updates without a full page reload

---

## Phase 5 — Trip history UI
**Depends on Phase 3 (GET /history endpoint).**

### Context

`app/dashboard/vehicles/[id]/page.tsx` is a server component. The trip history feature needs client-side state (date picker, expanded trip, API calls). The cleanest approach is:

1. Add a tab switcher to the vehicle detail page
2. The "Vehicle Detail" tab renders the existing content (server-rendered)
3. The "Trip History" tab renders a new `TripHistory` client component

### Step 5a — Extend DynamicMap for polyline support

`components/map/DynamicMap.tsx` and `components/map/VehicleMap.tsx` need a `polyline` prop.

In `DynamicMap.tsx`, add to `DynamicMapProps`:
```typescript
polyline?: { lat: number; lng: number }[];
```
And pass it through: `<VehicleMapNoSSR {...props} />`

In `VehicleMap.tsx`, add to props and render:
```typescript
// Inside the component, after the map is initialised:
useEffect(() => {
  if (!mapRef.current || !polyline || polyline.length === 0) return;
  const line = L.polyline(polyline.map(p => [p.lat, p.lng]), {
    color: "#00c2cc",
    weight: 3,
    opacity: 0.8,
  }).addTo(mapRef.current);
  mapRef.current.fitBounds(line.getBounds(), { padding: [20, 20] });
  return () => { line.remove(); };
}, [polyline]);
```
> See existing marker/map logic in `VehicleMap.tsx` to understand where to place this `useEffect`.

### Step 5b — Create the TripHistory client component

**File:** `components/dashboard/TripHistory.tsx`

Key responsibilities:
- Date range picker (`from` / `to` inputs, default to today, max 30-day range enforced on client)
- Calls `GET /api/vehicles/[vehicleId]/history?from=...&to=...` on submit
- Renders a collapsible list of trips
- One trip expanded at a time; expanding renders its polyline on the `DynamicMap`

```typescript
"use client";
// Rough structure — fill in UI details with shadcn/ui components

import { useState } from "react";
import { DynamicMap } from "@/components/map/DynamicMap";

interface Point { lat: number; lng: number; speed: number | null; recordedAt: string }
interface Trip { startedAt: string; endedAt: string; durationMinutes: number; points: Point[] }

export function TripHistory({ vehicleId }: { vehicleId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  async function fetchTrips() {
    setLoading(true);
    setError(null);
    setExpandedIndex(null);
    const res = await fetch(
      `/api/vehicles/${vehicleId}/history?from=${from}T00:00:00Z&to=${to}T23:59:59Z`
    );
    const json = await res.json();
    if (json.error) {
      setError(json.error);
      setTrips([]);
    } else {
      setTrips(json.data);
    }
    setLoading(false);
  }

  const activePolyline =
    expandedIndex !== null
      ? trips[expandedIndex].points.map(p => ({ lat: p.lat, lng: p.lng }))
      : undefined;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left: controls + trip list */}
      <div className="flex-1 space-y-4">
        {/* Date range picker */}
        {/* ... use <input type="date"> or shadcn Calendar + Popover */}
        {/* Submit button calls fetchTrips() */}

        {/* Trip list */}
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}
        {trips.length === 0 && !loading && <p className="text-muted-foreground">No trips found.</p>}
        {trips.map((trip, i) => (
          <div key={i} onClick={() => setExpandedIndex(i === expandedIndex ? null : i)}>
            {/* Trip N — HH:MM to HH:MM (X min) */}
            {/* Expand/collapse */}
          </div>
        ))}
      </div>

      {/* Right (desktop) or below (mobile): map */}
      {activePolyline && (
        <div className="h-64 lg:h-auto lg:flex-1">
          <DynamicMap vehicles={[]} polyline={activePolyline} className="h-full w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
```

### Step 5c — Add tabs to the vehicle detail page

In `app/dashboard/vehicles/[id]/page.tsx`, add a tab switcher above the map. Use shadcn/ui `Tabs` if available, or a simple button-based tab pattern.

The "Vehicle Detail" tab shows the existing map + info cards. The "Trip History" tab renders `<TripHistory vehicleId={id} />`.

> Because the vehicle detail page is a server component, the tab switcher must be a `"use client"` wrapper component, or you can convert the whole page to a client component (simpler but fetches happen client-side). For v1, converting to a client component that fetches vehicle data via `GET /api/vehicles/[id]` is acceptable.

### Tasks

- [ ] **5.1** Add `polyline?: { lat: number; lng: number }[]` prop to `DynamicMap` and `VehicleMap`, render with Leaflet `L.polyline`
- [ ] **5.2** Create `components/dashboard/TripHistory.tsx` — date picker, fetch, trip list, polyline display
- [ ] **5.3** Add "Trip History" tab to `app/dashboard/vehicles/[id]/page.tsx`
- [ ] **5.4** Desktop layout: trip list left, map right (use `flex-row` at `lg:` breakpoint)
- [ ] **5.5** Mobile layout: stacked — date picker → trip list → map appears below when trip is expanded
- [ ] **5.6** Enforce 30-day max date range on the client with a clear error message
- [ ] **5.7** Empty state: "No trips found for this date range" in both EN and BM
- [ ] **5.8** Test with real data: push several pings via the PATCH endpoint with deliberate 10+ min gaps, confirm they segment correctly in the UI

---

## Phase 6 — Translations + polish
**Can be done alongside Phase 5.**

- [ ] **6.1** Add BM strings to `lib/translations.ts` for all new UI text:
  - "Trip History" tab label
  - "Updated X ago" / "Last updated"
  - Date picker labels (From, To, Search)
  - Trip summary format ("Trip N — HH:MM to HH:MM (X min)")
  - Empty state message
  - Loading / error messages
- [ ] **6.2** Check existing keys in `lib/translations.ts` before adding — do not duplicate
- [ ] **6.3** Update `README.md` — document the new API endpoints and new env behaviour (apiKey set via Studio for v1)
- [ ] **6.4** Update `docs/PRD.md` if any implementation detail diverged from the spec

---

## Phase 0 — Dev environment / seed data (done)
*Not in original plan — completed to support demo and development.*

- [x] **0.1** Replace generic seed data with 13 Malaysian vehicles concentrated in KL (W/B-prefix plates, Proton/Perodua/Toyota/Honda models, real KL neighbourhood coordinates)
- [x] **0.2** Add `lib/simulation-routes.ts` — deterministic looping GPS routes for 6 active KL vehicles (KLCC, Bukit Bintang, Bangsar, Mont Kiara, Cheras, Subang Jaya)
- [x] **0.3** Seed 3 hours of `LocationHistory` at 30-second intervals per active vehicle (2,166 total pings) using `$executeRawUnsafe` bulk inserts
- [x] **0.4** Create `POST /api/simulate/tick` — advances all routed vehicles along their routes (time-based, stateless), updates `Vehicle.lat/lng`, appends `LocationHistory` row per vehicle
- [x] **0.5** Switch `prisma.config.ts` `migrations.seed` to `tsx ./prisma/seed.ts` (was not wired up)
- [x] **0.6** Fix `PrismaNeonHttp` constructor — must pass `{}` as second argument (`new PrismaNeonHttp(url, {})`)
  > ⚠️ **Before production:** Replace simulation seed data with real GPS data. Remove or gate the `POST /api/simulate/tick` endpoint (it should not run in production). Run a proper `db:migrate` instead of `db push`.

---

## Dependency map

```
Phase 1 — Schema + migration
  ├── Phase 2 — PATCH /location (IoT endpoint)
  └── Phase 3 — GET /history endpoint
        └── Phase 5 — Trip History UI

Phase 4 — Live map polling   ← independent, do any time
Phase 6 — Translations       ← alongside Phase 5
```

---

## Quick reference

| What | Where |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Prisma config (CLI) | `prisma.config.ts` |
| Prisma client (runtime) | `lib/prisma.ts` |
| Generated client import | `@/lib/generated/prisma/client` |
| Permissions | `lib/permissions.ts` — `canView`, `canEdit`, `canShare`, `canDelete` |
| Translations | `lib/translations.ts` — `en` and `bm` keys |
| Date/number utils | `lib/format.ts` — `timeAgo()`, `formatNumber()`, `clamp()` |
| Map (always use DynamicMap) | `components/map/DynamicMap.tsx` |
| IoT endpoint | `app/api/vehicles/[id]/location/route.ts` |
| History endpoint (new) | `app/api/vehicles/[id]/history/route.ts` |
| Live map component (new) | `components/dashboard/LiveMap.tsx` |
| Trip history component (new) | `components/dashboard/TripHistory.tsx` |
| API shape | Always `{ data: ..., error: null }` or `{ data: null, error: "msg" }` |
