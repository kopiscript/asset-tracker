/**
 * lib/telemetry.ts
 * Pure helpers that turn raw Teltonika telemetry columns (stored on
 * TelemetryRecord) into human-readable states. No React, no DB — safe to import
 * from both server components and client components.
 *
 * Only fields proven reliable in the live data are derived here. `ignition`
 * (almost always 0/null — digital line not wired) and `crash_event` (~50/50
 * across all rows — mislabeled, not real crash detection) are deliberately
 * NOT surfaced.
 */
import type { TranslationKey } from "@/lib/translations";

/** Raw telemetry subset carried from the API into the UI. */
export interface VehicleTelemetry {
  movement: number | null;
  satellites: number | null;
  gsmSignal: number | null;
  gsmOperator: string | null;
  altitude: number | null;
  angle: number | null;
  batteryPercent: number | null;
  carBatteryVoltage: number | null;
  externalVoltage: number | null;
  // ── OBD-II engine block (FMC003 plugged into the vehicle's OBD port) ──
  // Values are carried RAW as the device stores them — unit conversion happens
  // at display time (see EngineTab). Notably: controlModuleVoltage is in
  // millivolts (÷1000 → V) and maf is in 0.01 g/s units (÷100 → g/s).
  fuelLevelObd: number | null;        // percent, 0–100 (device may report up to ~103)
  engineCoolantTemp: number | null;   // °C
  engineRpm: number | null;           // rev/min
  engineLoad: number | null;          // percent
  throttlePosition: number | null;    // percent
  absoluteLoad: number | null;        // percent
  controlModuleVoltage: number | null;// millivolts
  intakeAirTemp: number | null;       // °C
  maf: number | null;                 // 0.01 g/s
  barometricPressure: number | null;  // kPa
}

// ── Car battery ────────────────────────────────────────────────────────────

export type BatteryState = "charging" | "healthy" | "low" | "critical" | "unknown";

export interface BatteryHealth {
  state: BatteryState;
  /** The voltage the state was derived from, or null if no reading. */
  voltage: number | null;
}

/**
 * Derives car battery health from the vehicle's 12V system voltage.
 *
 * Prefers `car_battery_voltage`, falling back to `external_voltage` — on the
 * Teltonika device both read the same 12V line. Thresholds for a standard 12V
 * lead-acid automotive battery, tuned against resting voltage so a normally
 * parked car (~12.3–12.5V) reads healthy and does NOT trigger alerts:
 *   > 13.0V    charging  (engine running, alternator feeding the system)
 *   12.2–13.0  healthy   (normal resting charge)
 *   11.8–12.2  low       (discharged — car has been sitting too long)
 *   < 11.8     critical  (won't reliably crank — needs attention)
 */
export function deriveBatteryHealth(
  carBatteryVoltage: number | null | undefined,
  externalVoltage: number | null | undefined
): BatteryHealth {
  const v = carBatteryVoltage ?? externalVoltage ?? null;
  if (v == null || v <= 0) return { state: "unknown", voltage: null };
  let state: BatteryState;
  if (v > 13.0) state = "charging";
  else if (v >= 12.2) state = "healthy";
  else if (v >= 11.8) state = "low";
  else state = "critical";
  return { state, voltage: v };
}

/** True for states a fleet manager should act on. */
export function isWeakBattery(state: BatteryState): boolean {
  return state === "low" || state === "critical";
}

export const BATTERY_LABEL_KEY: Record<BatteryState, TranslationKey> = {
  charging: "batteryCharging",
  healthy: "batteryHealthy",
  low: "batteryLow",
  critical: "batteryCritical",
  unknown: "batteryUnknown",
};

/** Translucent-idiom chip classes per battery state (dark-theme safe). */
export const BATTERY_CHIP_CLASS: Record<BatteryState, string> = {
  charging: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  healthy: "bg-green-500/10 text-green-300 border-green-500/20",
  low: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  critical: "bg-red-500/10 text-red-300 border-red-500/20",
  unknown: "bg-muted text-muted-foreground border-border",
};

// ── Movement ───────────────────────────────────────────────────────────────

/**
 * Driving vs parked, derived from GPS speed (km/h).
 *
 * Deliberately NOT based on the Teltonika `movement` flag — that's an
 * accelerometer signal that trips on engine idle / vibration and reads
 * "moving" for ~70% of pings even on a car that's sitting still. GPS speed
 * tracks actual travel. A 3 km/h floor absorbs stationary GPS jitter.
 */
export function drivingState(speedKmh: number | null | undefined): "moving" | "parked" | null {
  if (speedKmh == null) return null;
  return speedKmh > 3 ? "moving" : "parked";
}

// ── GPS fix quality (satellite count) ──────────────────────────────────────

export type GpsQuality = "strong" | "good" | "weak" | "none";

export function gpsQuality(satellites: number | null | undefined): GpsQuality | null {
  if (satellites == null) return null;
  if (satellites >= 10) return "strong";
  if (satellites >= 5) return "good";
  if (satellites >= 1) return "weak";
  return "none";
}

export const GPS_LABEL_KEY: Record<GpsQuality, TranslationKey> = {
  strong: "gpsStrong",
  good: "gpsGood",
  weak: "gpsWeak",
  none: "gpsNone",
};

