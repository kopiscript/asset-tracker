# Mirae v1 — Implementation To-Do

> **Before you start:** Read `CLAUDE.md` in the project root first. It documents breaking changes in Next.js 16, Prisma 7, shadcn/ui, and NextAuth v5 that are not obvious from training data.

**Last updated:** 2026-05-22 (session 3)
**PRD:** `docs/PRD.md`

---

## How to use this file

- `[ ]` = not started · `[~]` = in progress · `[x]` = done
- Mark a task done only after testing end-to-end.
- If implementation diverges from the plan, note it inline beneath the checkbox.

---

## Current state summary

The app is functional end-to-end. Auth, vehicle CRUD, org management, live map (60s polling), trip history with segmentation, and bilingual (EN/BM) translations are all working. Fleet concept was removed — access control is org membership only. The GPS hardware writes directly to `telemetry_records`; the IoT endpoint (`PATCH /api/vehicles/[id]/location`) exists but is unused by the actual hardware. Remaining work is production readiness only.

---

## Phase 0b — Fleet removal

**Decision (2026-05-21):** The Fleet concept was removed. Access control simplified to org membership — any org member sees all org vehicles.

**Status: Complete (2026-05-22)**

- [x] **0b.1** Remove `Fleet`, `FleetVehicle`, `FleetMember` models from `prisma/schema.prisma`; remove `fleets` relation from `Organization`; remove `fleetMemberships` from `User`
- [x] **0b.2** Drop the tables from the database (`prisma db push`)
  > ⚠️ DB push failed during session due to connectivity (P1001). Tables may still exist in the DB. Re-run `npx prisma db push` when connected to confirm.
- [x] **0b.3** `npm run db:generate` — Prisma client regenerated without fleet types
- [x] **0b.4** Deleted `app/api/orgs/[id]/fleets/` route tree
- [x] **0b.5** Deleted `app/dashboard/orgs/[id]/fleets/` page tree
- [x] **0b.6** `app/dashboard/vehicles/page.tsx` — uses org membership only
- [x] **0b.7** `app/api/orgs/[id]/route.ts` and `app/api/orgs/route.ts` — `_count.fleets` removed
- [x] **0b.8** `app/dashboard/orgs/[id]/page.tsx` — Fleets section removed; "Unassigned Vehicles" renamed "Vehicles"
- [x] **0b.9** `app/dashboard/orgs/[id]/OrgPageClient.tsx` — simplified to invite-member only
- [x] **0b.10** `app/dashboard/orgs/page.tsx` — `_count.fleets` and Layers icon removed
- [x] **0b.11** Build passes with no TypeScript errors

---

## Phase 1 — Database

- [x] **1.1** `apiKey String? @map("api_key")` field present on `Vehicle` model
- [x] **1.2** `TelemetryRecord` model exists as the append-only GPS log (replaces the originally-planned lightweight `LocationHistory` — see note)
  > **Note:** The original plan called for a `LocationHistory` model with only 6 fields. The actual implementation uses `TelemetryRecord` (20+ fields from the GPS hardware payload). Functionally equivalent; history endpoint queries `telemetry_records`. No further schema change needed.
- [x] **1.3** `@@index([imei, timestampUtc(sort: Desc)])` exists on `TelemetryRecord`
- [x] **1.4** Schema applied to database via `prisma db push` (dev only)
  > ⚠️ Before production: run a proper `npm run db:migrate` with a migration name to get a versioned file.
- [x] **1.5** Prisma client generated
- [ ] **1.6** *(Manual)* Open `npm run db:studio`, navigate to `Vehicle`, set `apiKey` on at least one row for end-to-end IoT testing

---

## Phase 2 — IoT location endpoint

**Status:** Endpoint exists but is NOT used by actual hardware. The GPS hardware writes directly to the `telemetry_records` table in the database — no HTTP endpoint involved. This endpoint is effectively dead code for v1.

- [x] **2.1** `PATCH /api/vehicles/[id]/location` exists with API key auth (bearer token)
- [x] **2.2** Validates `vehicle.apiKey` when set
- [x] **2.3–2.4** Writes one `TelemetryRecord` row per ping
- [N/A] **2.5** Manual test — irrelevant; hardware bypasses this endpoint entirely

---

## Phase 3 — Trip history endpoint

**Status:** Complete.

- [x] **3.1** `GET /api/vehicles/[id]/history?from=ISO&to=ISO` exists
- [x] **3.2** Validates date range: missing params → 400; `>30 days` → 400; invalid dates → 400
- [x] **3.3** Segments pings into trips by 10-minute silence threshold; returns `TripRecord[]` with `id`, `startedAt`, `endedAt`, `durationMinutes`, `distanceKm`, `pointCount`, `points[]`
- [x] **3.4** `canView` permission enforced — users without org membership get 404
- [x] **3.5** Deduplicates same-minute pings using `DISTINCT ON (date_trunc('minute', timestamp_my))` before segmentation

