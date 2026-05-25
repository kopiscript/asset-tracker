# Mirae — Internal Cost, Pricing & Margin Model

**Last updated:** 2026-05-25
**Status:** Working draft — numbers to be finalised before public pricing page goes live
**Audience:** Internal (AZP Group founders only)

---

## 1. Infrastructure OpEx (Vercel + Neon + Resend only)

### Data growth rate

- Ping frequency: **1 per minute per vehicle** = 1,440 rows/day/vehicle
- Row size estimate: **~500 bytes** (30 telemetry fields + index overhead)
- Growth per vehicle: **~21 MB/month** | **~252 MB/year**

### Storage at scale (with 6-month rolling retention)

| Vehicles | Storage used | Neon plan needed | Neon cost/mo |
|---|---|---|---|
| ≤ 80 | ≤ 9.8 GB | Launch (10 GB) | $19 |
| 81 – 400 | 9.9 – 49.2 GB | Scale (50 GB) | $69 |
| 401 – 600 | 49.3 – 73.8 GB | Scale + overage | $69 + ~$3–4 |
| 601 – 1,000 | 73.9 – 123 GB | Scale + overage | $69 + ~$4–11 |
| 1,000+ | > 123 GB | Scale + overage | ~$80–100 |

> Neon overage rate: **$0.15 / GB-month** — very cheap above the 50 GB base.

### Monthly infrastructure cost by scale

| Vehicles | Neon | Vercel Pro | Resend | **Total USD/mo** | **Total MYR/mo** |
|---|---|---|---|---|---|
| ≤ 80 | $19 | $20 | $0 (free tier) | **$39** | **~RM 183** |
| 81 – 400 | $69 | $20 | $0 | **$89** | **~RM 418** |
| 401 – 1,000 | ~$73 | $20 | $20 | **~$113** | **~RM 531** |
| 1,000+ | ~$80–100 | $20 | $20 | **~$120–140** | **~RM 564–658** |

> USD/MYR rate used: 4.70. Update this field periodically.

---

## 2. Personnel OpEx (Mirae team only)

| Role | Gross salary | EPF employer 13% | SOCSO + EIS ~2% | **All-in cost/mo** |
|---|---|---|---|---|
| Developer 1 | RM ___ | RM ___ | RM ___ | RM ___ |
| Developer 2 | RM ___ | RM ___ | RM ___ | RM ___ |
| Developer / PM | RM ___ | RM ___ | RM ___ | RM ___ |
| **Total** | | | | **RM ___** |

> Fill in actual salaries. Example row: Gross RM 5,000 → EPF RM 650 → SOCSO+EIS RM 100 → All-in RM 5,750.
> Reference total used in this model until filled: **RM 19,550/month**.

---

## 3. Total monthly cost & cost per vehicle

Formula: `Total cost = Personnel + Infrastructure`

| Vehicles | Infra (MYR) | Personnel (MYR) | **Total cost/mo** | **Cost per vehicle** |
|---|---|---|---|---|
| 50 | RM 183 | RM 19,550 | RM 19,733 | RM 394.66 |
| 100 | RM 418 | RM 19,550 | RM 19,968 | RM 199.68 |
| 200 | RM 418 | RM 19,550 | RM 19,968 | RM 99.84 |
| 300 | RM 418 | RM 19,550 | RM 19,968 | RM 66.56 |
| 500 | RM 531 | RM 19,550 | RM 20,081 | RM 40.16 |
| 1,000 | RM 658 | RM 19,550 | RM 20,208 | RM 20.21 |

> Key insight: personnel is the dominant fixed cost. Infra barely moves even at 10× scale.
> The business is unprofitable below ~300 vehicles at market rates — **acquiring clients fast matters more than optimising infra.**

---

## 4. Break-even & margin analysis

Break-even revenue formula: `Revenue = Total cost / (1 − target margin)`

### At 300 vehicles (target launch milestone)

| Target margin | Revenue needed/mo | Revenue per vehicle/mo |
|---|---|---|
| 0% (break-even) | RM 19,968 | RM 66.56 |
| 20% | RM 24,960 | RM 83.20 |
| 30% | RM 28,526 | RM 95.09 |
| 40% | RM 33,280 | RM 110.93 |
| 50% | RM 39,936 | RM 133.12 |

### At 500 vehicles

| Target margin | Revenue needed/mo | Revenue per vehicle/mo |
|---|---|---|
| 0% | RM 20,081 | RM 40.16 |
| 20% | RM 25,101 | RM 50.20 |
| 30% | RM 28,687 | RM 57.37 |
| 40% | RM 33,468 | RM 66.94 |
| 50% | RM 40,162 | RM 80.32 |

> **Market rate** for fleet tracking SaaS in Malaysia: **RM 30–80/vehicle/month**.
> Pricing at RM 60–70/vehicle puts you at ~40% margin at 500 vehicles — competitive and healthy.

---

## 5. Suggested pricing structure (to be finalised)

### Option A — Per-vehicle flat rate

| Tier | Vehicles/org | Data retention | Price/vehicle/mo | Notes |
|---|---|---|---|---|
| Starter | Up to 15 | 3 months | RM ___ | Small fleets, low commitment |
| Standard | Up to 50 | 6 months | RM ___ | Typical dealership |
| Enterprise | Unlimited | 12 months | RM ___ | Multi-branch, custom SLA |

### Option B — Platform fee + per-vehicle

```
Base fee:   RM 200 / org / month   (covers platform access + first N vehicles)
Per vehicle: RM 45–60 / vehicle / month
```

Example: org with 25 vehicles → RM 200 + (25 × RM 50) = **RM 1,450/month**
At 15 such orgs → RM 21,750/month → above break-even at 300+ vehicles

---

## 6. Data retention lever

Retention period is the single biggest cost control knob:

| Retention | Storage/vehicle | Neon plan for 300 vehicles |
|---|---|---|
| 3 months | ~63 MB | Launch ($19) |
| 6 months | ~126 MB | Scale ($69) |
| 12 months | ~252 MB | Scale ($69) + small overage |

> **Recommendation:** 6 months as the default. Offer 12 months as a paid tier add-on.
> Retention is enforced by the nightly cron at `/api/cron/retention` (configurable via `RETENTION_MONTHS` env var).

---

## 7. Assumptions & update log

| Date | Update |
|---|---|
| 2026-05-25 | Initial model created. Personnel figures are estimates — replace with actuals. |
| | |
