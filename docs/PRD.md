# Mirae — Product Requirements Document

**Version:** 1.4
**Audience:** Developers
**Status:** Active development
**Last updated:** 2026-05-22

---

## 1. Overview

Mirae is a web-based vehicle asset tracking platform. It receives GPS location data from hardware installed in client vehicles, stores it, and presents it through a live map and trip history interface.

Mirae is mobile-friendly (responsive web, not a native app).

**Go-to-market:**
- **Plan A (primary):** Purpose-built for Perodua car dealerships operating vehicle fleets (demo cars, service loaners, staff vehicles).
- **Plan B (fallback):** If Perodua does not proceed, Mirae pivots to commercial SaaS open to any fleet operator. Multi-tenancy (Organisation model) is already implemented.

---

## 2. Problem Statement

Perodua car dealerships have GPS hardware installed in their vehicles but no software layer to receive, store, or visualise that data. Mirae fills that gap.

---

## 3. Users

| User | Description |
|---|---|
| Dealership manager / operations | Primary day-to-day user — monitors all vehicles |
| Dealership staff | Org member with viewer or admin access |
| GPS hardware device | IoT device pushing location pings via API key |
| System admin | Full access to all orgs and vehicles; manages the platform |

---

## 4. V1 Scope

### In scope (implemented)
- Auth: email/password sign-up and sign-in
- Organisation management: create org, invite members by email, remove members, role-based access (owner / admin / viewer)
- Vehicle management: create, edit, delete; assign to org
- Live map: all org vehicles shown with 60-second polling; "Live · X ago" badge
- Single-vehicle detail: live position, speed, last seen, today's mileage
- Trip history: date-range query, 10-minute gap segmentation, polyline display per trip
- IoT endpoint: `PATCH /api/vehicles/[id]/location` with per-vehicle API key auth
- Admin panel: global view of all users, orgs, and vehicles; assign vehicles to orgs
- Bahasa Malaysia UI (partial — new trip history text not yet translated)

### Out of scope (future)
- Alerts and notifications (speeding, geofencing, idle)
- Fleet health reporting (fuel trends, maintenance)
- Driver mobile app
- GPS hardware provisioning / device management
- API key management UI (keys set manually via Prisma Studio for v1)
- Data retention automation

---

## 5. Data Model

### Core models

```
User          — email, bcrypt password, name, usertype (user | admin | system_admin)
Organization  — name; has many members and vehicles
OrgMember     — junction: User × Organization with role (owner | admin | viewer)
Vehicle       — imei, name, plateNumber, type, driverName, isActive, orgId, apiKey
TelemetryRecord — append-only GPS + telemetry log; indexed on [imei, timestampUtc desc]
```

### Access control

Any org member (owner, admin, or viewer) can view all vehicles in their org. Only admins and owners can edit vehicles. Only owners can delete vehicles or manage org members.

System admins (`usertype = "admin"`) have owner-level access to all vehicles and orgs.

### GPS storage: TelemetryRecord

`TelemetryRecord` is the append-only GPS log. Every ping from hardware creates one row. It is never updated or deleted except via cascade when a vehicle is deleted.

```
id              BigInt   PK autoincrement
vehicleId       BigInt   FK → Vehicle
imei            String
timestampUtc    DateTime (hardware or server time, UTC)
timestampMy     DateTime (UTC+8, stored as "fake UTC" for direct column filtering)
latitude        Float?
longitude       Float?
speedKmh        Float?
angle           Float?
-- plus ~15 additional hardware telemetry fields (voltage, signal, etc.)
```

Index: `[imei, timestampUtc DESC]`

**Why not a separate LocationHistory model?** The original plan called for a lightweight 6-field `LocationHistory` table. Hardware integrations require the full telemetry payload, so `TelemetryRecord` (which captures everything the device sends) was used instead. Functionally equivalent for trip history and live position.

### Vehicle position

