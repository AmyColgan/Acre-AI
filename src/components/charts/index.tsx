"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtMoney } from "@/lib/format";

/** Validated categorical palette (dark surface #0c1228, adjacent CVD ΔE 33.6). */
export const SERIES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const GRID = "rgba(148, 163, 210, 0.10)";
const AXIS_TEXT = "#5d6785";
const SURFACE = "#0c1228";

const axisProps = {
  stroke: "transparent",
  tick: { fill: AXIS_TEXT, fontSize: 11 },
  tickLine: false as const,
  axisLine: false as const,
};

export function moneyTick(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

/* --------------------------------- tooltip ---------------------------------- */

interface TipPayload {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function ChartTip({
  active,
  payload,
  label,
  format = (v: number) => fmtMoney(v),
  nameMap,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
  format?: (v: number) => string;
  nameMap?: Record<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-strong rounded-xl px-3.5 py-2.5 text-xs shadow-2xl">
      {label !== undefined && <div className="mb-1.5 font-medium text-fog">{label}</div>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-fog">
              {nameMap?.[String(p.dataKey ?? p.name)] ?? String(p.name ?? p.dataKey)}
            </span>
            <span className="ml-auto pl-4 font-semibold text-snow font-tabular">
              {typeof p.value === "number" ? format(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- legend ---------------------------------- */

export function LegendRow({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-[11px] text-fog">
          {it.dashed ? (
            <svg width="14" height="6" aria-hidden>
              <line x1="0" y1="3" x2="14" y2="3" stroke={it.color} strokeWidth="2" strokeDasharray="3 3" />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------- line chart -------------------------------- */

export function PulseLine({
  data,
  series,
  height = 220,
  yFormat = moneyTick,
  tipFormat,
  showLegend,
  refLineY,
  refLineLabel,
}: {
  data: Array<Record<string, string | number | boolean>>;
  series: { key: string; label: string; color?: string; dashed?: boolean }[];
  height?: number;
  yFormat?: (v: number) => string;
  tipFormat?: (v: number) => string;
  showLegend?: boolean;
  refLineY?: number;
  refLineLabel?: string;
}) {
  const nameMap = Object.fromEntries(series.map((s) => [s.key, s.label]));
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
          <YAxis {...axisProps} tickFormatter={yFormat} width={46} />
          <Tooltip content={<ChartTip format={tipFormat} nameMap={nameMap} />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
          {refLineY !== undefined && (
            <ReferenceLine
              y={refLineY}
              stroke={AXIS_TEXT}
              strokeWidth={1}
              label={{ value: refLineLabel, fill: AXIS_TEXT, fontSize: 10, position: "insideTopRight" }}
            />
          )}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color ?? SERIES[i % SERIES.length]}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "4 4" : undefined}
              dot={false}
              activeDot={{ r: 4.5, strokeWidth: 2, stroke: SURFACE }}
              isAnimationActive
              animationDuration={800}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {(showLegend ?? series.length > 1) && (
        <LegendRow
          items={series.map((s, i) => ({
            label: s.label,
            color: s.color ?? SERIES[i % SERIES.length],
            dashed: s.dashed,
          }))}
        />
      )}
    </div>
  );
}

/* -------------------------------- area chart -------------------------------- */

export function PulseArea({
  data,
  dataKey,
  label,
  color = SERIES[0],
  height = 220,
  yFormat = moneyTick,
  tipFormat,
  xKey = "label",
  refLineY,
  refLineLabel,
}: {
  data: Array<Record<string, string | number | boolean>>;
  dataKey: string;
  label: string;
  color?: string;
  height?: number;
  yFormat?: (v: number) => string;
  tipFormat?: (v: number) => string;
  xKey?: string;
  refLineY?: number;
  refLineLabel?: string;
}) {
  const gid = `grad-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} tickFormatter={yFormat} width={46} />
        <Tooltip
          content={<ChartTip format={tipFormat} nameMap={{ [dataKey]: label }} />}
          cursor={{ stroke: GRID, strokeWidth: 1 }}
        />
        {refLineY !== undefined && (
          <ReferenceLine
            y={refLineY}
            stroke={AXIS_TEXT}
            strokeWidth={1}
            label={{ value: refLineLabel, fill: AXIS_TEXT, fontSize: 10, position: "insideTopRight" }}
          />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gid})`}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: SURFACE }}
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* --------------------------------- bar chart -------------------------------- */

export function PulseBars({
  data,
  series,
  height = 220,
  yFormat = moneyTick,
  tipFormat,
  showLegend,
  colorByPoint = false,
  stacked = false,
}: {
  data: Array<Record<string, string | number | boolean>>;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  yFormat?: (v: number) => string;
  tipFormat?: (v: number) => string;
  showLegend?: boolean;
  /** when a single series represents distinct entities (e.g. scenario comparison) */
  colorByPoint?: boolean;
  stacked?: boolean;
}) {
  const nameMap = Object.fromEntries(series.map((s) => [s.key, s.label]));
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barGap={4}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval={0} />
          <YAxis {...axisProps} tickFormatter={yFormat} width={46} />
          <Tooltip
            content={<ChartTip format={tipFormat} nameMap={nameMap} />}
            cursor={{ fill: "rgba(148,163,210,0.06)" }}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId={stacked ? "stack" : undefined}
              fill={s.color ?? SERIES[i % SERIES.length]}
              stroke={stacked ? SURFACE : undefined}
              strokeWidth={stacked ? 1 : 0}
              radius={!stacked || i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={24}
              isAnimationActive
              animationDuration={800}
            >
              {colorByPoint &&
                data.map((_, j) => <Cell key={j} fill={SERIES[j % SERIES.length]} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      {(showLegend ?? (series.length > 1 && !colorByPoint)) && (
        <LegendRow
          items={series.map((s, i) => ({ label: s.label, color: s.color ?? SERIES[i % SERIES.length] }))}
        />
      )}
    </div>
  );
}

/* --------------------------------- pie chart -------------------------------- */

export function PulsePie({
  data,
  height = 220,
  donut = true,
  center,
  tipFormat,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  donut?: boolean;
  center?: ReactNode;
  tipFormat?: (v: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-6">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTip format={tipFormat} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={donut ? "62%" : 0}
              outerRadius="92%"
              paddingAngle={1.5}
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive
              animationDuration={800}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? SERIES[i % SERIES.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {donut && center && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {center}
          </div>
        )}
      </div>
      <div className="grid w-full flex-1 grid-cols-1 gap-1.5 self-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color ?? SERIES[i % SERIES.length] }} />
            <span className="text-fog">{d.name}</span>
            <span className="ml-auto font-medium text-snow font-tabular">
              {tipFormat ? tipFormat(d.value) : fmtMoney(d.value)}
            </span>
            <span className="w-10 text-right text-dim font-tabular">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- sparkline ----------------------------------- */

export function Sparkline({
  data,
  color = SERIES[0],
  width = 96,
  height = 30,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * (width - 4) + 2},${height - 3 - ((v - min) / range) * (height - 6)}`
    )
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={width - 2}
        cy={height - 3 - ((data[data.length - 1] - min) / range) * (height - 6)}
        r="3"
        fill={color}
        stroke={SURFACE}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ------------------------------- risk meter ---------------------------------- */

export function RiskMeter({ value, labels = ["Low", "Moderate", "High"] }: { value: number; labels?: string[] }) {
  const zone = value < 40 ? 0 : value < 70 ? 1 : 2;
  const zoneColors = ["var(--color-good)", "var(--color-warn)", "var(--color-bad)"];
  return (
    <div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-raise">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, Math.max(2, value))}%`,
            background: `linear-gradient(90deg, var(--color-good), ${zone >= 1 ? "var(--color-warn)" : "var(--color-good)"} 60%, ${zone === 2 ? "var(--color-bad)" : zone === 1 ? "var(--color-warn)" : "var(--color-good)"})`,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-dim">
        {labels.map((l, i) => (
          <span key={l} className={i === zone ? "font-semibold" : ""} style={i === zone ? { color: zoneColors[zone] } : undefined}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
