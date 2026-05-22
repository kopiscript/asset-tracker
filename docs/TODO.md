# Atlas v1 — Implementation To-Do

> **Before you start:** Read `CLAUDE.md` in the project root first. It documents breaking changes in Next.js 16, Prisma 7, shadcn/ui, and NextAuth v5 that are not obvious from training data.

**Last updated:** 2026-05-22
**PRD:** `docs/PRD.md`

---

## How to use this file

- `[ ]` = not started · `[~]` = in progress · `[x]` = done
- Mark a task done only after testing end-to-end.
- If implementation diverges from the plan, note it inline beneath the checkbox.

---

## Current state summary

The app is functional end-to-end. Auth, vehicle CRUD, org management, live map (60s polling), trip history with segmentation, and API key auth on the IoT endpoint are all working. The main remaining work is cleaning up the Fleet data model (which was decided against) and adding Bahasa Malaysia translations for the trip history UI.

---

## Phase 0b — Fleet removal

**Decision (2026-05-21):** The Fleet concept is being removed. Access control simplified to org membership — any org member sees all org vehicles. Permissions logic was already simplified (2026-05-22), but the schema, routes, and pages still need cleanup.

**What's already done (2026-05-22):**
- `lib/permissions.ts` — fleet functions removed, `getEffectiveVehicleRole` now uses org role directly
- `app/api/vehicles/route.ts` — fleet membership query removed, uses org membership only
- `app/dashboard/page.tsx` — fleet membership query removed

**What still needs doing:**

- [ ] **0b.1** Remove `Fleet`, `FleetVehicle`, `FleetMember` models from `prisma/schema.prisma`; remove `fleets` relation from `Organization`; remove `fleetMemberships` from `User`
- [ ] **0b.2** Drop the tables from the database (`prisma db push` after schema update, or write a migration)
- [ ] **0b.3** Run `npm run db:generate` to regenerate the Prisma client
- [ ] **0b.4** Delete `app/api/orgs/[id]/fleets/` route tree (4 files)
- [ ] **0b.5** Delete `app/dashboard/orgs/[id]/fleets/` page tree (2 files)
- [ ] **0b.6** Update `app/dashboard/vehicles/page.tsx` — still queries `fleetMember` and uses fleet OR clause; replace with org membership only (same pattern as `app/dashboard/page.tsx` after the 2026-05-22 fix)
- [ ] **0b.7** Update `app/api/orgs/[id]/route.ts` and `app/api/orgs/route.ts` — remove `_count.fleets` from queries and responses
- [ ] **0b.8** Update `app/dashboard/orgs/[id]/page.tsx` — remove the Fleets section and "New Fleet" button; rename "Unassigned Vehicles" to "Vehicles"
- [ ] **0b.9** Update `app/dashboard/orgs/[id]/OrgPageClient.tsx` — remove the `create-fleet` action branch; simplify to invite-member only
- [ ] **0b.10** Verify build passes and org/vehicle pages render correctly with no fleet references

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

**Status:** Functional. Auth, body parsing, and telemetry write are all working.

- [x] **2.1** `PATCH /api/vehicles/[id]/location` uses `Authorization: Bearer <key>` — no session auth
- [x] **2.2** Validates `vehicle.apiKey` — if key is set on the vehicle, the bearer token must match exactly; vehicles with no key configured accept any token (backward compat for dev)
- [x] **2.3** Body accepts `{ latitude, longitude, speed?, recordedAt? }` — maps to `TelemetryRecord` fields
- [x] **2.4** Writes one `TelemetryRecord` row per ping
  > **Note:** Original spec called for a dual write (`Vehicle` lat/lng + `LocationHistory`) inside `prisma.$transaction()`. Not implemented because (a) `Vehicle` has no `latitude`/`longitude` columns — position is always derived from the latest `TelemetryRecord`; (b) `PrismaNeonHttp` does not support `$transaction()`. Single write to `TelemetryRecord` achieves the same result.
- [ ] **2.5** *(Manual test)* `curl -X PATCH .../api/vehicles/<id>/location -H "Authorization: Bearer <key>" -d '{"latitude":3.139,"longitude":101.687}'` — confirm row appears in `telemetry_records` via Prisma Studio

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

- [ ] **6.1** Add BM strings to `lib/translations.ts` for new UI text introduced in Phase 5:
  - History tab label ("History" → "Sejarah")
  - "Load Trips" button
  - "X trips · Y points"
  - Trip list header ("Trips — click a row to show route")
  - "Trip N" label
  - Duration / distance / points column labels
  - "No trips found for this time range"
  - Date input labels ("From (MY time)", "To (MY time)")
  - Client-side error messages ("Maximum history window is 30 days", "'To' must be after 'From'")
- [ ] **6.2** Check existing keys in `lib/translations.ts` before adding — do not duplicate
- [ ] **6.3** Update `README.md` — document `PATCH /api/vehicles/[id]/location` and `GET /api/vehicles/[id]/history` endpoints; document `SUPPORT_EMAIL` env var

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
- [ ] **P.3** Implement a data retention policy — delete `telemetry_records` rows older than N months; exact window TBD based on fleet size
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