There are no `latitude`/`longitude` columns on `Vehicle`. Current position is always derived by querying the most recent `TelemetryRecord` with non-null coordinates. This avoids dual-write complexity and keeps the source of truth in one place.

### Fleet models (pending removal)

`Fleet`, `FleetVehicle`, and `FleetMember` models still exist in the schema but are no longer used for access control. Removal is tracked in Phase 0b of `docs/TODO.md`.

---

## 6. API Design

### IoT endpoint

```
PATCH /api/vehicles/[id]/location
Auth: Bearer <apiKey>  (stored on Vehicle.apiKey — NOT session auth)
Body: { latitude: number, longitude: number, speed?: number, recordedAt?: string }
```

Creates one `TelemetryRecord` row. If `vehicle.apiKey` is set, the bearer token must match exactly. If `apiKey` is null (not configured), any token is accepted (dev fallback — set a key before production).

### History endpoint

```
GET /api/vehicles/[id]/history?from=ISO8601&to=ISO8601
Auth: Session (canView permission required)
```

- `from` and `to` are required; max window is 30 days
- Returns GPS pings from `TelemetryRecord`, deduplicated per-minute (`DISTINCT ON`), then segmented into trips by a 10-minute silence threshold
- Response:

```json
{
  "data": [
    {
      "id": 1,
      "startedAt": "2026-05-22T01:00:00Z",
      "endedAt": "2026-05-22T02:14:00Z",
      "durationMinutes": 74,
      "distanceKm": 18.3,
      "pointCount": 89,
      "points": [
        { "latitude": 3.1390, "longitude": 101.6869, "timestampMy": "...", "speedKmh": 60 }
      ]
    }
  ],
  "error": null
}
```

Note: `timestampMy` is a "fake UTC" ISO string — the MY wall-clock time digits stored as if they were UTC. Clients must read UTC fields to display the correct MY time.

### Vehicle list

```
GET /api/vehicles
Auth: Session
```

Returns all vehicles in orgs where the current user is a member (any role). System admins get all vehicles.

### Standard CRUD

```
GET    /api/vehicles/[id]
PATCH  /api/vehicles/[id]    — edit fields (canEdit required)
DELETE /api/vehicles/[id]    — (canDelete / owner only)
GET    /api/vehicles         — list accessible vehicles
POST   /api/vehicles         — create (org owner or system admin)

GET    /api/orgs             — list user's orgs
POST   /api/orgs             — create org (any authenticated user)
GET    /api/orgs/[id]
PATCH  /api/orgs/[id]        — rename (owner only)
DELETE /api/orgs/[id]        — delete (owner only)

GET    /api/orgs/[id]/members
POST   /api/orgs/[id]/members        — invite by email (owner only)
DELETE /api/orgs/[id]/members/[uid]  — remove member (owner only, can't remove last owner)
```

All responses: `{ data: ..., error: null }` on success or `{ data: null, error: "message" }` on failure.

---

## 7. UI

### Dashboard

- Stat cards: Total / Active / Idle / Offline vehicle counts
- Live map with all org vehicles; 60-second polling; "Live · X ago" badge; pauses when tab is hidden
- Vehicle sidebar (desktop): quick links to each vehicle

### Vehicle detail

Two tabs:

**Overview tab:**
- Live map centred on vehicle (10-second polling; stops when History tab is active)
- Vehicle info card: driver, last seen, IMEI, current speed, today's mileage
- Additional info card: org, role, coordinates

**History tab:**
- From / To datetime pickers (MY time); defaults to today midnight → now
- Client validates: range must be ≤ 30 days, `to` must be after `from`
- Loads trips from `GET /api/vehicles/[id]/history`
- Shows trip count and total point count
- Trip list: Trip N · time range · duration · distance · point count
- Clicking a trip focuses its polyline on the map; start = green dot, end = red dot

### Org detail

- Members list with role badges; owner can invite by email and remove members
- Vehicle list (all vehicles in org, not just unassigned)
- *(Fleet section still present — pending Phase 0b cleanup)*

### Admin panel

