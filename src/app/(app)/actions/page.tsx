"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/icons";
import { Badge, Button, Card, Modal, PageHead } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { answerQuestion } from "@/lib/ai";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { ActionTask, TaskBucket } from "@/lib/types";

const BUCKETS: { key: TaskBucket; label: string; hint: string }[] = [
  { key: "today", label: "Today", hint: "small moves, immediate effect" },
  { key: "week", label: "This Week", hint: "the money maintenance window" },
  { key: "month", label: "This Month", hint: "structural improvements" },
  { key: "longTerm", label: "Long-Term", hint: "sequenced for later" },
];

export default function ActionCenter() {
  const { state, completeTask, dismissTask, toast } = usePulse();
  const [aiFor, setAiFor] = useState<ActionTask | null>(null);
  const [showDone, setShowDone] = useState(false);

  const open = useMemo(() => state.tasks.filter((t) => t.status === "open"), [state.tasks]);
  const done = useMemo(() => state.tasks.filter((t) => t.status === "done"), [state.tasks]);
  const totalImpact = open.reduce((s, t) => s + t.impact, 0);

  const complete = (t: ActionTask) => {
    completeTask(t.id);
    if (t.effect && t.effect.kind === "moveToSavings") {
      toast(`Done — ${fmtMoney(t.effect.amount)} moved to savings. Emergency fund updated.`);
    } else if (t.effect && t.effect.kind === "payDebt") {
      toast(`Done — ${fmtMoney(t.effect.amount)} paid toward your highest-APR debt.`);
    } else if (t.effect && t.effect.kind === "cutCategoryBudget") {
      toast(`Done — ${fmtMoney(t.effect.amount)}/mo trimmed from that budget.`);
    } else {
      toast("Task completed. Nice work.");
    }
  };

  const aiAdvice = useMemo(() => {
    if (!aiFor) return null;
    const q = /debt|card|pay/i.test(aiFor.title)
      ? "Which debt should I pay first?"
      : /saving|emergency|fund|transfer/i.test(aiFor.title)
        ? "Am I on track for my emergency fund?"
        : /subscription|dining|cap|spend/i.test(aiFor.title)
          ? "How can I save more this month?"
          : "How do I improve my financial health score?";
    return answerQuestion(state, q);
  }, [aiFor, state]);

  const priorityTone = { high: "rose", medium: "amber", low: "blue" } as const;

  return (
    <div>
      <PageHead
        title="Action Center"
        sub={`${open.length} open task${open.length === 1 ? "" : "s"} worth ≈ ${fmtMoney(totalImpact)} of impact. Completing a task updates your real data.`}
        actions={
          <Button variant="secondary" icon={showDone ? "eye" : "checkCircle"} onClick={() => setShowDone((v) => !v)}>
            {showDone ? "Hide completed" : `Completed (${done.length})`}
          </Button>
        }
      />

      <div className="space-y-6">
        {BUCKETS.map((bucket) => {
          const tasks = open.filter((t) => t.bucket === bucket.key);
          return (
            <section key={bucket.key}>
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-fog">{bucket.label}</h2>
                <span className="text-[11px] text-dim">{bucket.hint}</span>
              </div>
              {tasks.length === 0 ? (
                <Card className="p-4 text-sm text-dim">Nothing scheduled here — Pulse will add tasks as it finds them.</Card>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {tasks.map((t) => (
                    <Card key={t.id} lift className="rise-in p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => complete(t)}
                          aria-label={`Complete ${t.title}`}
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line text-transparent transition-all hover:border-mint hover:bg-emerald-500/15 hover:text-mint cursor-pointer"
                        >
                          <Icon name="check" size={12} strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold leading-snug">{t.title}</h3>
                            <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-fog">{t.detail}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-dim">
                            <span className="flex items-center gap-1"><Icon name="calendar" size={11} /> due {fmtDate(t.due)}</span>
                            <span className="flex items-center gap-1"><Icon name="clock" size={11} /> {t.timeNeeded}</span>
                            {t.impact > 0 && (
                              <span className="flex items-center gap-1 text-mint">
                                <Icon name="dollar" size={11} /> ≈ {fmtMoney(t.impact)} impact
                              </span>
                            )}
                            <span className="rounded-md border border-line px-1.5 py-0.5">{t.category}</span>
                          </div>
                          <div className="mt-3 flex gap-1.5">
                            <Button size="sm" variant="success" icon="check" onClick={() => complete(t)}>
                              Complete
                            </Button>
                            <Button size="sm" variant="ghost" icon="sparkles" onClick={() => setAiFor(t)}>
                              Ask AI
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon="x"
                              onClick={() => {
                                dismissTask(t.id);
                                toast("Task dismissed.", "info");
                              }}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {showDone && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fog">Completed</h2>
            {done.length === 0 ? (
              <Card className="p-4 text-sm text-dim">Nothing completed yet — the checkmarks are waiting.</Card>
            ) : (
              <div className="grid gap-2 lg:grid-cols-2">
                {done.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel/40 px-4 py-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-mint">
                      <Icon name="check" size={11} strokeWidth={2.5} />
                    </span>
                    <span className={clsx("flex-1 text-sm text-fog line-through decoration-dim")}>{t.title}</span>
                    {t.impact > 0 && <span className="text-[11px] text-dim font-tabular">{fmtMoney(t.impact)}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ask AI modal */}
      <Modal open={!!aiFor} onClose={() => setAiFor(null)} title={aiFor ? `Pulse on: ${aiFor.title}` : ""}>
        {aiAdvice && (
          <div className="space-y-3 text-sm leading-relaxed text-fog">
            <p className="text-snow/90">{aiAdvice.answer}</p>
            <div className="rounded-xl border border-line bg-panel/60 p-3.5 text-xs space-y-1.5">
              <div>
                <span className="font-semibold text-pulse">Impact:</span> {aiAdvice.impact}
              </div>
              <div>
                <span className="font-semibold text-mint">If you do one thing:</span> {aiAdvice.action}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
