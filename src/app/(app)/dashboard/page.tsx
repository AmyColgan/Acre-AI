"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon, type IconName } from "@/components/ui/icons";
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  Modal,
  ProgressRing,
} from "@/components/ui/core";
import { PulseArea, PulseBars, PulseLine, PulsePie, SERIES } from "@/components/charts";
import { usePulse } from "@/lib/store";
import {
  calendarEvents,
  cashFlowProjection,
  getHealth,
  getTotals,
  goalMath,
  incomeExpenseSeries,
  investmentAlignment,
  lowBalanceDays,
  netWorthSeries,
  overspentCategories,
  spentByCategory,
} from "@/lib/calc";
import { dailyBrief } from "@/lib/ai";
import { fmtMoney, greeting } from "@/lib/format";

export default function Dashboard() {
  const { state, applyBrief, toast, saveRecommendation } = usePulse();
  const [explainOpen, setExplainOpen] = useState(false);

  const totals = useMemo(() => getTotals(state), [state]);
  const health = useMemo(() => getHealth(state), [state]);
  const brief = useMemo(() => dailyBrief(state), [state]);
  const nwSeries = useMemo(() => netWorthSeries(state), [state]);
  const ieSeries = useMemo(() => incomeExpenseSeries(state), [state]);
  const projection = useMemo(() => cashFlowProjection(state), [state]);
  const dangerDays = useMemo(() => lowBalanceDays(state), [state]);
  const spent = useMemo(() => spentByCategory(state), [state]);
  const align = useMemo(() => investmentAlignment(state), [state]);
  const over = useMemo(() => overspentCategories(state), [state]);
  const events = useMemo(() => calendarEvents(state), [state]);

  const applied = !!state.flags["briefApplied"];
  const today = new Date().getDate();
  const upcoming = events.filter((e) => e.day >= today && e.amount < 0).slice(0, 5);

  const pieData = state.categories
    .map((c, i) => ({ name: c.name, value: Math.round(spent[c.id]), color: SERIES[i % SERIES.length] }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const topPie = pieData.slice(0, 5);
  const otherSum = pieData.slice(5).reduce((s, d) => s + d.value, 0);
  if (otherSum > 0) topPie.push({ name: "Everything else", value: otherSum, color: "#3a4368" });
  const pieFinal = topPie.map((d, i) => ({ ...d, color: i === 5 ? "#3a4368" : SERIES[i % SERIES.length] }));

  const debtPressure = totals.debtTotal > 0 ? Math.round((totals.debtBudget / state.monthlyIncome) * 100) : 0;
  const goalAvg = Math.round(
    state.goals.reduce((s, g) => s + goalMath(g).pct, 0) / Math.max(1, state.goals.length)
  );

  const opps = state.opportunities.filter((o) => o.status === "new").slice(0, 3);

  return (
    <div className="space-y-6">
      {/* greeting */}
      <div className="rise-in">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {greeting()}, {state.profile.name}.
        </h1>
        <p className="mt-1 text-sm text-fog">Here&apos;s what changed in your financial life today.</p>
      </div>

      {/* AI summary card */}
      <Card className="rise-in relative overflow-hidden p-5 sm:p-6" >
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
          <span className="ai-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
            <Icon name="sparkles" size={22} />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Pulse daily brief</span>
              <Badge tone="blue">confidence {brief.confidence}%</Badge>
              {applied && <Badge tone="green"><Icon name="check" size={10} /> recommendation applied</Badge>}
            </div>
            <p className="text-sm leading-relaxed text-snow/90">{brief.status}</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
                  <Icon name="alert" size={12} /> Watch
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fog">{brief.warning}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mint">
                  <Icon name="lightbulb" size={12} /> Opportunity
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fog">{brief.opportunity}</p>
              </div>
            </div>
            <p className="rounded-xl border border-blue-500/20 bg-blue-500/[0.07] p-3 text-sm leading-relaxed text-snow/90">
              <span className="font-semibold text-pulse">Recommended: </span>
              {brief.recommendation}
            </p>
            <div className="flex flex-wrap gap-2">
              {!applied && brief.applyAmount > 0 && (
                <Button
                  icon="check"
                  onClick={() => {
                    applyBrief();
                    toast(`Moved ${fmtMoney(brief.applyAmount)} to savings — emergency fund updated.`);
                  }}
                >
                  Apply recommendation
                </Button>
              )}
              <Button variant="secondary" icon="eye" onClick={() => setExplainOpen(true)}>
                Explain this
              </Button>
              <Link href="/planner">
                <Button variant="secondary" icon="sparkles">
                  Ask AI
                </Button>
              </Link>
              <Button
                variant="ghost"
                icon="bookmark"
                onClick={() => {
                  saveRecommendation({
                    topic: "Daily brief",
                    summary: brief.recommendation,
                    detail: `${brief.status}\n\nWarning: ${brief.warning}\nOpportunity: ${brief.opportunity}\n\n${brief.explanation}`,
                    source: "dashboard",
                  });
                  toast("Brief saved to Reports");
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Modal open={explainOpen} onClose={() => setExplainOpen(false)} title="How Pulse calculated this">
        <p className="text-sm leading-relaxed text-fog">{brief.explanation}</p>
        <p className="mt-4 rounded-xl border border-line bg-panel/60 p-3 text-xs text-dim">
          Pulse recomputes this brief every time your data changes — apply the recommendation and
          watch the numbers move.
        </p>
      </Modal>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon="bank"
          label="Net worth"
          value={<AnimatedNumber value={totals.netWorth} format={(n) => fmtMoney(Math.round(n))} />}
          note="Savings + investments − debt. Your single most honest number."
          tone="blue"
          delta={{ up: true, text: "+$620 vs last month" }}
        />
        <StatCard
          icon="activity"
          label="Monthly cash flow"
          value={<AnimatedNumber value={totals.monthlySurplus} format={(n) => `+${fmtMoney(Math.round(n))}`} />}
          note={`Income minus all budgets. ${fmtMoney(Math.max(0, totals.freeBuffer))} is still unassigned.`}
          tone="green"
        />
        <StatCard
          icon="wallet"
          label="Safe to spend this week"
          value={<AnimatedNumber value={totals.safeToSpendWeek} format={(n) => fmtMoney(Math.round(n))} />}
          note="What you can spend without affecting bills, goals, or debt payoff."
          tone="violet"
        />
        <Link href="/health" className="block">
          <StatCard
            icon="pulse"
            label="Financial health score"
            value={<AnimatedNumber value={health.total} format={(n) => `${Math.round(n)}`} />}
            note={`${health.band} — tap to see all seven subscores and what to fix first.`}
            tone={health.total >= 650 ? "green" : health.total >= 480 ? "amber" : "rose"}
          />
        </Link>
        <StatCard
          icon="trendingUp"
          label="Savings rate"
          value={`${totals.savingsRate.toFixed(0)}%`}
          note={`${fmtMoney(totals.savingsPlanned + totals.investContribution)}/mo to goals & investing. Benchmark: 20%.`}
          tone={totals.savingsRate >= 20 ? "green" : "amber"}
        />
        <StatCard
          icon="unlock"
          label="Debt pressure"
          value={`${debtPressure}%`}
          note={`${fmtMoney(totals.debtBudget)}/mo services ${fmtMoney(totals.debtTotal)} of debt at ${totals.avgApr.toFixed(1)}% avg APR.`}
          tone={debtPressure > 12 ? "amber" : "green"}
        />
        <StatCard
          icon="chartLine"
          label="Investment alignment"
          value={`${align}/100`}
          note={`How well your allocation matches your "${state.profile.riskLevel}" risk profile.`}
          tone={align >= 70 ? "green" : "amber"}
        />
        <StatCard
          icon="target"
          label="Goal progress"
          value={`${goalAvg}%`}
          note={`Average across ${state.goals.length} goals. Emergency fund is the priority.`}
          tone="blue"
        />
      </div>

      {/* charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rise-in p-5">
          <ChartHead
            title="Net worth trend"
            sub="Twelve months of steady climb — your plan is compounding."
          />
          <PulseLine data={nwSeries} series={[{ key: "value", label: "Net worth" }]} height={210} />
        </Card>
        <Card className="rise-in p-5">
          <ChartHead
            title="Income vs expenses"
            sub={
              over.length > 0
                ? `The gap is your wealth engine — ${over[0].name.toLowerCase()} is squeezing it this month.`
                : "The gap between bars is your wealth engine. Protect it."
            }
          />
          <PulseBars
            data={ieSeries}
            series={[
              { key: "income", label: "Income", color: SERIES[1] },
              { key: "expenses", label: "Expenses", color: SERIES[0] },
            ]}
            height={210}
          />
        </Card>
      </div>

      {/* charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rise-in p-5">
          <ChartHead
            title="Spending by category"
            sub="Trailing 30 days. The top slice is always the first place to look."
          />
          <PulsePie
            data={pieFinal}
            height={200}
            center={
              <>
                <span className="text-lg font-bold font-tabular">{fmtMoney(pieFinal.reduce((s, d) => s + d.value, 0), { compact: true })}</span>
                <span className="text-[10px] text-dim">30-day spend</span>
              </>
            }
          />
        </Card>
        <Card className="rise-in p-5">
          <ChartHead
            title="Cash flow projection"
            sub={
              dangerDays.length > 0
                ? `Projected checking balance this month — low-cash risk around day ${dangerDays[0]}.`
                : "Projected checking balance this month — no low-cash days detected."
            }
          />
          <PulseArea
            data={projection.map((p) => ({ label: `${p.day}`, balance: p.balance }))}
            dataKey="balance"
            label="Projected balance"
            height={200}
            refLineY={250}
            refLineLabel="low-cash line"
            color={SERIES[2]}
          />
        </Card>
      </div>

      {/* goals + bills */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rise-in p-5">
          <ChartHead title="Goal progress" sub="Rings fill as contributions land. Tap a goal to manage it." />
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {state.goals.slice(0, 6).map((g, i) => {
              const m = goalMath(g);
              return (
                <Link key={g.id} href="/goals" className="group flex flex-col items-center gap-1.5 text-center">
                  <ProgressRing
                    pct={m.pct}
                    size={78}
                    stroke={6}
                    color={SERIES[i % SERIES.length]}
                    label={<span className="text-sm font-bold font-tabular">{Math.round(m.pct)}%</span>}
                  />
                  <span className="text-xs text-fog transition-colors group-hover:text-snow">{g.name}</span>
                </Link>
              );
            })}
          </div>
        </Card>
        <Card className="rise-in p-5">
          <ChartHead
            title="Upcoming bills"
            sub="What's leaving your account during the rest of this month."
          />
          <div className="mt-1 space-y-1">
            {upcoming.length === 0 && (
              <p className="py-6 text-center text-sm text-dim">Nothing else due this month — the calendar is clear.</p>
            )}
            {upcoming.map((e, i) => (
              <div key={`${e.day}-${e.name}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-raise/50">
                <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-panel/70">
                  <span className="text-[9px] uppercase text-dim">{new Date().toLocaleDateString("en-US", { month: "short" })}</span>
                  <span className="text-xs font-bold font-tabular">{e.day}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{e.name}</div>
                  <div className="text-[11px] capitalize text-dim">{e.kind}</div>
                </div>
                <span className="font-tabular text-sm font-medium text-coral">{fmtMoney(e.amount)}</span>
                {i === 0 && <Badge tone="amber">next</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* opportunity preview */}
      <div className="rise-in">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fog">AI opportunity feed</h2>
          <Link href="/opportunities" className="flex items-center gap-1 text-xs text-pulse transition-colors hover:text-snow">
            View all <Icon name="chevronRight" size={13} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {opps.map((o) => (
            <Link key={o.id} href="/opportunities">
              <Card lift className="h-full p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={o.badges.includes("High Impact") ? "violet" : o.badges.includes("Urgent") ? "amber" : "green"}>
                    {o.badges[0]}
                  </Badge>
                  <span className="text-xs font-semibold text-mint font-tabular">{o.gainLabel}</span>
                </div>
                <h3 className="mt-2.5 text-sm font-semibold leading-snug">{o.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fog">{o.why}</p>
              </Card>
            </Link>
          ))}
          {opps.length === 0 && (
            <Card className="p-5 text-sm text-dim sm:col-span-3">
              You&apos;ve worked through every open opportunity. Pulse will surface new ones as your data changes.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- subcomponents ------------------------------ */

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
  delta,
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  note: string;
  tone: "blue" | "green" | "violet" | "amber" | "rose";
  delta?: { up: boolean; text: string };
}) {
  const tones = {
    blue: "text-pulse bg-blue-500/12",
    green: "text-mint bg-emerald-500/12",
    violet: "text-iris bg-violet-500/12",
    amber: "text-gold bg-amber-500/12",
    rose: "text-coral bg-rose-500/12",
  };
  return (
    <Card lift className="h-full p-4">
      <div className="flex items-center gap-2">
        <span className={clsx("flex h-7 w-7 items-center justify-center rounded-lg", tones[tone])}>
          <Icon name={icon} size={14} />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-dim">{label}</span>
      </div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight">{value}</div>
      {delta && (
        <div className={clsx("mt-1 inline-flex items-center gap-1 text-[11px] font-medium", delta.up ? "text-mint" : "text-coral")}>
          <Icon name={delta.up ? "trendingUp" : "trendingDown"} size={12} /> {delta.text}
        </div>
      )}
      <p className="mt-1.5 text-[11px] leading-relaxed text-dim">{note}</p>
    </Card>
  );
}

function ChartHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs text-fog">{sub}</p>
    </div>
  );
}
