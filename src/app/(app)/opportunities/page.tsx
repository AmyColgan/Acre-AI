"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/icons";
import { Badge, Button, Card, Modal, PageHead } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { addDaysISO, fmtMoney, todayISO } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

const BADGE_TONE: Record<string, "blue" | "green" | "violet" | "amber" | "rose"> = {
  "Quick Win": "green",
  "High Impact": "violet",
  Urgent: "amber",
  "Long-Term": "blue",
  "Risk Reduction": "rose",
};

type Tab = "new" | "saved" | "done";

export default function Opportunities() {
  const { state, setOpportunityStatus, addTask, toast } = usePulse();
  const [tab, setTab] = useState<Tab>("new");
  const [calcFor, setCalcFor] = useState<Opportunity | null>(null);

  const lists = useMemo(() => {
    return {
      new: state.opportunities.filter((o) => o.status === "new"),
      saved: state.opportunities.filter((o) => o.status === "saved"),
      done: state.opportunities.filter((o) => o.status === "accepted" || o.status === "dismissed"),
    };
  }, [state.opportunities]);

  const totalPotential = lists.new.reduce((s, o) => s + o.gain, 0);

  const accept = (o: Opportunity) => {
    setOpportunityStatus(o.id, "accepted");
    if (o.effect && o.effect.kind !== "none") {
      toast(`Accepted — Pulse applied it to your plan (${o.gainLabel}).`);
    } else {
      addTask({
        title: o.title,
        detail: o.why,
        bucket: "week",
        priority: o.impact === "high" ? "high" : "medium",
        impact: o.gain,
        due: addDaysISO(todayISO(), 7),
        timeNeeded: o.time,
        category: "Opportunity",
        effect: { kind: "none" },
      });
      toast("Accepted — a task was created so it actually happens.");
    }
  };

  const createTask = (o: Opportunity) => {
    addTask({
      title: o.title,
      detail: `${o.why}\n\n${o.calculation}`,
      bucket: "week",
      priority: o.impact === "high" ? "high" : "medium",
      impact: o.gain,
      due: addDaysISO(todayISO(), 7),
      timeNeeded: o.time,
      category: "Opportunity",
      effect: o.effect ?? { kind: "none" },
    });
    toast("Task created in your Action Center.");
  };

  const difficultyLabel = { easy: "Easy", medium: "Medium", hard: "Hard" };
  const impactTone = { low: "text-fog", medium: "text-gold", high: "text-mint" } as const;

  const current = lists[tab];

  return (
    <div>
      <PageHead
        title="Opportunity Feed"
        sub={`Pulse found ${lists.new.length} open opportunit${lists.new.length === 1 ? "y" : "ies"} worth ≈ ${fmtMoney(totalPotential)} combined. Each one shows its math.`}
      />

      {/* tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-panel/60 p-1 sm:w-fit">
        {(
          [
            { key: "new", label: `New (${lists.new.length})` },
            { key: "saved", label: `Saved (${lists.saved.length})` },
            { key: "done", label: `Handled (${lists.done.length})` },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex-1 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none cursor-pointer",
              tab === t.key ? "bg-teal-500/20 text-pulse" : "text-fog hover:text-snow"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current.length === 0 && (
        <Card className="p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-mint">
            <Icon name="checkCircle" size={26} />
          </span>
          <h2 className="mt-4 text-base font-semibold">
            {tab === "new" ? "All caught up" : tab === "saved" ? "Nothing saved for later" : "Nothing handled yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-fog">
            {tab === "new"
              ? "You've worked through every open opportunity. Pulse re-scans as your data changes — new ones will appear here."
              : tab === "saved"
                ? "When an opportunity isn't the right moment, hit 'Save for later' and it lands here."
                : "Accept or dismiss opportunities and they'll be archived here."}
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {current.map((o) => (
          <Card key={o.id} lift className="rise-in flex flex-col p-5" >
            <div className="flex flex-wrap items-center gap-1.5">
              {o.badges.map((b) => (
                <Badge key={b} tone={BADGE_TONE[b] ?? "neutral"}>{b}</Badge>
              ))}
              {o.status === "accepted" && <Badge tone="green"><Icon name="check" size={10} /> accepted</Badge>}
              {o.status === "dismissed" && <Badge tone="neutral">dismissed</Badge>}
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-snug">{o.title}</h3>
            <div className="mt-2 text-lg font-bold text-mint font-tabular">{o.gainLabel}</div>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-fog">{o.why}</p>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-dim">Difficulty</div>
                <div className="mt-0.5 text-xs font-medium">{difficultyLabel[o.difficulty]}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-dim">Time</div>
                <div className="mt-0.5 text-xs font-medium">{o.time}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-dim">Impact</div>
                <div className={clsx("mt-0.5 text-xs font-medium capitalize", impactTone[o.impact])}>{o.impact}</div>
              </div>
            </div>

            {o.status === "new" || o.status === "saved" ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Button size="sm" icon="check" onClick={() => accept(o)}>
                  Accept
                </Button>
                <Button size="sm" variant="secondary" icon="checkCircle" onClick={() => createTask(o)}>
                  Task
                </Button>
                {o.status === "new" && (
                  <Button size="sm" variant="ghost" icon="bookmark" onClick={() => { setOpportunityStatus(o.id, "saved"); toast("Saved for later.", "info"); }}>
                    Later
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon="x"
                  onClick={() => {
                    setOpportunityStatus(o.id, "dismissed");
                    toast("Dismissed — Pulse won't surface this again.", "info");
                  }}
                >
                  Dismiss
                </Button>
                <button
                  onClick={() => setCalcFor(o)}
                  className="ml-auto self-center text-[11px] text-pulse transition-colors hover:text-snow cursor-pointer"
                >
                  Show math
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCalcFor(o)}
                className="mt-4 self-start text-[11px] text-pulse transition-colors hover:text-snow cursor-pointer"
              >
                Show math
              </button>
            )}
          </Card>
        ))}
      </div>

      <Modal open={!!calcFor} onClose={() => setCalcFor(null)} title="The math behind it">
        {calcFor && (
          <div className="space-y-3 text-sm leading-relaxed text-fog">
            <h3 className="font-semibold text-snow">{calcFor.title}</h3>
            <p>{calcFor.why}</p>
            <p className="rounded-xl border border-line bg-panel/60 p-3.5 font-mono text-xs leading-relaxed text-mint">
              {calcFor.calculation}
            </p>
            <p className="text-xs text-dim">
              Estimated value: <span className="font-semibold text-snow">{calcFor.gainLabel}</span> ·
              difficulty {calcFor.difficulty} · about {calcFor.time.toLowerCase()} of effort.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
