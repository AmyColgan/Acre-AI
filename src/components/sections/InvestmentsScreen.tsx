"use client";

import { useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenFrame } from "@/components/ui/ScreenFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Tabs } from "@/components/ui/Tabs";
import { LineChart } from "@/components/charts/LineChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { portfolio, portfolioSeries, holdings, type Range } from "@/lib/data";
import { cn, formatCurrency, formatSigned } from "@/lib/utils";

const RANGES: readonly Range[] = ["1M", "6M", "1Y", "5Y"];
type SortKey = "value" | "ytd";

export function InvestmentsScreen() {
  const [range, setRange] = useState<Range>("1Y");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const series = portfolioSeries(range);

  const sortedHoldings = useMemo(
    () => [...holdings].sort((a, b) => b[sortKey] - a[sortKey]),
    [sortKey]
  );

  return (
    <section id="investments" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="05 · Investments"
          title="Performance you could actually explain to someone, in one sitting."
          description="Every holding is tied to a purpose in the plan. When allocation drifts, Acre translates the drift into what it costs your timeline, in years, not basis points."
        />

        <Reveal delay={0.1} className="mt-14">
          <ScreenFrame
            title="Portfolio"
            subtitle={`${formatCurrency(portfolio.value)} · ${formatSigned(portfolio.ytdReturn, { percent: true })} YTD`}
            actions={<Tabs options={RANGES} value={range} onChange={setRange} />}
          >
            <LineChart
              data={series}
              color="var(--color-emerald-bright)"
              formatValue={(v) => formatCurrency(v)}
              ariaLabel="Portfolio value over time"
            />

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <span className="coord-label text-muted">Holdings</span>
                <div className="flex items-center gap-1 text-xs text-muted">
                  Sort by
                  {(["value", "ytd"] as SortKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSortKey(key)}
                      className={cn(
                        "rounded-full px-2.5 py-1 transition-colors duration-200",
                        sortKey === key
                          ? "bg-ink-3 text-brass-bright"
                          : "hover:text-parchment-dim"
                      )}
                    >
                      {key === "value" ? "Value" : "YTD"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-left coord-label text-muted">
                      <th className="pb-3 font-normal">Holding</th>
                      <th className="pb-3 font-normal">Weight</th>
                      <th className="pb-3 font-normal">Trend</th>
                      <th className="pb-3 text-right font-normal">YTD</th>
                      <th className="pb-3 text-right font-normal">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.map((h) => (
                      <tr key={h.ticker} className="border-b border-hairline/60">
                        <td className="py-3 pr-4">
                          <p className="text-parchment">{h.name}</p>
                          <p className="text-xs text-muted">{h.ticker}</p>
                        </td>
                        <td className="py-3 pr-4 font-tabular text-parchment-dim">
                          {(h.weight * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 pr-4">
                          <Sparkline
                            values={
                              h.ytd >= 0 ? [1, 1.3, 1.1, 1.5, 1.4, 1.8] : [1.8, 1.4, 1.5, 1.1, 1.3, 1]
                            }
                          />
                        </td>
                        <td
                          className={cn(
                            "py-3 pr-4 text-right font-tabular",
                            h.ytd >= 0 ? "text-emerald-bright" : "text-rust-bright"
                          )}
                        >
                          {formatSigned(h.ytd, { percent: true })}
                        </td>
                        <td className="py-3 text-right font-tabular text-parchment">
                          {formatCurrency(h.value, { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScreenFrame>
        </Reveal>
      </div>
    </section>
  );
}
