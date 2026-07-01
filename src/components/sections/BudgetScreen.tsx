"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenFrame } from "@/components/ui/ScreenFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Tabs } from "@/components/ui/Tabs";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { budgetCategories, budgetTotal, cashFlowMonths, dashboardStats } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

const VIEWS = ["Categories", "Cash flow"] as const;
type View = (typeof VIEWS)[number];

export function BudgetScreen() {
  const [view, setView] = useState<View>("Categories");

  return (
    <section id="budget" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeading
          eyebrow="04 · Budget"
          title="Spending, sorted before you'd have gotten around to it."
          description="Every transaction lands in a category on its own. The moment one starts drifting from its usual pace, Acre flags it, while it's still one odd week and not a habit."
        />

        <Reveal delay={0.1} className="mt-14">
          <ScreenFrame
            title={view === "Categories" ? "Spending by category" : "Income vs. expenses"}
            subtitle="This month"
            actions={<Tabs options={VIEWS} value={view} onChange={setView} />}
          >
            {view === "Categories" ? (
              <div>
                <DonutChart
                  data={budgetCategories}
                  centerLabel="Spent"
                  ariaLabel="Spending broken down by category"
                />
                <p className="mt-6 text-sm text-parchment-dim">
                  Total tracked spend of{" "}
                  <span className="font-tabular text-parchment">
                    {formatCurrency(budgetTotal)}
                  </span>{" "}
                  against a monthly income of{" "}
                  <span className="font-tabular text-parchment">
                    {formatCurrency(dashboardStats.income)}
                  </span>
                  .
                </p>
              </div>
            ) : (
              <BarChart data={cashFlowMonths} ariaLabel="Income versus expenses by month" />
            )}
          </ScreenFrame>
        </Reveal>
      </div>
    </section>
  );
}
