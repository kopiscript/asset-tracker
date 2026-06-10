"use client";

import { BatteryCharging, BatteryFull, BatteryLow, BatteryWarning, Battery } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import {
  BATTERY_LABEL_KEY,
  BATTERY_CHIP_CLASS,
  type BatteryState,
} from "@/lib/telemetry";

const ICON: Record<BatteryState, typeof Battery> = {
  charging: BatteryCharging,
  healthy: BatteryFull,
  low: BatteryLow,
  critical: BatteryWarning,
  unknown: Battery,
};

/**
 * Compact car-battery health chip. Renders state label, and optionally the
 * raw voltage. Used on the vehicle detail "Live Status" card and on the
 * dashboard fleet list.
 */
export function BatteryBadge({
  state,
  voltage,
  showVoltage = false,
  className = "",
}: {
  state: BatteryState;
  voltage?: number | null;
  showVoltage?: boolean;
  className?: string;
}) {
  const { tr } = useLang();
  const Icon = ICON[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${BATTERY_CHIP_CLASS[state]} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {tr(BATTERY_LABEL_KEY[state])}
      {showVoltage && voltage != null && (
        <span className="font-mono opacity-80">{voltage.toFixed(1)}V</span>
      )}
    </span>
  );
}
