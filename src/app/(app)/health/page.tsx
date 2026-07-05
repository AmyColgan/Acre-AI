"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/icons";
import { AnimatedNumber, Badge, Button, Card, Gauge, Modal, PageHead, ProgressBar } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { getHealth, getTotals } from "@/lib/calc";
import { addDaysISO, fmtMoney, todayISO } from "@/lib/format";

export default function HealthCenter() {
  const { state, addTask, toast } = usePulse();
  const [whyOpen, setWhyOpen] = useState(false);

  const health = useMemo(() => getHealth(state), [state]);
  const totals = useMemo(() => getTotals(state), [state]);

  const bandColor =
    health.total >= 800 ? "var(--color-good)" : health.total >= 650 ? "var(--color-good)" : health.total >= 480 ? "var(--color-warn)" : "var(--color-bad)";

  const statusTone = (s: string) =>
    s === "Strong" ? "green" : s === "Stable" ? "blue" : s === "Needs attention" ? "amber" : "rose";

  const createFixTask = (action: string) => {
    addTask({
      title: action,
      detail: "Suggested by the Financial Health Center to raise your score.",
      bucket: "week",
      priority: "high",
      impact: 0,
      due: addDaysISO(todayISO(), 7),
      timeNeeded: "15 min",
      category: "Health score",
      effect: { kind: "none" },
    });
    toast("Fix added to your Action Center.");
  };

  return (
    <div>
      <PageHead
        title="Financial Health Center"
        sub="One score out of 1000, built from seven subscores. Structure moves it — willpower doesn't."
      />

      {/* main gauge */}
      <Card className="rise-in relative overflow-hidden p-6">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[auto_1fr]">
          <div className="mx-auto">
            <Gauge
              value={health.total}
              max={1000}
              size={260}
              label={
                <span className="text-5xl font-bold tracking-tight" style={{ color: bandColor }}>
                  <AnimatedNumber value={health.total} />
                </span>
              }
              sub={
                <span className="mt-1 text-xs text-dim">
                  of 1000 · <span className="font-semibold" style={{ color: bandColor }}>{health.band}</span>
                </span>
              }
            />
          </div>
          <div>
            <h2 className="text-base font-semibold">What&apos;s moving your score</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-fog">{health.changeNote}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" icon="eye" onClick={() => setWhyOpen(true)}>
                Why did my score change?
              </Button>
              <Button
                variant="secondary"
                icon="zap"
                onClick={() => {
                  createFixTask(health.topFixes[0]);
                }}
              >
                Fix the #1 issue
              </Button>
            </div>
            <div className="mt-5 rounded-xl border border-line bg-panel/60 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-dim">Top 3 ways to improve</h3>
              <ol className="mt-2 space-y-2">
                {health.topFixes.map((f, i) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-fog">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[11px] font-bold text-pulse">
                      {i + 1}
                    </span>
                    <span className="flex-1">{f}</span>
                    <button
                      onClick={() => createFixTask(f)}
                      className="shrink-0 text-[11px] text-pulse transition-colors hover:text-snow cursor-pointer"
                    >
                      + task
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Card>

      {/* subscores */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {health.subs.map((sub) => (
          <Card key={sub.key} lift className="rise-in p-5" >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{sub.label}</h3>
              <Badge tone={statusTone(sub.status)}>{sub.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="text-3xl font-bold font-tabular"
                style={{
                  color: sub.score >= 80 ? "var(--color-good)" : sub.score >= 55 ? "var(--color-warn)" : "var(--color-bad)",
                }}
              >
                {sub.score}
              </span>
              <div className="flex-1">
                <ProgressBar
                  pct={sub.score}
                  tone={sub.score >= 80 ? "green" : sub.score >= 55 ? "amber" : "rose"}
                />
                <span className="mt-1 block text-[10px] text-dim">out of 100</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-fog">{sub.explanation}</p>
            <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[11px] leading-relaxed">
              <div className="flex gap-1.5">
                <Icon name="trendingUp" size={12} className="mt-0.5 shrink-0 text-mint" />
                <span className="text-fog">{sub.improved}</span>
              </div>
              <div className="flex gap-1.5">
                <Icon name="trendingDown" size={12} className="mt-0.5 shrink-0 text-coral" />
                <span className="text-fog">{sub.worsened}</span>
              </div>
            </div>
            <button
              onClick={() => createFixTask(sub.action)}
              className={clsx(
                "mt-3 flex w-full items-center justify-between rounded-xl border border-line bg-panel/60 px-3 py-2 text-left text-[11px] text-fog transition-all hover:border-blue-500/40 hover:text-snow cursor-pointer"
              )}
            >
              <span className="flex-1 pr-2">{sub.action}</span>
              <Icon name="plus" size={12} className="shrink-0 text-pulse" />
            </button>
          </Card>
        ))}

        {/* what to fix first */}
        <Card className="rise-in border-blue-500/25 p-5">
          <div className="flex items-center gap-2">
            <span className="ai-breathe flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <Icon name="sparkles" size={14} />
            </span>
            <h3 className="text-sm font-semibold">What to fix first</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fog">
            {(() => {
              const weakest = [...health.subs].sort((a, b) => a.score - b.score)[0];
              return (
                <>
                  <span className="font-semibold text-snow">{weakest.label}</span> is your lowest subscore
                  at {weakest.score}/100. {weakest.action} Completing it is worth roughly{" "}
                  <span className="font-semibold text-mint">
                    +{Math.round((70 - Math.min(70, weakest.score)) * 1.5)} points
                  </span>{" "}
                  — the single fastest lift available to you.
                </>
              );
            })()}
          </p>
          <div className="mt-4 space-y-2 rounded-xl border border-line bg-panel/60 p-3.5 text-[11px] leading-relaxed text-fog">
            <div className="font-semibold uppercase tracking-wide text-dim">How the score works</div>
            <p>Higher savings rate, positive cash flow, emergency-fund progress, and steady investing raise it. High-interest debt and overspending lower it. Every change you make recalculates it instantly.</p>
          </div>
        </Card>
      </div>

      {/* why modal */}
      <Modal open={whyOpen} onClose={() => setWhyOpen(false)} title="Why did my score change?">
        <div className="space-y-3 text-sm leading-relaxed text-fog">
          <p>{health.changeNote}</p>
          <p>
            The score is a weighted blend: cash flow (18%), debt health (16%), savings stability (16%),
            risk protection (15%), investment growth (13%), spending discipline (12%), and future
            readiness (10%) — each scored 0–100 from your live data, then scaled to 1000.
          </p>
          <p>
            Right now your surplus is {fmtMoney(totals.monthlySurplus)}/mo, savings cover{" "}
            {(state.savingsBalance / Math.max(1, totals.fixedBudget + totals.variableBudget)).toFixed(1)} months
            of expenses, and your weighted debt APR is {totals.avgApr.toFixed(1)}%. Change any of those and
            the score follows — apply a recommendation from the dashboard and watch it move.
          </p>
        </div>
      </Modal>
    </div>
  );
}