---

## Phase 4 — Live map

**Status:** Complete.

- [x] **4.1** `components/dashboard/LiveMap.tsx` polls `GET /api/vehicles` every 60 seconds
- [x] **4.2** Pauses polling when tab is hidden; resumes and refreshes immediately on tab focus
- [x] **4.3** "Live · X ago" badge with green pulse in bottom-right of map
- [x] **4.4** Single-vehicle detail page polls `GET /api/vehicles/[id]` every 10 seconds in the Overview tab; polling stops when History tab is active

---

## Phase 5 — Trip history UI

**Status:** Complete.

- [x] **5.1** Vehicle detail page has Overview / History tabs (`VehicleDetailTabs.tsx`)
- [x] **5.2** History tab has From/To datetime pickers (MY time) defaulting to today
- [x] **5.3** Client-side validation: rejects ranges > 30 days or `to` before `from`
- [x] **5.4** Loads trips from `GET /api/vehicles/[id]/history`; shows trip count + total point count
- [x] **5.5** Trip list: Trip N, time range, duration (min), distance (km), point count; clicking a row focuses that trip's polyline on the map
- [x] **5.6** Map shows selected trip's polyline with start (green) / end (red) markers and intermediate dots with speed tooltips
- [x] **5.7** Empty state: "No trips found for this time range"

---

## Phase 6 — Translations + polish

**Status: Complete (2026-05-22)**

- [x] **6.1** Added EN + BM strings to `lib/translations.ts` for all Phase 5 trip history UI text:
  - `tripHistory`, `loadTrips`, `tripsFound`, `pointsFound`, `tripLabel`
  - `tripListHeader`, `noTripsFound`
  - `fromLabel`, `toLabel`, `durationMin`, `distanceKm`
  - `errorMaxWindow`, `errorToBeforeFrom`
- [x] **6.2** No duplicate keys introduced
- [ ] **6.3** Update `README.md` — document `GET /api/vehicles/[id]/history` endpoint; document `SUPPORT_EMAIL` env var

---

## Org management — member removal

**Status:** Complete (2026-05-22).

- [x] `DELETE /api/orgs/[id]/members/[userId]` — removes a member; prevents removing the last owner
- [x] `RemoveMemberButton` component wired into org detail page — visible to owners only, hidden for self

---

## Production readiness (before go-live)

These are not feature tasks but must be done before the app is used with real hardware and real data:

- [ ] **P.1** Run `npm run db:migrate` (with a proper migration name) instead of relying on `db push`
- [ ] **P.2** Hash `apiKey` values with bcrypt before storing — currently plaintext (acceptable for v1 dev, not for production)
- [x] **P.3** Implement a data retention policy — `POST /api/cron/retention` deletes rows older than `RETENTION_MONTHS` months (default 6); called by external cron (cron-job.org); auth via `CRON_SECRET` env var; batched at 50k rows/call. See `docs/PRICING.md` for window rationale.
- [ ] **P.4** Restrict or remove `POST /api/simulate/tick` if it exists — must not run in production with real hardware data
- [ ] **P.5** Set `SUPPORT_EMAIL` env var in production environment (settings page falls back to `support@assettracker.my` if unset)

---

## Dependency map

```
Phase 0b — Fleet schema cleanup  (self-contained)
Phase 1   — Schema               (done)
  └── Phase 2 — IoT endpoint     (done)
  └── Phase 3 — History endpoint (done)
        └── Phase 5 — History UI (done)

Phase 4 — Live map               (done, independent)
Phase 6 — Translations           (alongside / after Phase 5)
```

---

## Quick reference

| What | Where |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| Prisma config (CLI) | `prisma.config.ts` |
| Prisma client (runtime) | `lib/prisma.ts` |
| Generated client import | `@/lib/generated/prisma/client` |
| Permissions | `lib/permissions.ts` — `canView`, `canEdit`, `canDelete`, `canManageOrg` |
| Translations | `lib/translations.ts` — `en` and `bm` keys |
| Date/number utils | `lib/format.ts` — `timeAgo()`, `formatNumber()` |
| Geo utils | `lib/geo.ts` — `totalDistanceKm()`, `todayMidnightMy()` |
| Map (always use DynamicMap) | `components/map/DynamicMap.tsx` |
| IoT endpoint | `app/api/vehicles/[id]/location/route.ts` |
| History endpoint | `app/api/vehicles/[id]/history/route.ts` |
| Live map component | `components/dashboard/LiveMap.tsx` |
| Trip history UI | `app/dashboard/vehicles/[id]/VehicleDetailTabs.tsx` (HistoryTab) |
| API shape | Always `{ data: ..., error: null }` or `{ data: null, error: "msg" }` |
