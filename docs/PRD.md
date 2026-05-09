# Atlas — Product Requirements Document

**Version:** 1.0  
**Audience:** Developers  
**Status:** Validated  
**Last updated:** 2026-05-10

---

## 1. Overview

Atlas is a web-based vehicle asset tracking platform. It receives GPS location data from hardware already installed in client vehicles, stores it, and presents it through a live map and trip history interface.

Atlas is mobile-friendly (responsive web, not a native app).

---

## 2. Problem Statement

The client operates a vehicle fleet with GPS hardware installed. They have no software layer to receive, store, or visualise that data. Atlas fills that gap.

---

## 3. Users

| User | Description | Status |
|---|---|---|
| Fleet manager / operations | Primary day-to-day user — monitors all vehicles | To be confirmed with client |
| Team members | May have viewer or editor access to specific vehicles | To be confirmed with client |
| GPS hardware | IoT device pushing location pings via API key | Technical user — not human |

> **Open:** Exact user roles and org structure to be confirmed with client before v2 planning.

---

## 4. V1 Scope

### In scope
- Live map showing current position of all vehicles (refreshes every 60 seconds)
- Trip history — view past routes for a vehicle by date range
- Vehicle management (create, edit, delete)
- Role-based access control (viewer / editor / owner)
- Share vehicles with other users by email
- Responsive UI (mobile + desktop)

### Out of scope (future phases)
- Alerts and notifications (speeding, geofencing, engine off)
- Fleet health reporting (fuel trends, maintenance schedules)
- Driver mobile app
- GPS hardware provisioning or device management
- Multi-tenancy organisation management UI
- API key management UI (keys issued manually for v1)

---

## 5. Data Model

### Existing models (unchanged)
- `User` — email + bcrypt password, name
- `Vehicle` — name, plate, type, status, fuel, mileage, driver, lat/lng, lastSeenAt, ownerId
- `VehicleAccess` — junction table: vehicleId + userId + role (viewer / editor / owner)

### New: LocationHistory

```prisma
model LocationHistory {
  id         String   @id @default(cuid())
  vehicleId  String
  latitude   Float
  longitude  Float
  speed      Float?   // km/h — optional, hardware-dependent
  recordedAt DateTime // hardware clock time, not server receive time

  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  @@index([vehicleId, recordedAt])
}
```

**Design notes:**
- `recordedAt` uses hardware time so trip reconstruction is accurate even when pings arrive late or out of order
- `speed` is nullable — stored now to avoid a future migration, even if hardware doesn't send it yet
- Index on `[vehicleId, recordedAt]` matches the exact query pattern for trip history
- Cascade delete — removing a vehicle removes all its history
- `Vehicle` gains a `locationHistory LocationHistory[]` relation

### Multi-tenancy path
The current `ownerId` + `VehicleAccess` model supports single-tenant. Adding multi-tenancy later requires one additive migration: an `Organization` model with `organizationId` on `Vehicle` and an `OrganizationMember` table. No structural rework needed.

---

## 6. API Design

### Modified endpoint

```
PATCH /api/vehicles/[id]/location
Auth: API key (hardware) — NOT session auth
Body: { latitude, longitude, speed?, recordedAt? }
```

**Behaviour:**
- Authenticates via API key in `Authorization` header (`Bearer <key>`) — hardware cannot hold a browser session
- Writes to `Vehicle` (updates lat, lng, lastSeenAt, status → "active") AND `LocationHistory` (appends row) inside a single `prisma.$transaction()` — atomicity guaranteed
- `recordedAt` defaults to `new Date()` if not provided by hardware

### New endpoint

```
GET /api/vehicles/[id]/history?from=ISO8601&to=ISO8601
Auth: Session (canView permission required)
```

**Behaviour:**
- `from` and `to` are required — no unbounded queries
- Max window: 30 days
- Returns pings from `LocationHistory` grouped into **trips** — a trip is a contiguous sequence of pings with no gap exceeding 10 minutes
- Segmentation uses a **cursor-based approach** — pings are streamed and grouped incrementally, not loaded fully into memory
- Response shape:

```json
{
  "data": [
    {
      "startedAt": "2026-05-10T08:00:00Z",
      "endedAt": "2026-05-10T09:14:00Z",
      "durationMinutes": 74,
      "points": [
        { "lat": 3.1234, "lng": 101.5678, "speed": 60, "recordedAt": "..." }
      ]
    }
  ],
  "error": null
}
```

### Existing endpoints (unchanged)
- `GET /api/vehicles` — list vehicles (with userRole)
- `POST /api/vehicles` — create vehicle
- `GET /api/vehicles/[id]` — get vehicle
- `PATCH /api/vehicles/[id]` — update vehicle fields
- `DELETE /api/vehicles/[id]` — delete vehicle
- `GET/POST /api/vehicles/[id]/share` — manage access
- `DELETE /api/vehicles/[id]/share/[userId]` — remove access

