# Mirae v1 — Implementation To-Do

> **Before you start:** Read `CLAUDE.md` in the project root first. It documents breaking changes in Next.js 16, Prisma 7, shadcn/ui, and NextAuth v5 that are not obvious from training data.

**Last updated:** 2026-05-25 (session 4)
**PRD:** `docs/PRD.md`

---

## How to use this file

- `[ ]` = not started · `[~]` = in progress · `[x]` = done
- Mark a task done only after testing end-to-end.
- If implementation diverges from the plan, note it inline beneath the checkbox.

---

## Current state summary

The app is functional end-to-end. Auth, vehicle CRUD, org management, live map (60s polling), trip history with segmentation, and bilingual (EN/BM) translations are all working. Fleet concept was removed — access control is org membership only. The GPS hardware writes directly to `telemetry_records`; the IoT endpoint (`PATCH /api/vehicles/[id]/location`) exists but is unused by the actual hardware. The app has been renamed from Atlas to Mirae across all files. A landing page with pricing section is live. Remaining work is production readiness and a few open cleanup items.

---

## Phase 0b — Fleet removal

**Status: Complete (2026-05-22)**

- [x] **0b.1** Remove `Fleet`, `FleetVehicle`, `FleetMember` models from `prisma/schema.prisma` — confirmed absent
- [x] **0b.2** Tables dropped from database
- [x] **0b.3** Prisma client regenerated without fleet types
- [x] **0b.4–0b.11** Route trees, pages, and UI references removed; build passes

> **Note:** A dead share route remains at `app/api/vehicles/[id]/share/` — it returns a tombstone error referencing the removed fleet management. See Cleanup section.

---

## Phase 1 — Database

- [x] **1.1** `apiKey String? @map("api_key")` field present on `Vehicle` model
- [x] **1.2** `TelemetryRecord` model exists as the append-only GPS log (20+ fields)
- [x] **1.3** `@@index([imei, timestampUtc(sort: Desc)])` exists on `TelemetryRecord`
- [x] **1.4** Schema applied to database
- [ ] **1.5** Proper versioned migration — `prisma/migrations/20260504081616_init/` exists but predates the NextAuth rewrite (still has `clerkId`). The working schema was applied via `db push`. Before production: reset migrations and run `npm run db:migrate` to get a clean versioned baseline.
- [ ] **1.6** *(Manual)* Set `apiKey` on at least one vehicle row in Prisma Studio for IoT testing

---

## Phase 2 — IoT location endpoint

**Status:** Endpoint exists but is NOT used by actual hardware. The GPS hardware writes directly to `telemetry_records`. This endpoint is effectively dead code for v1.

- [x] **2.1** `PATCH /api/vehicles/[id]/location` exists with API key auth
- [x] **2.2–2.4** Validates key, writes `TelemetryRecord`
- [N/A] **2.5** Manual test — irrelevant; hardware bypasses this endpoint

---

## Phase 3 — Trip history endpoint

**Status: Complete.**

- [x] **3.1** `GET /api/vehicles/[id]/history?from=ISO&to=ISO` exists
- [x] **3.2** Validates date range (400 on missing/invalid/> 30 days)
- [x] **3.3** Segments pings into trips by 10-min silence threshold
- [x] **3.4** `canView` permission enforced
- [x] **3.5** Deduplicates same-minute pings with `DISTINCT ON`

---

## Phase 4 — Live map

**Status: Complete.**

- [x] **4.1** `components/dashboard/LiveMap.tsx` polls every 60 seconds
- [x] **4.2** Pauses on hidden tab; resumes on focus
- [x] **4.3** "Live · X ago" badge with green pulse
- [x] **4.4** Single-vehicle detail polls every 10s; stops when History tab is active

---

## Phase 5 — Trip history UI

**Status: Complete.**

- [x] **5.1–5.7** Overview/History tabs, date pickers, trip list, polyline display, empty state all working

---

## Phase 6 — Translations + polish

**Status: Complete.**

- [x] **6.1** EN + BM strings added for all Phase 5 trip history UI text
- [x] **6.2** No duplicate keys
- [ ] **6.3** Update `README.md`:
  - Title is still "FleetTrack" — rename to "Mirae"
  - Document `GET /api/vehicles/[id]/history` endpoint
  - Document `SUPPORT_EMAIL` env var

---

## Org management — member removal

**Status: Complete (2026-05-22).**

- [x] `DELETE /api/orgs/[id]/members/[userId]` — removes member; prevents removing last owner
- [x] `RemoveMemberButton` — wired into org detail page, visible to owners only

---

## Landing page

**Status: Complete (2026-05-25).**

- [x] Hero, Features, CTA, Footer sections
- [x] `PricingSection` — hardware step (RM 399/device) + subscription tiers (Starter/Growth/Fleet) with monthly/annual toggle
- [x] App renamed Atlas → Mirae across all UI strings, page titles, email addresses, and documentation
- [x] Mobile hamburger moved into `DashboardHeader` (no longer a rogue `fixed` overlay)
- [ ] Add "Pricing" anchor link to landing nav (currently no nav link points to `#pricing`)

---

## Cleanup

- [ ] **C.1** Remove or replace the dead share route at `app/api/vehicles/[id]/share/` — currently returns a tombstone error referencing removed fleet management. Either delete the directory or replace with a proper 410 Gone response.
- [ ] **C.2** Fix settings page email fallback: `app/dashboard/settings/page.tsx` line 26 still has `"support@assettracker.my"` — update to `"support@miraefleet.app"` to match the renamed brand.

---

## Production readiness (before go-live)

- [ ] **P.1** Run `npm run db:migrate` — reset stale `20260504081616_init` migration and create a clean versioned baseline from the current schema
- [ ] **P.2** Hash `apiKey` values with bcrypt before storing — currently plaintext
- [ ] **P.3** Implement a data retention policy — delete `telemetry_records` rows older than N months; window TBD
- [ ] **P.4** Gate `POST /api/simulate/tick` behind an env flag or remove it — the route exists and is not currently called by any UI code, but it must not be reachable in production with real hardware data
- [ ] **P.5** Set `SUPPORT_EMAIL` env var in production (settings page fallback is `support@assettracker.my` — wrong after rename; also fix C.2 above)
- [ ] **P.6** Add rate limiting to `PATCH /api/vehicles/[id]/location` — guard against misconfigured hardware flooding `telemetry_records` (e.g. max 2 req/min per API key via Upstash Redis)
- [ ] **P.7** Add `/api/health` endpoint (basic DB ping, returns 200) and wire to an external uptime monitor (UptimeRobot free tier)
- [ ] **P.8** Add Vercel project config (`vercel.ts` or `vercel.json`) — no deployment config exists; required before first production deploy

---

## Dependency map

```
Phase 0b — Fleet schema cleanup  (complete)
Phase 1   — Schema               (complete, P.1 migration cleanup pending)
  └── Phase 2 — IoT endpoint     (complete, unused by hardware)
  └── Phase 3 — History endpoint (complete)
        └── Phase 5 — History UI (complete)

Phase 4 — Live map               (complete)
Phase 6 — Translations           (complete, 6.3 README pending)
Landing page                     (complete, pricing nav link pending)
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
