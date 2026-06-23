import { cn } from "@/lib/utils";

/**
 * A 270° arc gauge (gap at the bottom). Pure presentational SVG — no hooks, no
 * deps — safe to render from server or client components.
 *
 * The value arc is drawn with stroke-dasharray on a circle rotated so the
 * sweep runs from bottom-left, clockwise, to bottom-right. Colour is driven by
 * `colorClass` (a Tailwind text-* class) via `stroke="currentColor"`, so it
 * inherits the dark-theme palette and animates smoothly on poll updates.
 */
const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;
const SWEEP = 0.75; // 270° of the full circle
const ARC_LEN = CIRCUMFERENCE * SWEEP;

export interface GaugeProps {
  value: number | null;
  min: number;
  max: number;
  /** Pre-formatted centre text (e.g. "47", "88", "—"). */
  valueText: string;
  unit?: string;
  label: string;
  icon?: React.ReactNode;
  /** Tailwind text-* class for the value arc and centre number. */
  colorClass?: string;
  /** Optional alert chip rendered beneath the label. */
  chip?: React.ReactNode;
}

export function Gauge({
  value,
  min,
  max,
  valueText,
  unit,
  label,
  icon,
  colorClass = "text-primary",
  chip,
}: GaugeProps) {
  const fraction =
    value == null ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const valueArc = ARC_LEN * fraction;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-28 w-28 sm:h-32 sm:w-32">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted-foreground/15"
            stroke="currentColor"
            strokeDasharray={`${ARC_LEN} ${CIRCUMFERENCE}`}
            transform="rotate(135 50 50)"
          />
          {/* Value */}
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn("transition-[stroke-dasharray] duration-700 ease-out", colorClass)}
            stroke="currentColor"
            strokeDasharray={`${valueArc} ${CIRCUMFERENCE}`}
            transform="rotate(135 50 50)"
          />
        </svg>
        {/* Centre readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <span className="text-muted-foreground mb-0.5">{icon}</span>}
          <div className="flex items-baseline gap-0.5">
            <span className={cn("text-2xl font-semibold tabular-nums", colorClass)}>
              {valueText}
            </span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
        </div>
      </div>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      {chip && <div className="mt-1.5">{chip}</div>}
    </div>
  );
}
