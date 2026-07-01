"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export interface DonutDatum {
  name: string;
  value: number;
  colorVar: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  centerLabel?: string;
  ariaLabel: string;
}

const STROKE = 22;
const GAP = 3;

export function DonutChart({ data, size = 220, centerLabel = "Total", ariaLabel }: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    const arcLengths = data.map((d) => (d.value / total) * circumference);
    return data.map((d, i) => {
      const arcLength = arcLengths[i];
      const visible = Math.max(0, arcLength - GAP);
      const offset = arcLengths.slice(0, i).reduce((sum, len) => sum + len, 0);
      return {
        ...d,
        dasharray: `${visible} ${circumference - visible}`,
        dashoffset: -offset,
        share: d.value / total,
      };
    });
  }, [data, total, circumference]);

  const activeDatum = hover !== null ? data[hover] : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={ariaLabel}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-hairline)"
            strokeWidth={STROKE}
          />
          {segments.map((seg, i) => (
            <circle
              key={seg.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`var(${seg.colorVar})`}
              strokeWidth={hover === i ? STROKE + 4 : STROKE}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              strokeLinecap="butt"
              style={{ transition: "stroke-width 200ms ease" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {activeDatum ? (
            <>
              <span className="font-tabular text-xl font-semibold text-parchment">
                {formatCurrency(activeDatum.value, { compact: true })}
              </span>
              <span className="max-w-[9ch] text-[11px] leading-tight text-muted">
                {activeDatum.name}
              </span>
            </>
          ) : (
            <>
              <span className="font-tabular text-xl font-semibold text-parchment">
                {formatCurrency(total, { compact: true })}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-muted">
                {centerLabel}
              </span>
            </>
          )}
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2.5">
        {data.map((d, i) => (
          <li
            key={d.name}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-2 py-1.5 transition-colors duration-150"
            style={{
              backgroundColor: hover === i ? "var(--color-ink-3)" : "transparent",
            }}
          >
            <span className="flex items-center gap-2.5 text-sm text-parchment-dim">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `var(${d.colorVar})` }}
              />
              {d.name}
            </span>
            <span className="font-tabular text-sm text-parchment">
              {formatCurrency(d.value, { compact: true })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
