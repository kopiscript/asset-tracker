/**
 * components/FuelBar.tsx
 * Progress bar that shows fuel level with colour-coded fill:
 *   > 50% → green
 *   20–50% → yellow
 *   < 20% → red
 */

interface FuelBarProps {
  level: number | null | undefined;
}

export function FuelBar({ level }: FuelBarProps) {
  if (level == null)
    return <span className="text-xs text-muted-foreground">—</span>;

  const pct = Math.min(100, Math.max(0, level));
  const colour =
    pct > 50
      ? "bg-green-500"
      : pct > 20
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}
