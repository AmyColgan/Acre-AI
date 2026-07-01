import { mulberry32, round } from "@/lib/noise";

interface TopographyProps {
  seed?: number;
  peakCount?: number;
  ringsPerPeak?: number;
  width?: number;
  height?: number;
  className?: string;
  strokeOpacity?: number;
  markPoints?: boolean;
}

interface Harmonic {
  k: number;
  amp: number;
  phase: number;
}

function buildRing(
  cx: number,
  cy: number,
  radius: number,
  harmonics: Harmonic[],
  steps = 96
) {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    let r = radius;
    for (const h of harmonics) {
      r += h.amp * Math.sin(h.k * theta + h.phase);
    }
    const x = round(cx + r * Math.cos(theta), 2);
    const y = round(cy + r * Math.sin(theta) * 0.62, 2); // flattened, map-like perspective
    pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  return pts.join(" ") + " Z";
}

/**
 * Generative contour map, seeded so it renders identically on server
 * and client. Stands in for photography: every peak, ring and
 * benchmark point is computed, not sourced.
 */
export function Topography({
  seed = 1,
  peakCount = 3,
  ringsPerPeak = 9,
  width = 1200,
  height = 520,
  className,
  strokeOpacity = 0.16,
  markPoints = true,
}: TopographyProps) {
  const rand = mulberry32(seed);
  const margin = 0.16;

  const peaks = Array.from({ length: peakCount }, () => {
    const cx = width * (margin + rand() * (1 - margin * 2));
    const cy = height * (margin + rand() * (1 - margin * 2));
    const ringGap = 14 + rand() * 10;
    const harmonics: Harmonic[] = [
      { k: 2, amp: ringGap * (0.15 + rand() * 0.2), phase: rand() * Math.PI * 2 },
      { k: 3, amp: ringGap * (0.08 + rand() * 0.14), phase: rand() * Math.PI * 2 },
      { k: 5, amp: ringGap * (0.04 + rand() * 0.06), phase: rand() * Math.PI * 2 },
    ];
    return { cx, cy, ringGap, harmonics };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
    >
      {peaks.map((peak, pi) => (
        <g key={pi}>
          {Array.from({ length: ringsPerPeak }, (_, ri) => {
            const radius = peak.ringGap * (ri + 1);
            return (
              <path
                key={ri}
                d={buildRing(peak.cx, peak.cy, radius, peak.harmonics)}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                strokeOpacity={strokeOpacity * (1 - ri / (ringsPerPeak * 1.6))}
              />
            );
          })}
          {markPoints && (
            <g stroke="currentColor" strokeOpacity={strokeOpacity + 0.25}>
              <line
                x1={peak.cx - 6}
                y1={peak.cy}
                x2={peak.cx + 6}
                y2={peak.cy}
                strokeWidth={1}
              />
              <line
                x1={peak.cx}
                y1={peak.cy - 6}
                x2={peak.cx}
                y2={peak.cy + 6}
                strokeWidth={1}
              />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
