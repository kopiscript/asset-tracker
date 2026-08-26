"use client";

import { useState } from "react";

export interface ActivityPoint {
  /** Short axis label, e.g. "14:00" */
  label: string;
  value: number;
}

/**
 * Single-series area chart with a hover crosshair + tooltip. No charting
 * library — plots an SVG path against a viewBox and scales on render.
 */
export function ActivityChart({
  points,
  unit,
}: {
  points: ActivityPoint[];
  unit: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 560;
  const height = 140;
  const padY = 12;
  const max = Math.max(1, ...points.map((p) => p.value));

  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : 0;
    const y = padY + (height - padY * 2) * (1 - p.value / max);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${height} L 0 ${height} Z`;

  const active = hover != null ? coords[hover] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = points.length > 1 ? Math.round(relX / stepX) : 0;
    setHover(Math.min(Math.max(idx, 0), points.length - 1));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[110px] overflow-visible"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive gridlines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={height * f}
            y2={height * f}
            className="stroke-border/40"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill="url(#activityFill)" />
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={0}
              y2={height}
              className="stroke-border"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={active.x} cy={active.y} r={4} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
          </>
        )}
      </svg>

      {active && (
        <div
          className="absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: `${(active.x / width) * 100}%` }}
        >
          <p className="text-[10px] text-muted-foreground leading-none mb-1">{active.label}</p>
          <p className="text-xs font-semibold text-foreground leading-none tabular-nums">
            {active.value} {unit}
          </p>
        </div>
      )}
    </div>
  );
}