// ── Cellular signal (Teltonika GSM level 0–5) ──────────────────────────────

export type SignalQuality = "excellent" | "good" | "fair" | "poor" | "none";

export function gsmSignalQuality(level: number | null | undefined): SignalQuality | null {
  if (level == null) return null;
  if (level >= 5) return "excellent";
  if (level >= 4) return "good";
  if (level >= 2) return "fair";
  if (level >= 1) return "poor";
  return "none";
}

export const SIGNAL_LABEL_KEY: Record<SignalQuality, TranslationKey> = {
  excellent: "sigExcellent",
  good: "sigGood",
  fair: "sigFair",
  poor: "sigPoor",
  none: "sigNone",
};

// ── Heading ────────────────────────────────────────────────────────────────

/** 8-point compass direction from a heading angle in degrees (0 = North). */
export function headingToCompass(angle: number | null | undefined): string | null {
  if (angle == null) return null;
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round((((angle % 360) + 360) % 360) / 45) % 8];
}

// ── Cellular carrier (MCC+MNC → name, Malaysia focus) ──────────────────────

const MY_CARRIERS: Record<string, string> = {
  "10": "TM",
  "12": "Maxis",
  "13": "Celcom",
  "16": "DiGi",
  "18": "U Mobile",
  "19": "Celcom",
  "152": "Yes",
  "153": "unifi Mobile",
};

/** Maps a GSM operator code (e.g. "50219") to a carrier name. */
export function gsmOperatorName(code: string | number | null | undefined): string | null {
  if (code == null) return null;
  const s = String(code).trim();
  if (!s) return null;
  if (!s.startsWith("502")) return s; // not Malaysia — show the raw code
  const mnc = s.slice(3);
  return MY_CARRIERS[mnc] ? `${MY_CARRIERS[mnc]} (MY)` : "Malaysia";
}

// ── Fuel level (OBD PID 0x2F) ───────────────────────────────────────────────

export type FuelState = "ok" | "low" | "critical" | "unknown";

export interface FuelLevel {
  state: FuelState;
  /** Clamped 0–100 percent, or null if no reading. */
  percent: number | null;
}

/**
 * Derives fuel level + a low-fuel warning state from the OBD fuel percentage.
 * The device occasionally reports slightly above 100 (seen up to ~103), so the
 * percentage is clamped for display. Thresholds tuned for a fleet refuel cue:
 *   < 8%   critical  (refuel now)
 *   8–15%  low       (refuel soon)
 *   ≥ 15%  ok
 */
export function deriveFuelLevel(fuelLevelObd: number | null | undefined): FuelLevel {
  if (fuelLevelObd == null) return { state: "unknown", percent: null };
  const percent = Math.min(100, Math.max(0, fuelLevelObd));
  let state: FuelState;
  if (percent < 8) state = "critical";
  else if (percent < 15) state = "low";
  else state = "ok";
  return { state, percent };
}

/** True for fuel states a fleet manager should act on. */
export function isLowFuel(state: FuelState): boolean {
  return state === "low" || state === "critical";
}

export const FUEL_LABEL_KEY: Record<FuelState, TranslationKey> = {
  ok: "fuelOk",
  low: "fuelLow",
  critical: "fuelCritical",
  unknown: "batteryUnknown",
};

export const FUEL_CHIP_CLASS: Record<FuelState, string> = {
  ok: "bg-green-500/10 text-green-300 border-green-500/20",
  low: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  critical: "bg-red-500/10 text-red-300 border-red-500/20",
  unknown: "bg-muted text-muted-foreground border-border",
};

// ── Engine coolant temperature (OBD PID 0x05) ───────────────────────────────

export type CoolantState = "warming" | "normal" | "hot" | "critical" | "unknown";

export interface CoolantTemp {
  state: CoolantState;
  /** Temperature in °C, or null if no reading. */
  celsius: number | null;
}

/**
 * Derives coolant temperature + an overheat state. A petrol engine's normal
 * operating band sits ~80–105°C; below that it is still warming up, above it
 * is running hot. Thresholds:
 *   < 70    warming   (not yet at temperature)
 *   70–104  normal
 *   105–110 hot       (watch it)
 *   > 110   critical  (overheating)
 */
export function deriveCoolantTemp(coolant: number | null | undefined): CoolantTemp {
  if (coolant == null) return { state: "unknown", celsius: null };
  let state: CoolantState;
  if (coolant < 70) state = "warming";
  else if (coolant <= 104) state = "normal";
  else if (coolant <= 110) state = "hot";
  else state = "critical";
  return { state, celsius: coolant };
}

/** True for coolant states a fleet manager should act on. */
export function isOverheating(state: CoolantState): boolean {
  return state === "hot" || state === "critical";
}

export const COOLANT_LABEL_KEY: Record<CoolantState, TranslationKey> = {
  warming: "coolantWarming",
  normal: "coolantNormal",
  hot: "coolantHot",
  critical: "coolantCritical",
  unknown: "batteryUnknown",
};

export const COOLANT_CHIP_CLASS: Record<CoolantState, string> = {
  warming: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  normal: "bg-green-500/10 text-green-300 border-green-500/20",
  hot: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  critical: "bg-red-500/10 text-red-300 border-red-500/20",
  unknown: "bg-muted text-muted-foreground border-border",
};
