"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, Card, PageHead } from "@/components/ui/core";
import { PulseArea, PulseBars, PulseLine, PulsePie, SERIES } from "@/components/charts";
import { usePulse } from "@/lib/store";
import {
  getHealth,
  getTotals,
  goalMath,
  incomeExpenseSeries,
  monthsToPayoff,
  netWorthSeries,
  overspentCategories,
  portfolioGrowthSeries,
  spentByCategory,
} from "@/lib/calc";
import { fmtDate, fmtMoney } from "@/lib/format";

type ReportKey =
  | "monthly"
  | "spending"
  | "savings"
  | "debt"
  | "goals"
  | "investment"
  | "health"
  | "decisions";

const REPORTS: { key: ReportKey; label: string; icon: IconName; blurb: string }[] = [
  { key: "monthly", label: "Monthly Financial Report", icon: "fileText", blurb: "The whole month on one page" },
  { key: "spending", label: "Spending Report", icon: "wallet", blurb: "Where the money actually went" },
  { key: "savings", label: "Savings Report", icon: "bank", blurb: "Cushion, rate, and momentum" },
  { key: "debt", label: "Debt Report", icon: "unlock", blurb: "Balances, interest, payoff dates" },
  { key: "goals", label: "Goal Progress Report", icon: "target", blurb: "Every goal and its finish line" },
  { key: "investment", label: "Investment Report", icon: "chartLine", blurb: "Growth, allocation, trajectory" },
  { key: "health", label: "Financial Health Report", icon: "pulse", blurb: "The score and its seven parts" },
  { key: "decisions", label: "Decision History", icon: "scale", blurb: "Every decision Pulse scored" },
];

