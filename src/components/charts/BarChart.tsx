"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface BarSeries {
  label: string;
  income: number;
  expenses: number;
}

interface BarChartProps {
  data: BarSeries[];
  height?: number;
  ariaLabel: string;
}

const WIDTH = 640;
const BAR_WIDTH = 16;
const BAR_GAP = 2;

export function BarChart({ data, height = 220, ariaLabel }: BarChartProps) {
  const [hover, setHover] = useState<{ i: number; series: "income" | "expenses" } | null>(
    null
  );

  const max = useMemo(
    () => Math.max(...data.flatMap((d) => [d.income, d.expenses])) * 1.15,
    [data]
  );

  const groupWidth = WIDTH / data.length;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-5 text-xs text-parchment-dim">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-chart-2)" }} />
          Income
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--color-chart-4)" }} />
          Expenses
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={ariaLabel}
      >
        <line x1={0} x2={WIDTH} y1={height} y2={height} stroke="var(--color-hairline-strong)" strokeWidth={1} />
        {data.map((d, i) => {
          const groupCenter = groupWidth * i + groupWidth / 2;
          const incomeH = (d.income / max) * (height - 8);
          const expensesH = (d.expenses / max) * (height - 8);
          const incomeX = groupCenter - BAR_WIDTH - BAR_GAP / 2;
          const expensesX = groupCenter + BAR_GAP / 2;

          return (
            <g key={d.label}>
              <rect
                x={incomeX}
                y={height - incomeH}
                width={BAR_WIDTH}
                height={incomeH}
                rx={4}
                fill="var(--color-chart-2)"
                opacity={hover && hover.i === i && hover.series !== "income" ? 0.5 : 1}
                onMouseEnter={() => setHover({ i, series: "income" })}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />
              <rect
                x={expensesX}
                y={height - expensesH}
                width={BAR_WIDTH}
                height={expensesH}
                rx={4}
                fill="var(--color-chart-4)"
                opacity={hover && hover.i === i && hover.series !== "expenses" ? 0.5 : 1}
                onMouseEnter={() => setHover({ i, series: "expenses" })}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />
              <text
                x={groupCenter}
                y={height + 20}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: 12 }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hover && (
        <p className="mt-1 text-center text-xs text-parchment-dim">
          {data[hover.i].label} —{" "}
          <span className="font-tabular text-parchment">
            {formatCurrency(hover.series === "income" ? data[hover.i].income : data[hover.i].expenses)}
          </span>{" "}
          {hover.series}
        </p>
      )}
    </div>
  );
}
