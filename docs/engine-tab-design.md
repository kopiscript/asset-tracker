# Engine / OBD Tab — Fuel + Engine Health (Tier 1)

## Understanding Summary

**What is being built:** An **"Engine & Fuel" section in the Overview tab** of
the vehicle detail page (`app/dashboard/vehicles/[id]`) surfacing live OBD-II
telemetry from the Teltonika FMC003. A 4-gauge cluster (Fuel, Coolant, RPM,
Engine Load) plus an expandable "More engine details" section for 6 secondary
fields. Low-fuel and overheat states render as color chips reusing the
`BatteryBadge` translucent idiom.

> **Placement note:** Originally built as a separate "Engine" third tab, then
> moved inline into Overview (below the Live Status card) at the user's request
> — fewer clicks, all live telemetry in one glance. The section renders nothing
> for the ~9% of trackers with no OBD data (matching how Overview already hides
> the Live Status card when there's no telemetry), rather than a full empty panel.

**Why it exists:** ~91% of telemetry pings already carry real, varying OBD
engine data that was stored but never displayed. Fuel level and coolant temp
are the highest-value fleet signals in that set.

**Who it is for:** All roles on the vehicle detail page (read-only telemetry —
no extra permission gating beyond the existing "can you see this vehicle" check).

**Non-goals (deferred to Tier 2):** historical OBD charts, fuel-theft / idle
analytics, driver-behavior scoring from the accelerometer, and any fault-code
panel (the `fault_codes` / MIL columns are empty or always-zero in live data).

---

## Decision Log

| Decision | Alternatives | Why chosen |
|---|---|---|
| Inline "Engine & Fuel" section in Overview | Separate "Engine" third tab | Fewer clicks; all live telemetry in one view (revised user choice — initially a tab, then moved inline) |
| Full gauge cluster (4 dials) | All StatTiles / hybrid | Instrument-panel feel for the headline metrics (user choice) |
| 4 headline gauges + 6 expandable | All-flat / 4-only | Balances glanceability vs. completeness (user choice) |
| Low-fuel + overheat chips | Values only | Surfaces problems; reuses `BatteryBadge` idiom (user choice) |
| Lift `useLiveVehicle` to `VehicleDetailTabs` | Per-tab poller | One 30s request for the whole page; Overview + Engine share live data |
| Carry OBD values RAW in `VehicleTelemetry` | Normalize at API | Single formatting source of truth in `EngineTab`/`Gauge` |
| `Gauge` as pure SVG (no deps) | charting lib | Zero new dependencies; dark-theme via `currentColor`; cheap to animate |

---

## Calibration (live data, 90-day sample, n≈20k)

Sampled real min/avg/p95/max to set gauge ranges and catch scaling. Findings:

- **`control_module_voltage` is in millivolts** (12968–14042) → display `÷1000` as **V**.
- **`maf`** reads 106–1767 → Teltonika 0.01 g/s units → display `÷100` as **g/s**.
- **`fuel_level_obd`** can exceed 100 (max 103) → **clamp 0–100** for display.
- **`engine_rpm`** tops ~2735 (gentle driving) → 0–7000 tach with >6000 redline reads naturally.
- Coolant 46–98°C confirms °C; throttle floors at ~31% (normal OBD closed-throttle baseline).

Thresholds: Fuel low <15% / critical <8%. Coolant normal 80–104°C, hot 105–110, critical >110.

---

## Final Design

**Data flow.** `page.tsx` (initial SSR) and `GET /api/vehicles/[id]` (poll)
both extend their `telemetryRecords` `select` and returned `telemetry` object
with the 10 OBD fields. The OBD columns are snake_case Prisma identifiers
(no `@map`), so the select uses `engine_rpm`, `fuel_level_obd`, etc.;
`control_module_voltage` is a Prisma `Decimal` and is coerced with `Number()`.

**Types & helpers** (`lib/telemetry.ts`): `VehicleTelemetry` gains the 10 OBD
fields (raw units, documented inline). New `deriveFuelLevel` / `deriveCoolantTemp`
mirror the existing `deriveBatteryHealth` pattern, returning a state enum +
value, with `*_LABEL_KEY`, `*_CHIP_CLASS` maps and `isLowFuel` / `isOverheating`.

**Components.** `components/Gauge.tsx` — a pure 270° SVG arc gauge (gap at
bottom), color via Tailwind `text-*` + `currentColor`, animated on poll updates
with a `stroke-dasharray` transition. `EngineTab` (in `VehicleDetailTabs.tsx`)
renders the cluster, the expander, and the empty state.

**States.** Empty: a composed "No engine data — this tracker isn't reading the
vehicle's OBD port" panel for the ~9% of non-OBD units (detected when all four
headline fields are null). Live values otherwise (initial data is SSR-provided,
so no async loading phase). All copy is bilingual via `tr()` (en + bm).

**Files touched:**
- `lib/telemetry.ts` — interface + fuel/coolant helpers
- `lib/translations.ts` — en/bm engine keys
- `app/api/vehicles/[id]/route.ts` — select + telemetry
- `app/dashboard/vehicles/[id]/page.tsx` — select + telemetry
- `components/Gauge.tsx` — new
- `app/dashboard/vehicles/[id]/VehicleDetailTabs.tsx` — EngineTab + lifted poll + tab