export default function Reports() {
  const { state } = usePulse();
  const [active, setActive] = useState<ReportKey>("monthly");

  const totals = useMemo(() => getTotals(state), [state]);
  const health = useMemo(() => getHealth(state), [state]);
  const spent = useMemo(() => spentByCategory(state), [state]);
  const over = useMemo(() => overspentCategories(state), [state]);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const body = () => {
    switch (active) {
      case "monthly":
        return (
          <ReportShell
            title={`Monthly Financial Report · ${monthName}`}
            summary={`Income ${fmtMoney(state.monthlyIncome)} against ${fmtMoney(totals.totalBudget)} of budgeted expenses left a ${fmtMoney(totals.monthlySurplus)} surplus. ${over.length > 0 ? `${over.length} categor${over.length === 1 ? "y" : "ies"} ran over plan — the leak is ${over[0].name.toLowerCase()}.` : "Every category stayed inside plan."} Net worth stands at ${fmtMoney(totals.netWorth)}.`}
            numbers={[
              { label: "Income", value: fmtMoney(state.monthlyIncome) },
              { label: "Budgeted expenses", value: fmtMoney(totals.totalBudget) },
              { label: "Surplus", value: `+${fmtMoney(totals.monthlySurplus)}` },
              { label: "Net worth", value: fmtMoney(totals.netWorth) },
            ]}
            ai={`Pulse's read: your structure is sound — the surplus covers savings (${fmtMoney(totals.savingsPlanned)}), debt (${fmtMoney(totals.debtBudget)}), and investing (${fmtMoney(totals.investContribution)}) with ${fmtMoney(Math.max(0, totals.freeBuffer))} unassigned. ${over.length > 0 ? `The variable overspend is behavioral, not structural: a weekly cap on ${over[0].name.toLowerCase()} fixes it without touching anything else.` : "Consider assigning the leftover buffer before it becomes accidental spending."}`}
            changed={over.length > 0 ? `What changed: ${over.map((c) => c.name.toLowerCase()).join(" and ")} drifted over budget on a trailing 30-day basis.` : "What changed: nothing material — transfers and bills all executed on schedule."}
            next="Next step: apply the dashboard recommendation, then re-check this report — the surplus line should widen."
          >
            <PulseBars
              data={incomeExpenseSeries(state)}
              series={[
                { key: "income", label: "Income", color: SERIES[4] },
                { key: "expenses", label: "Expenses", color: SERIES[1] },
              ]}
              height={200}
            />
          </ReportShell>
        );
      case "spending": {
        const pie = state.categories
          .map((c) => ({ name: c.name, value: Math.round(spent[c.id]) }))
          .filter((d) => d.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        const restVal = Math.round(state.categories.reduce((s, c) => s + spent[c.id], 0) - pie.reduce((s, d) => s + d.value, 0));
        if (restVal > 0) pie.push({ name: "Everything else", value: restVal });
        const total = pie.reduce((s, d) => s + d.value, 0);
        return (
          <ReportShell
            title="Spending Report · trailing 30 days"
            summary={`You spent ${fmtMoney(total)} across ${state.categories.filter((c) => spent[c.id] > 0).length} categories. ${pie[0] ? `${pie[0].name} led at ${fmtMoney(pie[0].value)} (${Math.round((pie[0].value / Math.max(1, total)) * 100)}%).` : ""}`}
            numbers={[
              { label: "Total spent", value: fmtMoney(total) },
              { label: "Variable spend", value: fmtMoney(totals.variableSpent30d) },
              { label: "Over-budget categories", value: `${over.length}` },
              { label: "Safe to spend / wk", value: fmtMoney(totals.safeToSpendWeek) },
            ]}
            ai={over.length > 0 ? `Pulse's read: ${over.map((c) => `${c.name.toLowerCase()} is ${fmtMoney(Math.round(c.overBy))} over`).join(", ")}. These are the only lines worth attention — everything else is on plan, so treat this as a trim, not an overhaul.` : "Pulse's read: clean month. Every category landed inside budget, which is exactly the condition under which raising your savings rate is painless."}
            changed="What changed: dining and shopping are pacing above their monthly norm; groceries and entertainment are under."
            next="Next step: accept the 'Lower dining spend' opportunity — it recovers the drift in one week."
          >
            <PulsePie data={pie.map((d, i) => ({ ...d, color: d.name === "Everything else" ? "#333e4d" : SERIES[i % SERIES.length] }))} height={190} />
          </ReportShell>
        );
      }
      case "savings": {
        const months = state.savingsBalance / Math.max(1, totals.totalBudget);
        return (
          <ReportShell
            title="Savings Report"
            summary={`You hold ${fmtMoney(state.savingsBalance)} in savings — ${months.toFixed(1)} months of expenses — and direct ${fmtMoney(totals.savingsPlanned)}/month to goals, a ${totals.savingsRate.toFixed(0)}% total savings rate.`}
            numbers={[
              { label: "Savings balance", value: fmtMoney(state.savingsBalance) },
              { label: "Months covered", value: months.toFixed(1) },
              { label: "Monthly to goals", value: fmtMoney(totals.savingsPlanned) },
              { label: "Savings rate", value: `${totals.savingsRate.toFixed(0)}%` },
            ]}
            ai={`Pulse's read: ${months < 3 ? "coverage is below the 3-month safety floor, so the emergency fund keeps first claim on every spare dollar." : "coverage clears the safety floor — momentum is now the goal, not triage."} A high-yield account at 4.4% APY would add ≈ ${fmtMoney(Math.round(state.savingsBalance * 0.037))}/yr without changing anything else.`}
            changed="What changed: automatic transfers executed on schedule; the balance grew by plan, not by accident."
            next="Next step: complete the 'Move $250 to emergency fund' task — it pushes coverage visibly closer to the floor."
          >
            <PulseArea
              data={netWorthSeries(state).map((p) => ({ label: p.label, value: Math.round(p.value * (state.savingsBalance / Math.max(1, totals.netWorth))) }))}
              dataKey="value"
              label="Savings (est.)"
              height={200}
              color={SERIES[1]}
            />
          </ReportShell>
        );
      }
      case "debt": {
        const rows = state.debts.map((d) => {
          const share = totals.debtBudget * (d.apr > 15 ? 0.66 : 0.34);
          return { ...d, months: monthsToPayoff(d.balance, d.apr, Math.max(d.minPayment, share)) };
        });
        return (
          <ReportShell
            title="Debt Report"
            summary={
              state.debts.length === 0
                ? "You are debt-free. This report will stay this pleasant for as long as you keep it that way."
                : `Total debt is ${fmtMoney(totals.debtTotal)} at a weighted ${totals.avgApr.toFixed(1)}% APR, serviced by ${fmtMoney(totals.debtBudget)}/month. ${rows[0] ? `At the current split, the ${rows[0].name} clears in ~${rows[0].months} months.` : ""}`
            }
            numbers={[
              { label: "Total debt", value: fmtMoney(totals.debtTotal) },
              { label: "Weighted APR", value: `${totals.avgApr.toFixed(1)}%` },
              { label: "Monthly payments", value: fmtMoney(totals.debtBudget) },
              { label: "Est. interest / mo", value: fmtMoney(Math.round(state.debts.reduce((s, d) => s + (d.balance * d.apr) / 100 / 12, 0))) },
            ]}
            ai="Pulse's read: avalanche order (highest APR first) is the mathematically correct play here — the 24.99% card costs four times more per dollar than the student loan. Keep minimums everywhere else and concentrate every extra dollar."
            changed="What changed: balances fell with this month's payments; no new debt was added."
            next="Next step: complete the 'extra $75 toward the card' task, then re-run this report to watch the payoff date move."
          >
            <PulseBars
              data={state.debts.map((d) => ({ label: d.name.split(" ")[0], balance: d.balance }))}
              series={[{ key: "balance", label: "Balance" }]}
              height={190}
              colorByPoint
            />
          </ReportShell>
        );
      }
      case "goals":
        return (
          <ReportShell
            title="Goal Progress Report"
            summary={`${state.goals.length} active goals, ${state.goals.filter((g) => goalMath(g).onTrack).length} on track. Combined monthly commitment: ${fmtMoney(state.goals.reduce((s, g) => s + g.monthlyContribution, 0))}.`}
            numbers={state.goals.slice(0, 4).map((g) => ({ label: g.name, value: `${Math.round(goalMath(g).pct)}%` }))}
            ai="Pulse's read: your emergency fund and travel fund are competing for the same surplus — the conflict detector in Goals has a one-tap fix that prioritizes safety first. Everything else is sequenced sensibly."
            changed="What changed: contributions landed on schedule; projected completion dates are holding."
            next="Next step: open Goals and apply the conflict fix, then contribute any windfall to the emergency fund."
          >
            <PulseBars
              data={state.goals.map((g) => ({ label: g.name.split(" ")[0], pct: Math.round(goalMath(g).pct) }))}
              series={[{ key: "pct", label: "Progress %" }]}
              height={190}
              colorByPoint
              yFormat={(v) => `${v}%`}
              tipFormat={(v) => `${v}% funded`}
            />
          </ReportShell>
        );
      case "investment":
        return (
          <ReportShell
            title="Investment Report"
            summary={`Portfolio value ${fmtMoney(state.portfolio.totalValue)}, up ${fmtMoney(state.portfolio.totalValue - state.portfolio.startValue)} over twelve months with ${fmtMoney(state.portfolio.monthlyContribution)}/month flowing in.`}
            numbers={[
              { label: "Portfolio value", value: fmtMoney(state.portfolio.totalValue) },
              { label: "12-mo growth", value: `+${fmtMoney(state.portfolio.totalValue - state.portfolio.startValue)}` },
              { label: "Monthly contribution", value: fmtMoney(state.portfolio.monthlyContribution) },
              { label: "Growth assets", value: `${state.portfolio.allocation.usStocks + state.portfolio.allocation.intlStocks + state.portfolio.allocation.alternatives}%` },
            ]}
            ai="Pulse's read: the allocation supports long-term growth and the contribution never misses — that consistency is the strategy. The sharpest improvement available isn't in the portfolio at all: finish the emergency fund so a bad month never forces selling."
            changed="What changed: contributions continued; allocation unchanged this month."
            next="Next step: after the credit card is cleared, roll its payment into contributions — the Opportunity Feed has the projection."
          >
            <PulseLine data={portfolioGrowthSeries(state)} series={[{ key: "value", label: "Portfolio value" }]} height={200} />
          </ReportShell>
        );
      case "health":
        return (
          <ReportShell
            title="Financial Health Report"
            summary={`Score: ${health.total}/1000 (${health.band}). Strongest: ${[...health.subs].sort((a, b) => b.score - a.score)[0].label}. Weakest: ${[...health.subs].sort((a, b) => a.score - b.score)[0].label}.`}
            numbers={health.subs.slice(0, 4).map((s) => ({ label: s.label, value: `${s.score}` }))}
            ai={health.changeNote}
            changed="What changed: spending discipline dipped with the dining/shopping drift; everything else held steady."
            next={`Next step: ${health.topFixes[0]}`}
          >
            <PulseBars
              data={health.subs.map((s) => ({ label: s.label.split(" ")[0], score: s.score }))}
              series={[{ key: "score", label: "Subscore" }]}
              height={200}
              yFormat={(v) => `${v}`}
              tipFormat={(v) => `${v}/100`}
            />
          </ReportShell>
        );
      case "decisions":
        return (
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-base font-semibold">Decision History</h2>
              <p className="mt-1 text-sm text-fog">
                Every decision you&apos;ve run through Decision Mode, with its score and verdict. Saved AI
                recommendations appear below.
              </p>
            </Card>
            {state.decisions.length === 0 ? (
              <Card className="p-8 text-center text-sm text-dim">
                No saved decisions yet — run one through Decision Mode and hit &ldquo;Save decision.&rdquo;
              </Card>
            ) : (
              state.decisions.map((d) => (
                <Card key={d.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{d.input.name}</h3>
                    <Badge tone={d.verdict === "Do it now" ? "green" : d.verdict === "Wait" ? "amber" : d.verdict === "Modify" ? "violet" : "rose"}>
                      {d.verdict}
                    </Badge>
                    <span className="ml-auto text-xs text-dim">{fmtDate(d.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-fog">
                    <span className="font-tabular">
                      Score <span className="font-bold text-snow">{d.score}/100</span>
                    </span>
                    <span className="font-tabular">Cost {fmtMoney(Math.abs(d.immediateCashImpact))}</span>
                    <span className="capitalize">Risk {d.riskLevel}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-fog">{d.explanation}</p>
                </Card>
              ))
            )}
            <h3 className="pt-2 text-sm font-semibold uppercase tracking-wider text-fog">Saved AI recommendations</h3>
            {state.recommendations.length === 0 ? (
              <Card className="p-8 text-center text-sm text-dim">
                Nothing saved yet — use &ldquo;Save recommendation&rdquo; in the AI Planner or assistant.
              </Card>
            ) : (
              state.recommendations.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                      <Icon name="sparkles" size={12} />
                    </span>
                    <h3 className="text-sm font-semibold">{r.topic}</h3>
                    <span className="ml-auto text-xs capitalize text-dim">{r.source} · {fmtDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-fog">{r.summary}</p>
                  <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-line bg-panel/60 p-3 font-sans text-[11px] leading-relaxed text-dim">
                    {r.detail}
                  </pre>
                </Card>
              ))
            )}
          </div>
        );
    }
  };

  return (
    <div>
      <PageHead
        title="Reports"
        sub="Generated live from your data — every report includes what changed and the next step."
      />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="grid grid-cols-2 gap-2 self-start lg:grid-cols-1">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setActive(r.key)}
              className={clsx(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer",
                active === r.key
                  ? "border-teal-500/50 bg-teal-500/10 text-snow"
                  : "border-line bg-panel/60 text-fog hover:border-line-strong hover:text-snow"
              )}
            >
              <Icon name={r.icon} size={16} className={active === r.key ? "text-pulse" : "text-dim"} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{r.label}</span>
                <span className="hidden text-[10px] text-dim lg:block">{r.blurb}</span>
              </span>
            </button>
          ))}
        </div>
        <div key={active} className="fade-in min-w-0">{body()}</div>
      </div>
    </div>
  );
}

function ReportShell({
  title,
  summary,
  numbers,
  ai,
  changed,
  next,
  children,
}: {
  title: string;
  summary: string;
  numbers: { label: string; value: string }[];
  ai: string;
  changed: string;
  next: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fog">{summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.label} className="rounded-xl border border-line bg-panel/60 p-3">
              <div className="truncate text-[10px] uppercase tracking-wide text-dim">{n.label}</div>
              <div className="mt-1 text-base font-bold font-tabular">{n.value}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">{children}</Card>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="ai-breathe mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Icon name="sparkles" size={14} />
          </span>
          <div className="space-y-2.5 text-sm leading-relaxed text-fog">
            <p>{ai}</p>
            <p className="text-xs text-dim">{changed}</p>
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-mint">{next}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
