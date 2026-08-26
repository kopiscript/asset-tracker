/**
 * components/auth/AuthMapBackdrop.tsx
 * Decorative low-opacity "map" motif for the auth brand panel — a coordinate
 * grid, a few winding route lines, and pin markers, rendered as static SVG
 * (no tile fetch, no client JS). Sits absolutely behind the panel content.
 */
export function AuthMapBackdrop() {
  return (
    <svg
      viewBox="0 0 480 800"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Coordinate grid */}
      <g stroke="#ffffff" strokeWidth="1" opacity="0.06">
        {Array.from({ length: 13 }, (_, i) => i * 40).map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="800" />
        ))}
        {Array.from({ length: 21 }, (_, i) => i * 40).map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} />
        ))}
      </g>

      {/* Route lines */}
      <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -20 620 C 80 600, 120 520, 90 440 S 40 300, 140 260 S 300 240, 320 140 S 260 20, 340 -20"
              strokeWidth="3" opacity="0.16" />
        <path d="M -20 120 C 60 140, 90 200, 180 210 S 300 180, 340 260 S 320 400, 420 440 S 500 480, 500 560"
              strokeWidth="2" opacity="0.12" />
        <path d="M 60 -20 C 40 60, 100 90, 90 170 S 10 260, 40 360 S 160 420, 150 520 S 60 620, 100 720"
              strokeWidth="2" opacity="0.09" />
      </g>

      {/* Pin markers */}
      <g>
        {[
          { cx: 90, cy: 440, r: 5, ring: true },
          { cx: 320, cy: 140, r: 4 },
          { cx: 180, cy: 210, r: 4 },
          { cx: 340, cy: 260, r: 5, ring: true },
          { cx: 100, cy: 720, r: 4 },
          { cx: 420, cy: 440, r: 4 },
        ].map((p, i) => (
          <g key={i}>
            {p.ring && (
              <circle cx={p.cx} cy={p.cy} r={p.r + 8} fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.18" />
            )}
            <circle cx={p.cx} cy={p.cy} r={p.r} fill="#ffffff" opacity="0.28" />
          </g>
        ))}
      </g>
    </svg>
  );
}
