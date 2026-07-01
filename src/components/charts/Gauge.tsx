"use client";

import { motion } from "framer-motion";

interface GaugeProps {
  value: number; // 0-100
  size?: number;
  label?: string;
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy + r * Math.sin(rad)) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function severityColor(value: number) {
  if (value >= 80) return "var(--color-emerald-bright)";
  if (value >= 60) return "var(--color-brass-bright)";
  return "var(--color-rust-bright)";
}

function severityLabel(value: number) {
  if (value >= 80) return "Strong";
  if (value >= 60) return "Stable";
  return "Needs attention";
}

export function Gauge({ value, size = 220, label = "Financial health" }: GaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 24;
  const endAngle = (clamped / 100) * 180;
  const color = severityColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 40} viewBox={`0 0 ${size} ${size / 2 + 40}`}>
        <path
          d={describeArc(cx, cy, r, 0, 180)}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <motion.path
          d={describeArc(cx, cy, r, 0, Math.max(0.001, endAngle))}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="fill-parchment font-tabular"
          style={{ fontSize: 40, fontWeight: 600 }}
        >
          {Math.round(clamped)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-muted"
          style={{ fontSize: 12, letterSpacing: "0.05em" }}
        >
          OUT OF 100
        </text>
      </svg>
      <div className="-mt-2 flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-medium text-parchment">{label}</span>
        <span className="text-xs" style={{ color }}>
          {severityLabel(clamped)}
        </span>
      </div>
    </div>
  );
}
