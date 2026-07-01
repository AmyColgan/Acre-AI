import { round } from "@/lib/noise";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * A benchmark disc — the brass survey markers set in bedrock to fix a
 * fixed point of reference. Used here as Acre's mark: the whole product
 * is that same idea, a fixed point you can always return to.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Acre"
    >
      <circle cx={50} cy={50} r={47} fill="none" stroke="currentColor" strokeWidth={1.5} />
      {ticks.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const inner = deg % 90 === 0 ? 38 : 42;
        const x1 = round(50 + inner * Math.cos(rad), 3);
        const y1 = round(50 + inner * Math.sin(rad), 3);
        const x2 = round(50 + 47 * Math.cos(rad), 3);
        const y2 = round(50 + 47 * Math.sin(rad), 3);
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={deg % 90 === 0 ? 1.5 : 1}
          />
        );
      })}
      <circle cx={50} cy={50} r={30} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} />
      <path
        d="M 50 32 L 65 62 L 35 62 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <circle cx={50} cy={51} r={2.6} fill="currentColor" />
    </svg>
  );
}
