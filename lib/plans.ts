export const PLANS = {
  free:       { vehicleLimit: 1,        rateWindow: "1 m",  rateMax: 1, priceRm: 0    },
  personal:   { vehicleLimit: 3,        rateWindow: "1 m",  rateMax: 1, priceRm: 29   },
  growth:     { vehicleLimit: 20,       rateWindow: "10 s", rateMax: 1, priceRm: 149  },
  fleet:      { vehicleLimit: 50,       rateWindow: "10 s", rateMax: 1, priceRm: null },
  enterprise: { vehicleLimit: Infinity, rateWindow: "10 s", rateMax: 1, priceRm: null },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlan(key: string): (typeof PLANS)[PlanKey] {
  return PLANS[key as PlanKey] ?? PLANS.free;
}
