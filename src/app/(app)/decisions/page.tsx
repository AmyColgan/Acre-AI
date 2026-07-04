"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/icons";
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  MoneyInput,
  PageHead,
  ProgressRing,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/core";
import { PulseBars, RiskMeter } from "@/components/charts";
import { usePulse } from "@/lib/store";
import { QUICK_DECISIONS, scoreDecision } from "@/lib/decision";
import { addDaysISO, fmtMoney, todayISO } from "@/lib/format";
import type { DecisionInput, DecisionReport } from "@/lib/types";

const EMPTY: DecisionInput = {
  name: "",
  cost: 0,
  monthlyCost: 0,
  category: "General",
  urgency: "medium",
  deadline: "",
  fundingSource: "cash",
  notes: "",
};

/** Prefill sent by the AI panel / planner via ?name=&cost= (client-only page). */
function readPrefill(): DecisionInput | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (!name) return null;
  const cost = Math.max(0, parseInt(params.get("cost") ?? "0", 10) || 0);
  return { ...EMPTY, name, cost };
}

export default function Decisions() {
  const { state, saveDecision, addTask, toast } = usePulse();
  const prefill = useMemo(() => readPrefill(), []);
  const [input, setInput] = useState<DecisionInput>(prefill ?? EMPTY);
  const [cost, setCost] = useState<number | "">(prefill?.cost || "");
  const [monthly, setMonthly] = useState<number | "">("");
  const [report, setReport] = useState<DecisionReport | null>(() =>
    prefill ? scoreDecision(state, prefill) : null
  );
  const [explainOpen, setExplainOpen] = useState(false);
  const [error, setError] = useState("");

  const analyze = (d?: DecisionInput) => {
    const candidate: DecisionInput = d ?? {
      ...input,
      cost: cost === "" ? 0 : cost,
      monthlyCost: monthly === "" ? 0 : monthly,
    };
    if (!candidate.name.trim()) {
      setError("Give the decision a name so Pulse can report on it.");
      return;
    }
    if (candidate.cost <= 0 && candidate.monthlyCost <= 0) {
      setError("Enter a one-time cost, a monthly cost, or both.");
      return;
    }
    setError("");
    setInput(candidate);
    setCost(candidate.cost || "");
    setMonthly(candidate.monthlyCost || "");
    setReport(scoreDecision(state, candidate));
  };

  const comparison = useMemo(() => {
    if (!report) return [];
    const base = report.input;
    const wait = Math.min(98, report.score + 12);
    const cheaper = scoreDecision(state, { ...base, cost: Math.round(base.cost * 0.7) }).score;
    return [
      { label: "Buy now", score: report.score },
      { label: "Wait 30d", score: wait },
      { label: "Cheaper", score: Math.max(cheaper, report.score) },
      { label: "Skip it", score: 95 },
    ];
  }, [report, state]);

  const verdictTone = (v: DecisionReport["verdict"]) =>
    v === "Do it now" ? "green" : v === "Wait" ? "amber" : v === "Modify" ? "violet" : "rose";
  const verdictIcon = (v: DecisionReport["verdict"]) =>
    v === "Do it now" ? "check" : v === "Wait" ? "clock" : v === "Modify" ? "edit" : "x";

  const scoreColor = (s: number) =>
    s >= 78 ? "var(--color-good)" : s >= 58 ? "var(--color-warn)" : s >= 38 ? "var(--color-chart-3)" : "var(--color-bad)";

  return (
    <div>
      <PageHead
        title="Decision Mode"
        sub="Before you spend, Pulse simulates the decision against your bills, goals, and debt — and scores it out of 100."
      />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* input side */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Describe the decision</h2>
            <div className="mt-4 space-y-3.5">
              <Field label="Decision name">
                <TextInput
                  value={input.name}
                  onChange={(e) => setInput({ ...input, name: e.target.value })}
                  placeholder="Buy a $900 laptop"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="One-time cost">
                  <MoneyInput value={cost} onValue={setCost} placeholder="900" />
                </Field>
                <Field label="Monthly cost">
                  <MoneyInput value={monthly} onValue={setMonthly} placeholder="0" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <Select value={input.category} onChange={(e) => setInput({ ...input, category: e.target.value })}>
                    {["General", "Technology", "Travel", "Housing", "Transportation", "Debt payoff", "Investing", "Health", "Education"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Urgency">
                  <Select
                    value={input.urgency}
                    onChange={(e) => setInput({ ...input, urgency: e.target.value as DecisionInput["urgency"] })}
                  >
                    <option value="low">Low — can wait</option>
                    <option value="medium">Medium</option>
                    <option value="high">High — needed now</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Deadline (optional)">
                  <TextInput
                    type="date"
                    value={input.deadline}
                    onChange={(e) => setInput({ ...input, deadline: e.target.value })}
                  />
                </Field>
                <Field label="Funding source">
                  <Select
                    value={input.fundingSource}
                    onChange={(e) => setInput({ ...input, fundingSource: e.target.value as DecisionInput["fundingSource"] })}
                  >
                    <option value="cash">Checking / cash flow</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                  </Select>
                </Field>
              </div>
              <Field label="Notes (optional)">
                <TextArea
                  value={input.notes}
                  onChange={(e) => setInput({ ...input, notes: e.target.value })}
                  placeholder="Anything Pulse should know…"
                  rows={2}
                />
              </Field>
              {error && (
                <p className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-coral">
                  <Icon name="alert" size={14} /> {error}
                </p>
              )}
              <Button className="w-full" size="lg" icon="scale" onClick={() => analyze()}>
                Analyze this decision
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Quick decisions</h2>
            <div className="mt-3 space-y-1.5">
              {QUICK_DECISIONS.map((d) => (
                <button
                  key={d.name}
                  onClick={() => analyze({ ...d, deadline: "" })}
                  className="flex w-full items-center justify-between rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-left text-sm text-fog transition-all hover:border-teal-500/40 hover:text-snow cursor-pointer"
                >
                  <span>{d.name}</span>
                  <Icon name="chevronRight" size={14} className="text-dim" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* report side */}
        <div className="space-y-4">
          {!report && (
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/12 to-emerald-500/12 text-iris">
                <Icon name="scale" size={30} />
              </span>
              <h2 className="mt-5 text-base font-semibold">No decision on the table yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-fog">
                Describe a purchase or pick a quick decision. Pulse will simulate the cash impact, goal
                delays, and risk — then tell you whether to do it, wait, modify, or avoid.
              </p>
            </Card>
          )}

          {report && (
            <>
              <Card className="rise-in p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <ProgressRing
                    pct={report.score}
                    size={128}
                    stroke={10}
                    color={scoreColor(report.score)}
                    label={<span className="text-4xl font-bold font-tabular">{report.score}</span>}
                    sub={<span className="text-[10px] uppercase tracking-wide text-dim">/ 100</span>}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{report.input.name}</h2>
                      <Badge tone={verdictTone(report.verdict)}>
                        <Icon name={verdictIcon(report.verdict)} size={11} /> {report.verdict}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-fog">{report.explanation}</p>
                    <div className="mt-3 max-w-xs">
                      <span className="mb-1 block text-[10px] uppercase tracking-wide text-dim">Risk level</span>
                      <RiskMeter value={report.riskLevel === "low" ? 22 : report.riskLevel === "medium" ? 55 : 86} />
                    </div>
                  </div>
                </div>

                {/* impact grid */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  <Impact label="Immediate cash" value={fmtMoney(report.immediateCashImpact)} bad={report.immediateCashImpact < 0} />
                  <Impact
                    label="Monthly cash flow"
                    value={report.monthlyCashFlowImpact === 0 ? "No change" : `${fmtMoney(report.monthlyCashFlowImpact)}/mo`}
                    bad={report.monthlyCashFlowImpact < 0}
                  />
                  <Impact label="Safe-to-spend after" value={`${fmtMoney(report.safeToSpendAfter)}/wk`} />
                  <Impact
                    label="Emergency fund"
                    value={report.goalDelayDays > 0 ? `+${report.goalDelayDays} days` : "On schedule"}
                    bad={report.goalDelayDays > 14}
                  />
                </div>
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-panel/60 p-3 text-xs">
                    <span className="text-dim">Savings impact — </span>
                    <span className="text-fog">{report.savingsImpact}</span>
                  </div>
                  <div className="rounded-xl border border-line bg-panel/60 p-3 text-xs">
                    <span className="text-dim">Debt impact — </span>
                    <span className="text-fog">{report.debtImpact}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    icon="bookmark"
                    onClick={() => {
                      saveDecision(report);
                      toast("Decision report saved — see Reports → Decision history.");
                    }}
                  >
                    Save decision
                  </Button>
                  <Button
                    variant="secondary"
                    icon="bell"
                    onClick={() => {
                      addTask({
                        title: `Revisit: ${report.input.name}`,
                        detail: `Pulse said "${report.verdict}" with a score of ${report.score}/100. Re-run the numbers in 30 days.`,
                        bucket: "month",
                        priority: "low",
                        impact: 0,
                        due: addDaysISO(todayISO(), 30),
                        timeNeeded: "5 min",
                        category: "Decision follow-up",
                        effect: { kind: "none" },
                      });
                      toast("Reminder created for 30 days out.");
                    }}
                  >
                    Create reminder
                  </Button>
                  <Button
                    variant="secondary"
                    icon="checkCircle"
                    onClick={() => {
                      addTask({
                        title: report.verdict === "Do it now" ? `Execute: ${report.input.name}` : `Decide on: ${report.input.name}`,
                        detail: report.explanation,
                        bucket: "week",
                        priority: report.riskLevel === "high" ? "high" : "medium",
                        impact: Math.abs(report.immediateCashImpact),
                        due: addDaysISO(todayISO(), 7),
                        timeNeeded: "15 min",
                        category: report.input.category,
                        effect: { kind: "none" },
                      });
                      toast("Added to your Action Center.");
                    }}
                  >
                    Add to Action Center
                  </Button>
                  <Button variant="secondary" icon="sparkles" onClick={() => setExplainOpen(true)}>
                    Ask AI to explain
                  </Button>
                </div>
              </Card>

              {/* comparison + timeline */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="rise-in p-5">
                  <h3 className="text-sm font-semibold">Your options, scored</h3>
                  <p className="mt-0.5 mb-3 text-xs text-fog">
                    Same decision, four timings — higher is safer for your plan.
                  </p>
                  <PulseBars
                    data={comparison}
                    series={[{ key: "score", label: "Decision score" }]}
                    height={190}
                    colorByPoint
                    yFormat={(v) => `${v}`}
                    tipFormat={(v) => `${v}/100`}
                  />
                </Card>
                <Card className="rise-in p-5">
                  <h3 className="text-sm font-semibold">What it touches</h3>
                  <p className="mt-0.5 mb-4 text-xs text-fog">How this decision ripples through your timelines.</p>
                  <div className="space-y-4">
                    <TimelineRow
                      icon="shield"
                      label="Emergency fund completion"
                      detail={
                        report.goalDelayDays > 0
                          ? `Pushed back ~${report.goalDelayDays} days if bought today`
                          : "Unaffected — funded from cash flow"
                      }
                      severity={report.goalDelayDays > 21 ? "bad" : report.goalDelayDays > 0 ? "warn" : "good"}
                    />
                    <TimelineRow
                      icon="plane"
                      label="Travel goal"
                      detail={
                        report.travelDelayDays > 0
                          ? `Slows by ~${report.travelDelayDays} days at current contributions`
                          : "No measurable delay"
                      }
                      severity={report.travelDelayDays > 30 ? "warn" : "good"}
                    />
                    <TimelineRow
                      icon="wallet"
                      label="Safe to spend"
                      detail={`Drops to ${fmtMoney(report.safeToSpendAfter)}/week while your buffer recovers`}
                      severity={report.safeToSpendAfter < 60 ? "bad" : report.safeToSpendAfter < 120 ? "warn" : "good"}
                    />
                  </div>
                  <div className="mt-4 border-t border-line pt-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-dim">Better alternatives</h4>
                    <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-fog">
                      {report.alternatives.map((a) => (
                        <li key={a} className="flex gap-2">
                          <Icon name="chevronRight" size={12} className="mt-0.5 shrink-0 text-pulse" /> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {report && (
        <Modal open={explainOpen} onClose={() => setExplainOpen(false)} title="Pulse explains the score">
          <div className="space-y-3 text-sm leading-relaxed text-fog">
            <p>
              <span className="font-semibold text-snow">{report.input.name}</span> scored{" "}
              <span className="font-semibold" style={{ color: scoreColor(report.score) }}>
                {report.score}/100
              </span>{" "}
              — verdict: <span className="font-semibold text-snow">{report.verdict}</span>.
            </p>
            <p>
              The score starts at 100 and loses points for pressure on your plan: the one-time cost is
              measured against your {fmtMoney(state.savingsBalance)} of savings, any recurring cost
              against your free monthly buffer, and unfinished goals raise the stakes — your emergency
              fund isn&apos;t complete, so large cash outflows cost extra points.
            </p>
            <p>{report.explanation}</p>
            <p className="rounded-xl border border-line bg-panel/60 p-3 text-xs text-dim">
              Decisions that put money to work — extra debt payments, investing — earn points back,
              because they reduce future risk instead of adding to it.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Impact({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <div className="text-[10px] uppercase tracking-wide text-dim">{label}</div>
      <div className={clsx("mt-1 text-sm font-semibold font-tabular", bad ? "text-coral" : "text-snow")}>{value}</div>
    </div>
  );
}

function TimelineRow({
  icon,
  label,
  detail,
  severity,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  detail: string;
  severity: "good" | "warn" | "bad";
}) {
  const colors = { good: "text-mint bg-emerald-500/12", warn: "text-gold bg-amber-500/12", bad: "text-coral bg-rose-500/12" };
  return (
    <div className="flex items-start gap-3">
      <span className={clsx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors[severity])}>
        <Icon name={icon} size={15} />
      </span>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-fog">{detail}</div>
      </div>
    </div>
  );
}
