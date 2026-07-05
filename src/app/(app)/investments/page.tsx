"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icons";
import {
  AnimatedNumber,
  Button,
  Card,
  Field,
  Modal,
  MoneyInput,
  PageHead,
  Segmented,
} from "@/components/ui/core";
import { PulseBars, PulseLine, PulsePie, RiskMeter, SERIES } from "@/components/charts";
import { usePulse } from "@/lib/store";
import {
  contributionProjection,
  getTotals,
  investmentAlignment,
  portfolioGrowthSeries,
  portfolioRisk,
} from "@/lib/calc";
import { answerQuestion } from "@/lib/ai";
import { fmtMoney } from "@/lib/format";
import type { AssetClass } from "@/lib/types";

const ASSET_LABELS: Record<AssetClass, string> = {
  usStocks: "US stocks",
  intlStocks: "International stocks",
  bonds: "Bonds",
  cash: "Cash",
  alternatives: "Crypto / alternatives",
};

export default function Investments() {
  const { state, patch, updateProfile, saveRecommendation, toast } = usePulse();
  const [allocOpen, setAllocOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [draftAlloc, setDraftAlloc] = useState(state.portfolio.allocation);
  const [draftContrib, setDraftContrib] = useState<number | "">(state.portfolio.monthlyContribution);
  const [aiRec, setAiRec] = useState<string | null>(null);

  const totals = useMemo(() => getTotals(state), [state]);
  const growth = useMemo(() => portfolioGrowthSeries(state), [state]);
  const projection = useMemo(() => contributionProjection(state, 10), [state]);
  const risk = useMemo(() => portfolioRisk(state), [state]);
  const alignment = useMemo(() => investmentAlignment(state), [state]);

  const yearGrowth = state.portfolio.totalValue - state.portfolio.startValue;
  const growthPct = (yearGrowth / Math.max(1, state.portfolio.startValue)) * 100;
  const tenYear = projection[projection.length - 1];

  const allocData = (Object.keys(state.portfolio.allocation) as AssetClass[]).map((k, i) => ({
    name: ASSET_LABELS[k],
    value: state.portfolio.allocation[k],
    color: SERIES[i % SERIES.length],
  }));

  const draftTotal = (Object.values(draftAlloc) as number[]).reduce((s, v) => s + v, 0);

  const generateRec = () => {
    const r = answerQuestion(state, "Is my investment risk too high?");
    setAiRec(r.answer + " " + r.action);
    saveRecommendation({
      topic: "Portfolio check",
      summary: r.answer,
      detail: `Impact: ${r.impact}\nAction: ${r.action}\nProjection: ${r.projection}`,
      source: "investments",
    });
    toast("AI recommendation generated and saved to Reports.");
  };

  const savingsVsInvest = [
    { label: "Today", savings: state.savingsBalance, investments: state.portfolio.totalValue },
    {
      label: "In 5 yrs",
      savings: Math.round(state.savingsBalance * 1.1 + totals.savingsPlanned * 60 * 0.6),
      investments: Number(projection[Math.min(5, projection.length - 1)].projected),
    },
  ];

  return (
    <div>
      <PageHead
        title="Investment & Portfolio Insights"
        sub="Planning-focused, not day trading. See what your contributions become — and whether your risk matches your life."
        actions={
          <Button icon="sparkles" onClick={generateRec}>
            Generate AI recommendation
          </Button>
        }
      />

      {aiRec && (
        <Card className="rise-in mb-4 border-blue-500/25 p-4">
          <div className="flex items-start gap-3">
            <span className="ai-breathe mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <Icon name="sparkles" size={14} />
            </span>
            <p className="flex-1 text-sm leading-relaxed text-snow/90">{aiRec}</p>
            <button onClick={() => setAiRec(null)} aria-label="Dismiss" className="text-dim hover:text-snow cursor-pointer">
              <Icon name="x" size={14} />
            </button>
          </div>
        </Card>
      )}

      {/* stat row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-dim">Total investments</div>
          <div className="mt-1.5 text-2xl font-bold">
            <AnimatedNumber value={state.portfolio.totalValue} format={(n) => fmtMoney(Math.round(n))} />
          </div>
          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-mint">
            <Icon name="trendingUp" size={12} /> +{fmtMoney(yearGrowth)} ({growthPct.toFixed(1)}%) this year
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-dim">Monthly contribution</div>
          <div className="mt-1.5 text-2xl font-bold font-tabular">{fmtMoney(state.portfolio.monthlyContribution)}</div>
          <button onClick={() => { setDraftContrib(state.portfolio.monthlyContribution); setContribOpen(true); }} className="mt-1 text-[11px] text-pulse hover:text-snow transition-colors cursor-pointer">
            Change contribution →
          </button>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-dim">10-year projection</div>
          <div className="mt-1.5 text-2xl font-bold font-tabular">{fmtMoney(Number(tenYear.projected), { compact: true })}</div>
          <div className="mt-1 text-[11px] text-dim">at your current pace & risk level</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-dim">Alignment score</div>
          <div className="mt-1.5 text-2xl font-bold font-tabular" style={{ color: alignment >= 70 ? "var(--color-good)" : "var(--color-warn)" }}>
            {alignment}/100
          </div>
          <div className="mt-1 text-[11px] capitalize text-dim">vs your &ldquo;{state.profile.riskLevel}&rdquo; profile</div>
        </Card>
      </div>

      {/* AI narrative */}
      <Card className="rise-in mt-4 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-iris">
            <Icon name="compass" size={17} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">How Pulse reads this portfolio</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fog">
              Your portfolio is {risk > 65 ? "growth-oriented and aggressive" : risk > 45 ? "growth-oriented and moderately risky" : "conservative and defensive"} —{" "}
              {state.portfolio.allocation.usStocks + state.portfolio.allocation.intlStocks + state.portfolio.allocation.alternatives}% sits in growth assets.
              This can support long-term wealth, but your emergency fund should be stronger before increasing
              contributions. Consistency matters more than the exact mix: {fmtMoney(state.portfolio.monthlyContribution)} every
              month, through every market mood, is the strategy.
            </p>
          </div>
        </div>
      </Card>

      {/* charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Portfolio growth</h2>
          <p className="mt-0.5 mb-3 text-xs text-fog">Twelve months — contributions plus market movement.</p>
          <PulseLine data={growth} series={[{ key: "value", label: "Portfolio value" }]} height={200} />
        </Card>
        <Card className="rise-in p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Asset allocation</h2>
              <p className="mt-0.5 mb-3 text-xs text-fog">Where every invested dollar lives.</p>
            </div>
            <Button size="sm" variant="secondary" icon="edit" onClick={() => { setDraftAlloc(state.portfolio.allocation); setAllocOpen(true); }}>
              Edit
            </Button>
          </div>
          <PulsePie
            data={allocData}
            height={185}
            tipFormat={(v) => `${v}%`}
            center={
              <>
                <span className="text-base font-bold font-tabular">{fmtMoney(state.portfolio.totalValue, { compact: true })}</span>
                <span className="text-[10px] text-dim">invested</span>
              </>
            }
          />
        </Card>
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Contribution projection</h2>
          <p className="mt-0.5 mb-3 text-xs text-fog">
            What you put in vs what it becomes — the gap is compounding working for you.
          </p>
          <PulseLine
            data={projection}
            series={[
              { key: "projected", label: "Projected value", color: SERIES[4] },
              { key: "invested", label: "Total contributed", color: SERIES[2], dashed: true },
            ]}
            height={200}
          />
        </Card>
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Risk level</h2>
          <p className="mt-0.5 mb-4 text-xs text-fog">
            Computed from your allocation. Your stated comfort is &ldquo;{state.profile.riskLevel}&rdquo; — change it below and watch projections shift.
          </p>
          <RiskMeter value={risk} />
          <div className="mt-5">
            <Segmented
              value={state.profile.riskLevel}
              onChange={(v) => {
                updateProfile({ riskLevel: v });
                toast(`Risk profile set to ${v} — projections updated.`);
              }}
              options={[
                { value: "cautious", label: "Cautious", hint: "5% assumed" },
                { value: "balanced", label: "Balanced", hint: "7% assumed" },
                { value: "growth", label: "Growth", hint: "8.5% assumed" },
              ]}
            />
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-dim">Savings vs investments</h3>
            <div className="mt-2">
              <PulseBars
                data={savingsVsInvest}
                series={[
                  { key: "savings", label: "Savings", color: SERIES[2] },
                  { key: "investments", label: "Investments", color: SERIES[4] },
                ]}
                height={150}
              />
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-4 rounded-xl border border-line bg-panel/50 p-3 text-center text-[11px] text-dim">
        Educational planning only. Not financial advice. Projections use fixed assumed returns and ignore
        taxes, fees, and volatility.
      </p>

      {/* allocation editor */}
      <Modal open={allocOpen} onClose={() => setAllocOpen(false)} title="Edit asset allocation">
        <div className="space-y-4">
          {(Object.keys(draftAlloc) as AssetClass[]).map((k, i) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-fog">
                  <span className="h-2 w-2 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                  {ASSET_LABELS[k]}
                </span>
                <span className="font-medium font-tabular">{draftAlloc[k]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={draftAlloc[k]}
                onChange={(e) => setDraftAlloc({ ...draftAlloc, [k]: Number(e.target.value) })}
                className="w-full"
                aria-label={`${ASSET_LABELS[k]} percent`}
              />
            </div>
          ))}
          <div
            className={`rounded-xl border p-3 text-xs ${
              draftTotal === 100 ? "border-emerald-500/30 bg-emerald-500/8 text-mint" : "border-amber-500/30 bg-amber-500/8 text-gold"
            }`}
          >
            Total: {draftTotal}% {draftTotal === 100 ? "— balanced and ready to save." : "— needs to equal 100% before saving."}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAllocOpen(false)}>Cancel</Button>
            <Button
              disabled={draftTotal !== 100}
              onClick={() => {
                patch((s) => ({ ...s, portfolio: { ...s.portfolio, allocation: draftAlloc } }));
                toast("Allocation updated — risk and alignment recalculated.");
                setAllocOpen(false);
              }}
            >
              Save allocation
            </Button>
          </div>
        </div>
      </Modal>

      {/* contribution editor */}
      <Modal open={contribOpen} onClose={() => setContribOpen(false)} title="Monthly contribution">
        <div className="space-y-4">
          <p className="text-sm text-fog">
            You currently invest {fmtMoney(state.portfolio.monthlyContribution)}/month. Your unassigned
            buffer is {fmtMoney(Math.max(0, totals.freeBuffer))}/month — raising contributions beyond that
            means taking from goals or spending.
          </p>
          <Field label="New monthly contribution">
            <MoneyInput value={draftContrib} onValue={setDraftContrib} autoFocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setContribOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const v = draftContrib === "" ? 0 : draftContrib;
                patch((s) => ({ ...s, portfolio: { ...s.portfolio, monthlyContribution: v } }));
                toast(`Contribution set to ${fmtMoney(v)}/mo — projections updated.`);
                setContribOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