---

## 7. UI Design

### Live Map (dashboard — existing, one change)

- Map renders all vehicle markers using last known position from `Vehicle`
- Client polls `GET /api/vehicles` every 60 seconds and re-renders markers
- Adds a **"Last updated Xs ago"** indicator so the user knows data freshness
- Polling cleans up on unmount (`clearInterval` in `useEffect`) to prevent memory leaks

### Trip History (new — vehicle detail page)

Accessed via a new **"Trip History"** tab on the vehicle detail page.

**Layout — mobile (stacked):**
```
[ Vehicle Detail ]  [ Trip History ]   ← tabs

Date picker: [From ▾] → [To ▾]        ← defaults to today

Trip 1 — 08:00 to 09:14 (74 min)      ← collapsed
Trip 2 — 11:30 to 12:05 (35 min)      ← expanded
  └── map shows polyline for this trip

[ Load more ]
```

**Layout — desktop (side by side):**
- Trip list on the left panel
- Map fills the right panel, updates when a trip is expanded

**Behaviour:**
- One trip expanded at a time
- Expanding a trip renders its route as a polyline on the map (reuses `VehicleMap`)
- Date range defaults to today; max 30 days enforced on both client and server
- Bahasa Malaysia translations added alongside English

---

## 8. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| **Performance** | History queries bounded to 30 days; `[vehicleId, recordedAt]` index keeps queries fast |
| **Scale** | ~1,440 pings/vehicle/day; 100 vehicles = ~144k rows/day — PostgreSQL handles this with indexing |
| **Atomicity** | PATCH /location dual write wrapped in `prisma.$transaction()` |
| **Security** | IoT endpoint uses API key auth; all other endpoints use session + permission checks; no raw ping data exposed to client |
| **Memory** | Trip segmentation uses cursor-based grouping — does not load full date range into memory |
| **Data retention** | A retention policy (e.g. delete rows older than 1 year) must be implemented before production launch; deferred until fleet size is known |
| **Availability** | Neon PostgreSQL handles connection pooling; Prisma singleton with global dev guard prevents connection exhaustion |

---

## 9. Decision Log

| # | Decision | Alternatives Considered | Why |
|---|---|---|---|
| 1 | Product named **Atlas** | FleetTrack, Tractus, Vigilo | Short, memorable, map connotation; client preference |
| 2 | **60s polling** for live map | SSE, WebSockets | GPS updates at 60s make SSE indistinguishable from polling; simpler stack |
| 3 | **Append-only `LocationHistory`** for trip data | Overwrite single row, separate time-series DB | Standard SQL, fits Prisma stack, queryable without extra infra |
| 4 | **`recordedAt` = hardware time** | Server receive timestamp | Accurate trip reconstruction even if pings arrive late or out of order |
| 5 | **Server-side trip segmentation** (10 min gap) | Client-side segmentation | Single source of truth; threshold tunable in one place |
| 6 | **Cursor-based trip grouping** | Load all pings into memory | Prevents memory spike for large date ranges at unknown fleet sizes |
| 7 | **30-day max query window** | Unbounded queries | Prevents expensive queries; 30 days covers most operational needs |
| 8 | **Single-tenant now, multi-tenant ready** | Full multi-tenancy v1 | Delivery model undecided; Organization model deferred but unblocked |
| 9 | **API key auth for IoT endpoint** | Session auth, no auth | Hardware cannot hold a browser session; security gap if unprotected |
| 10 | **API key management UI deferred** | Build key management in v1 | Keys issued manually for v1; management UI is post-v1 scope |
| 11 | **Data retention policy deferred** | Implement now | Fleet size unknown; premature to set a window before seeing real volume |

---

## 10. Open Questions

| # | Question | Owner |
|---|---|---|
| 1 | How many vehicles does the client need to track? | Client |
| 2 | Who are the day-to-day users — one fleet manager or multiple? | Client |
| 3 | Is there a phased delivery deadline? | Client |
| 4 | Does the GPS hardware send `speed` and hardware `recordedAt`? | Client / hardware vendor |
| 5 | Is multi-tenant (multiple client organisations) a near-term requirement? | Client |

---

## 11. Future Phases

| Phase | Features |
|---|---|
| **v2** | Alerts (speeding, geofencing, idle too long), email/push notifications |
| **v3** | Fleet health dashboard (fuel trends, mileage, maintenance reminders) |
| **v4** | Multi-tenancy (Organisation model, org admin, billing) |
| **v5** | Driver mobile app, driver-side trip logging |