- Global stats + map
- All-vehicles table with inline org assignment
- All-orgs table with link to configure
- All-users table with org memberships

---

## 8. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| Performance | History queries bounded to 30 days; index on `[imei, timestampUtc DESC]` |
| Scale | ~1,440 pings/vehicle/day; 100 vehicles = ~144k rows/day — handled by PostgreSQL with indexing |
| Security | IoT endpoint uses per-vehicle API key; all user-facing endpoints use session + permission checks |
| Memory | History segmentation processes rows in the query result set; `DISTINCT ON` + `LIMIT 5000` caps response size |
| Atomicity | Single `TelemetryRecord` write per ping (no transaction needed — position derived at read time) |
| Retention | No automated retention policy yet — implement before production once fleet size is known |

---

## 9. Decision Log

| # | Decision | Alternatives | Why |
|---|---|---|---|
| 1 | Product named **Mirae** | FleetTrack, Tractus | Short, map connotation; client preference |
| 2 | **60s polling** for live map | SSE, WebSockets | GPS updates at ~60s make SSE indistinguishable; simpler stack |
| 3 | **TelemetryRecord** for GPS storage | Separate `LocationHistory` table | Hardware sends full telemetry payload; one model captures everything; no dual-write complexity |
| 4 | **Position derived from latest TelemetryRecord** | Store lat/lng on Vehicle | Single source of truth; no dual-write; position is always consistent with history |
| 5 | **Server-side trip segmentation** (10 min gap) | Client-side | Single source of truth; threshold tunable in one place |
| 6 | **`DISTINCT ON` deduplication** before segmentation | Load raw pings | Hardware occasionally sends duplicate payloads within the same minute |
| 7 | **30-day max query window** | Unbounded | Prevents expensive full-table scans |
| 8 | **Per-vehicle API key** on Vehicle model | Global env var, separate ApiKey table | Per-device revocation without a management UI; simple for v1 |
| 9 | **API key management UI deferred** | Build in v1 | Keys issued manually via Prisma Studio; management UI is post-v1 scope |
| 10 | **Org membership = vehicle access** | Fleet sub-grouping | Fleet concept adds complexity without confirmed need; removed (Phase 0b) |
| 11 | **`db push` for dev** | `db migrate` | Faster iteration; proper versioned migration required before production |
| 12 | **Plaintext API key storage** | bcrypt hash | Acceptable for v1 low-volume manual issuance; must hash before production |
| 13 | **`timestampMy` as fake UTC** | Store UTC only, convert at read | Allows direct SQL filtering on MY local time without timezone conversion in queries |
| 14 | **`$executeRawUnsafe` for bulk ops** | `createMany` | `PrismaNeonHttp` does not support implicit transactions; `createMany`/`deleteMany` fail |
| 15 | **Any org role grants vehicle visibility** | Fleet gate for non-owners | Fleet concept removed; simplest coherent access model |

---

## 10. Open Questions

| # | Question | Owner |
|---|---|---|
| 1 | How many vehicles does a typical Perodua dealership need to track? | Perodua |
| 2 | Who are the day-to-day users — manager only, or multiple staff? | Perodua |
| 3 | Is there a demo date or delivery deadline with Perodua? | Perodua |
| 4 | Does the GPS hardware send `speed` and hardware `recordedAt`? | Hardware vendor |
| 5 | Is Perodua expecting one shared deployment or one instance per dealership? | Perodua |
| 6 | If Plan B activates, is self-serve sign-up required or invite-only? | Internal |
| 7 | Data retention window — how long should GPS history be kept? | Internal / Perodua |

---

## 11. Future Phases

| Phase | Features |
|---|---|
| **v2** | Alerts (speeding, geofencing, idle too long), email/push notifications |
| **v3** | Fleet health dashboard (fuel trends, mileage, maintenance reminders) |
| **v4 / Plan B** | Per-org billing, self-serve sign-up, tenant isolation |
| **v5** | Driver mobile app, driver-side trip logging |
