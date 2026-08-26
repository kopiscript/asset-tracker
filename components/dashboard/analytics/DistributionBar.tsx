"use client";

export interface DistributionSegment {
  value: number;
  label: string;
  barClass: string; // bg-* tailwind class
  dotClass: string; // bg-* tailwind class (solid, for legend dot)
}

/**
 * Horizontal stacked distribution bar with a legend row underneath.
 * Segments with zero value are omitted from both the bar and the legend.
 */
export function DistributionBar({ segments }: { segments: DistributionSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary/60 gap-[2px]">
        {total === 0 ? (
          <div className="w-full h-full" />
        ) : (
          visible.map((s) => (
            <div
              key={s.label}
              className={`h-full ${s.barClass} first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {visible.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${s.dotClass}`} />
            <span className="text-xs text-muted-foreground">
              {s.label} <span className="text-foreground font-medium tabular-nums">{s.value}</span>
            </span>
          </div>
        ))}
        {visible.length === 0 && (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}
