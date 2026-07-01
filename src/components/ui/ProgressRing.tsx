"use client";

import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  progress,
  size = 96,
  stroke = 6,
  color = "var(--color-brass)",
  label,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - clamped) }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-lg font-semibold text-parchment">
          {Math.round(clamped * 100)}%
        </span>
        {label && (
          <span className="text-[10px] uppercase tracking-wide text-muted">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
