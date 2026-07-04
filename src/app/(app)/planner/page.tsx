"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { Badge, Button, Card, PageHead, ProgressBar } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { answerQuestion, SUGGESTED_PROMPTS, type AiResponse } from "@/lib/ai";
import { getHealth, getTotals, goalMath, overspentCategories, spentByCategory } from "@/lib/calc";
import { addDaysISO, fmtMoney, todayISO, uid } from "@/lib/format";

interface Turn {
  id: string;
  question: string;
  response: AiResponse;
}

export default function Planner() {
  const { state, addTask, saveRecommendation, updateCategory, updateGoal, applyEffect, toast } = usePulse();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => getTotals(state), [state]);
  const health = useMemo(() => getHealth(state), [state]);
  const over = useMemo(() => overspentCategories(state), [state]);
  const spent = useMemo(() => spentByCategory(state), [state]);
  const ef = state.goals.find((g) => g.id === state.emergencyFundGoalId);
  const efm = ef ? goalMath(ef) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question || thinking) return;
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setTurns((t) => [...t, { id: uid("turn"), question, response: answerQuestion(state, question) }]);
      setThinking(false);
    }, 800);
  };

  const createAction = (r: AiResponse) => {
    addTask({
      title: r.action,
      detail: `From AI Planner: ${r.topic}. ${r.impact}`,
      bucket: "week",
      priority: r.riskLevel === "high" ? "high" : "medium",
      impact: 0,
      due: addDaysISO(todayISO(), 5),
      timeNeeded: "10 min",
      category: "AI recommendation",
      effect: { kind: "none" },
    });
    toast("Task created in your Action Center");
  };

  const saveRec = (r: AiResponse) => {
    saveRecommendation({
      topic: r.topic,
      summary: r.answer,
      detail: `Impact: ${r.impact}\nRecommended action: ${r.action}\nAlternatives:\n${r.alternatives.map((a) => `• ${a}`).join("\n")}\nProjection: ${r.projection}`,
      source: "planner",
    });
    toast("Recommendation saved to Reports");
  };

  /** Apply Plan — makes a real change to the stored plan, depending on topic. */
  const applyPlan = (r: AiResponse) => {
    const topic = r.topic.toLowerCase();
    if (topic.includes("save more") || topic.includes("budget")) {
      const targets = over.slice(0, 2);
      if (targets.length === 0) {
        toast("Budgets already match the plan — nothing to tighten.", "info");
        return;
      }
      targets.forEach((c) => updateCategory(c.id, { budget: Math.max(0, Math.round(spent[c.id])) }));
      toast(`Caps set: ${targets.map((c) => c.name.toLowerCase()).join(" & ")} now match this month's plan.`);
    } else if (topic.includes("emergency")) {
      if (!ef || !efm) return;
      const target = Math.max(ef.monthlyContribution, Math.ceil(efm.neededMonthly / 10) * 10);
      updateGoal(ef.id, { monthlyContribution: target + (efm.onTrack ? 50 : 0) });
      toast(`Emergency fund contribution raised to ${fmtMoney(target + (efm.onTrack ? 50 : 0))}/mo.`);
    } else if (topic.includes("extra")) {
      applyEffect({ kind: "payDebt", amount: 300 });
      applyEffect({ kind: "moveToSavings", amount: 200 });
      toast("Applied the split: $300 to your highest-APR debt, $200 to savings.");
    } else if (topic.includes("debt")) {
      applyEffect({ kind: "payDebt", amount: 75 });
      toast("Sent an extra $75 to your highest-APR debt.");
    } else {
      applyEffect({ kind: "moveToSavings", amount: 100 });
      toast("Moved $100 to savings per the plan.");
    }
  };

  const riskTone = { low: "green", medium: "amber", high: "rose" } as const;

  return (
    <div>
      <PageHead
        title="AI Financial Planner"
        sub="Ask anything about your money. Every answer is computed from your live data — then turned into something you can apply."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* chat workspace */}
        <Card className="flex min-h-[560px] flex-col p-0">
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5" style={{ maxHeight: "calc(100vh - 300px)" }}>
            {turns.length === 0 && !thinking && (
              <div className="rise-in">
                <div className="flex items-center gap-2.5">
                  <span className="ai-breathe flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                    <Icon name="sparkles" size={16} />
                  </span>
                  <p className="text-sm text-fog">
                    I&apos;m ready, {state.profile.name}. Pick a question or type your own:
                  </p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => ask(p)}
                      className="rounded-xl border border-line bg-panel/60 px-3.5 py-3 text-left text-sm text-fog transition-all hover:border-teal-500/40 hover:text-snow cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((t) => (
              <div key={t.id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm text-white">
                    {t.question}
                  </div>
                </div>
                <div className="rise-in flex gap-3">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                    <Icon name="sparkles" size={14} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="rounded-2xl rounded-tl-md border border-line bg-panel/70 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-dim">{t.response.topic}</span>
                        <Badge tone={riskTone[t.response.riskLevel]}>risk: {t.response.riskLevel}</Badge>
                        {t.response.decisionScore !== undefined && (
                          <Badge tone="violet">decision score {t.response.decisionScore}/100</Badge>
                        )}
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-snow/90">{t.response.answer}</p>
                      <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs leading-relaxed">
                        <Row label="Financial impact" tone="text-pulse">{t.response.impact}</Row>
                        <Row label="Recommended action" tone="text-mint">{t.response.action}</Row>
                        <Row label="Projected outcome" tone="text-iris">{t.response.projection}</Row>
                        <div>
                          <span className="font-semibold text-gold">Alternatives:</span>
                          <ul className="mt-1 space-y-1 text-fog">
                            {t.response.alternatives.map((a) => (
                              <li key={a} className="flex gap-1.5">
                                <span className="text-dim">•</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="secondary" icon="checkCircle" onClick={() => createAction(t.response)}>
                        Create action
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="scale"
                        onClick={() => {
                          const d = t.response.decisionPrefill;
                          router.push(
                            d ? `/decisions?name=${encodeURIComponent(d.name)}&cost=${d.cost}` : "/decisions"
                          );
                        }}
                      >
                        Open decision report
                      </Button>
                      <Button size="sm" variant="secondary" icon="zap" onClick={() => applyPlan(t.response)}>
                        Apply plan
                      </Button>
                      <Button size="sm" variant="secondary" icon="bookmark" onClick={() => saveRec(t.response)}>
                        Save recommendation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex items-center gap-3 text-fog">
                <span className="ai-breathe flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                  <Icon name="sparkles" size={14} />
                </span>
                <div className="space-y-1.5">
                  <div className="skeleton h-3 w-56" />
                  <div className="skeleton h-3 w-40" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="border-t border-line p-4"
          >
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try "Can I afford a $1,200 e-bike?"'
                className="flex-1 rounded-xl border border-line bg-panel/80 px-3.5 py-2.5 text-sm text-snow placeholder:text-dim outline-none focus:border-teal-500/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </form>
        </Card>

        {/* context panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Your financial context</h2>
            <div className="mt-3 space-y-3 text-sm">
              <CtxRow label="Net worth" value={fmtMoney(totals.netWorth)} />
              <CtxRow label="Monthly income" value={fmtMoney(state.monthlyIncome)} />
              <CtxRow label="Monthly surplus" value={`+${fmtMoney(totals.monthlySurplus)}`} good />
              <CtxRow label="Savings" value={fmtMoney(state.savingsBalance)} />
              <CtxRow label="Investments" value={fmtMoney(state.portfolio.totalValue)} />
              <CtxRow label="Total debt" value={fmtMoney(totals.debtTotal)} bad={totals.debtTotal > 0} />
              <CtxRow label="Safe to spend / wk" value={fmtMoney(totals.safeToSpendWeek)} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Health score</h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="text-3xl font-bold font-tabular"
                style={{ color: health.total >= 650 ? "var(--color-good)" : health.total >= 480 ? "var(--color-warn)" : "var(--color-bad)" }}
              >
                {health.total}
              </span>
              <div className="flex-1">
                <ProgressBar pct={health.total / 10} tone={health.total >= 650 ? "green" : "amber"} />
                <span className="mt-1 block text-[11px] text-dim">{health.band} · out of 1000</span>
              </div>
            </div>
          </Card>

          {ef && efm && (
            <Card className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">Emergency fund</h2>
              <div className="mt-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold font-tabular">{fmtMoney(ef.current)}</span>
                  <span className="text-xs text-dim">of {fmtMoney(ef.target)}</span>
                </div>
                <ProgressBar pct={efm.pct} tone="green" className="mt-2" />
                <p className="mt-2 text-[11px] leading-relaxed text-fog">
                  {efm.pct.toFixed(0)}% funded · projected done{" "}
                  {efm.projectedDate
                    ? new Date(efm.projectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </Card>
          )}

          {over.length > 0 && (
            <Card className="border-amber-500/25 p-5">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                <Icon name="alert" size={13} /> Needs attention
              </h2>
              <ul className="mt-2.5 space-y-1.5 text-xs text-fog">
                {over.slice(0, 3).map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.name}</span>
                    <span className="font-tabular text-coral">+{fmtMoney(Math.round(c.overBy))} over</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, tone, children }: { label: string; tone: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={`font-semibold ${tone}`}>{label}:</span> <span className="text-fog">{children}</span>
    </div>
  );
}

function CtxRow({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fog">{label}</span>
      <span className={`font-medium font-tabular ${good ? "text-mint" : bad ? "text-coral" : ""}`}>{value}</span>
    </div>
  );
}
