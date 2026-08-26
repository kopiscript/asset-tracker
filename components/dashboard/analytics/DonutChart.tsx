"use client";

export interface DonutSegment {
  value: number;
  colorClass: string; // stroke-* tailwind class
  label: string;
}

/**
 * Small ring chart built from stacked SVG arcs. No charting library —
 * segments are plotted as stroke-dasharray offsets around a circle.
 */
export function DonutChart({
  segments,
  size = 96,
  strokeWidth = 12,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue: React.ReactNode;
  centerLabel: React.ReactNode;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 ? Math.min(3, circumference * 0.01) : 0;

  const visibleSegments = segments.filter((s) => s.value > 0);
  const arcs = visibleSegments.map((s, i) => {
    const precedingLength = visibleSegments
      .slice(0, i)
      .reduce((sum, prev) => sum + (total > 0 ? prev.value / total : 0) * circumference, 0);
    const fraction = total > 0 ? s.value / total : 0;
    const length = Math.max(fraction * circumference - gap, 0);
    return (
      <circle
        key={s.label}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={s.colorClass}
        strokeDasharray={`${length} ${circumference - length}`}
        strokeDashoffset={-precedingLength}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    );
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border/50"
        />
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-foreground leading-none">
          {centerValue}
        </span>
        <span className="text-[10px] text-muted-foreground mt-1 leading-none text-center px-2">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
