"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

export interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  areaFill?: boolean;
  ariaLabel: string;
}

const WIDTH = 640;

export function LineChart({
  data,
  color = "var(--color-brass)",
  height = 220,
  formatValue = (v) => v.toLocaleString(),
  areaFill = true,
  ariaLabel,
}: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { points } = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.12 || max * 0.1 || 1;
    const lo = min - pad;
    const hi = max + pad;
    const stepX = data.length > 1 ? WIDTH / (data.length - 1) : 0;
    const points = data.map((d, i) => {
      const x = i * stepX;
      const y = height - ((d.value - lo) / (hi - lo)) * height;
      return { x, y, ...d };
    });
    return { points, min, max };
  }, [data, height]);

  const linePath = useMemo(
    () => points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "),
    [points]
  );

  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x} ${height} ${points
      .map((p) => `L ${p.x} ${p.y}`)
      .join(" ")} L ${last.x} ${height} Z`;
  }, [points, height]);

  const gridLines = 4;

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, idx)));
  };

  const active = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  return (
    <div className="relative w-full select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="none"
        className="w-full touch-none"
        style={{ height }}
        role="img"
        aria-label={ariaLabel}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        {Array.from({ length: gridLines }).map((_, i) => {
          const y = (height / (gridLines - 1)) * i;
          return (
            <line
              key={i}
              x1={0}
              x2={WIDTH}
              y1={y}
              y2={y}
              stroke="var(--color-hairline)"
              strokeWidth={1}
            />
          );
        })}

        {areaFill && (
          <>
            <defs>
              <linearGradient id="lineFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#lineFade)" />
          </>
        )}

        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {hoverIndex !== null && (
          <line
            x1={points[hoverIndex].x}
            x2={points[hoverIndex].x}
            y1={0}
            y2={height}
            stroke="var(--color-hairline-strong)"
            strokeWidth={1}
          />
        )}

        <circle
          cx={active.x}
          cy={active.y}
          r={5}
          fill={color}
          stroke="var(--color-ink-2)"
          strokeWidth={2}
        />
      </svg>

      <div className="pointer-events-none absolute left-0 top-0 flex w-full justify-between px-0.5 text-[11px] text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-hairline-strong bg-ink px-3 py-2 text-xs shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)]"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            top: `${(active.y / height) * 100}%`,
            marginTop: -10,
          }}
        >
          <div className="font-tabular font-semibold text-parchment">
            {formatValue(active.value)}
          </div>
          <div className="text-muted">{active.label}</div>
        </div>
      )}
    </div>
  );
}
