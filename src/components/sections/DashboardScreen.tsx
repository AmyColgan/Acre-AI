"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenFrame } from "@/components/ui/ScreenFrame";
import { StatTile } from "@/components/ui/StatTile";
import { Tabs } from "@/components/ui/Tabs";
import { Reveal } from "@/components/ui/Reveal";
import { LineChart } from "@/components/charts/LineChart";
import {
  netWorthSeries,
  dashboardStats,
  upcomingBills,
  type Range,
} from "@/lib/data";
import { formatCurrency, formatSigned } from "@/lib/utils";

const RANGES: readonly Range[] = ["1M", "6M", "1Y", "5Y"];

export function DashboardScreen() {
  const [range, setRange] = useState<Range>("1Y");
  const series = netWorthSeries(range);

  return (
    <section id="dashboard" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="01 · Dashboard"
          title="Every account in one plot, so the total finally means something."
          description="Income, spending, savings, investments and what you owe roll into a single ledger overnight. The number on screen this morning is the same one you'd get doing it by hand, just faster."
        />

        <Reveal delay={0.1} className="mt-14">
          <ScreenFrame
            title="Overview"
            subtitle="Updated moments ago"
            actions={<Tabs options={RANGES} value={range} onChange={setRange} />}
          >
            <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <span className="coord-label text-muted">
                      Net worth
                    </span>
                    <div className="mt-1 flex items-baseline gap-3">
                      <span className="font-tabular text-3xl font-semibold text-parchment sm:text-4xl">
                        {formatCurrency(dashboardStats.netWorth)}
                      </span>
                      <span className="text-sm font-medium text-emerald-bright">
                        {formatSigned(dashboardStats.netWorthDelta, { percent: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <LineChart
                    data={series}
                    color="var(--color-brass-bright)"
                    formatValue={(v) => formatCurrency(v)}
                    ariaLabel="Net worth over time"
                  />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <StatTile
                    label="Monthly income"
                    value={formatCurrency(dashboardStats.income)}
                    delta="Consistent"
                    deltaTone="neutral"
                  />
                  <StatTile
                    label="Monthly expenses"
                    value={formatCurrency(dashboardStats.expenses)}
                    delta="−4.2% vs. avg"
                    deltaTone="positive"
                  />
                  <StatTile
                    label="Savings rate"
                    value={`${(dashboardStats.savingsRate * 100).toFixed(0)}%`}
                    delta="Above target"
                    deltaTone="positive"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="coord-label text-muted">
                      Upcoming bills
                    </span>
                    <span className="text-xs text-muted">Next 14 days</span>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {upcomingBills.map((bill) => (
                      <li
                        key={bill.name}
                        className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-ink px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-parchment">{bill.name}</p>
                          <p className="text-xs text-muted">Due {bill.due}</p>
                        </div>
                        <span className="font-tabular shrink-0 text-sm text-parchment-dim">
                          {formatCurrency(bill.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto rounded-lg border border-hairline bg-ink px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="coord-label text-muted">
                      Financial health
                    </span>
                    <a
                      href="#health"
                      className="text-xs text-brass-bright transition-colors hover:text-brass"
                    >
                      View breakdown →
                    </a>
                  </div>
                  <span className="mt-1.5 block font-tabular text-2xl font-semibold text-emerald-bright">
                    {dashboardStats.healthScore} / 100
                  </span>
                </div>
              </div>
            </div>
          </ScreenFrame>
        </Reveal>
      </div>
    </section>
  );
}
