"use client";

import { createContext, useContext } from "react";

export interface PlanInfo {
  plan: string;
  planLabel: string;
  vehicleCount: number;
  vehicleLimit: number; // -1 means Infinity (can't serialize Infinity as JSX prop)
}

const PlanContext = createContext<PlanInfo | undefined>(undefined);

export function PlanProvider({
  children,
  initialPlan,
}: {
  children: React.ReactNode;
  initialPlan?: PlanInfo;
}) {
  return (
    <PlanContext.Provider value={initialPlan}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanInfo | undefined {
  return useContext(PlanContext);
}

export function resolvedVehicleLimit(limit: number): number | typeof Infinity {
  return limit === -1 ? Infinity : limit;
}
