"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icons";
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
  TextInput,
} from "@/components/ui/core";
import { PulseLine, SERIES } from "@/components/charts";
import { usePulse } from "@/lib/store";
import { getTotals, goalMath, wealthProjection } from "@/lib/calc";
import { addDaysISO, fmtDate, fmtMoney, todayISO } from "@/lib/format";
import type { Goal } from "@/lib/types";

const GOAL_ICONS: Record<string, IconName> = {
  shield: "shield",
  plane: "plane",
  home: "home",
  unlock: "unlock",
  sunrise: "sunrise",
  target: "target",
};

interface GoalForm {
  name: string;
  icon: string;
  target: number | "";
  current: number | "";
  deadline: string;
  monthlyContribution: number | "";
  priority: number;
}

const EMPTY_FORM: GoalForm = {
  name: "",
  icon: "target",
  target: "",
  current: 0,
  deadline: addDaysISO(todayISO(), 365),
  monthlyContribution: "",
  priority: 3,
};

export default function Goals() {
  const { state, addGoal, updateGoal, deleteGoal, contributeToGoal, toast } = usePulse();
  // /goals?add=1 (header quick action) opens the new-goal form immediately
  const [formOpen, setFormOpen] = useState(
    () => typeof window !== "undefined" && !!new URLSearchParams(window.location.search).get("add")
  );
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [contribution, setContribution] = useState<number | "">("");
  const [years, setYears] = useState<1 | 3 | 5 | 10>(10);
  const [error, setError] = useState("");

  const totals = useMemo(() => getTotals(state), [state]);
  const projection = useMemo(() => wealthProjection(state, years), [state, years]);
  const sorted = useMemo(() => [...state.goals].sort((a, b) => a.priority - b.priority), [state.goals]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({
      name: g.name,
      icon: g.icon,
      target: g.target,
      current: g.current,
      deadline: g.deadline,
      monthlyContribution: g.monthlyContribution,
      priority: g.priority,
    });
    setError("");
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) return setError("Name the goal.");
    const target = form.target === "" ? 0 : form.target;
    if (target <= 0) return setError("Target amount must be above zero.");
    const data = {
      name: form.name.trim(),
      icon: form.icon,
      target,
      current: form.current === "" ? 0 : form.current,
      deadline: form.deadline || addDaysISO(todayISO(), 365),
      monthlyContribution: form.monthlyContribution === "" ? 0 : form.monthlyContribution,
      priority: form.priority,
    };
    if (editing) {
      updateGoal(editing.id, data);
      toast(`"${data.name}" updated — projections recalculated.`);
    } else {
      addGoal(data);
      toast(`"${data.name}" added to your plan.`);
    }
    setFormOpen(false);
  };

  /* conflict detector: goals competing for the same surplus */
  const conflict = useMemo(() => {
    const funded = sorted.filter((g) => g.monthlyContribution > 0 && goalMath(g).pct < 100);
    const totalContrib = funded.reduce((s, g) => s + g.monthlyContribution, 0);
    const available = totals.monthlySurplus - totals.debtBudget - totals.investContribution;
    if (funded.length >= 2 && totalContrib > available * 0.85) {
      const [a, b] = funded;
      return {
        a,
        b,
        amount: Math.min(totalContrib, Math.max(0, Math.round(available))),
      };
    }
    return null;
  }, [sorted, totals]);

  return (
    <div>
      <PageHead
        title="Goals & Wealth Planning"
        sub="Every goal gets a projected finish date. Pulse flags the ones competing for the same dollars."
        actions={<Button icon="plus" onClick={openAdd}>New goal</Button>}
      />

      {/* conflict detector */}
      {conflict && (
        <Card className="rise-in mb-4 border-amber-500/25 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-gold">
              <Icon name="alert" size={16} />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Goal conflict detected</h2>
              <p className="mt-1 text-xs leading-relaxed text-fog">
                Your {conflict.b.name.toLowerCase()} and {conflict.a.name.toLowerCase()} are competing for
                the same {fmtMoney(conflict.amount)} monthly surplus. Pulse recommends prioritizing{" "}
                {conflict.a.name.toLowerCase()} until it reaches{" "}
                {fmtMoney(Math.round(conflict.a.target * 0.83))} — then the freed contribution accelerates
                everything else.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                updateGoal(conflict.a.id, {
                  monthlyContribution: conflict.a.monthlyContribution + Math.round(conflict.b.monthlyContribution / 2),
                });
                updateGoal(conflict.b.id, {
                  monthlyContribution: Math.round(conflict.b.monthlyContribution / 2),
                });
                toast(`Shifted ${fmtMoney(Math.round(conflict.b.monthlyContribution / 2))}/mo from ${conflict.b.name} to ${conflict.a.name}.`);
              }}
            >
              Apply fix
            </Button>
          </div>
        </Card>
      )}

      {/* goal cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((g, i) => {
          const m = goalMath(g);
          const color = SERIES[i % SERIES.length];
          return (
            <Card key={g.id} lift className="rise-in p-5" >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${"color-mix(in srgb, " + color + " 14%, transparent)"}`, color }}>
                    <Icon name={GOAL_ICONS[g.icon] ?? "target"} size={17} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{g.name}</h3>
                    <span className="text-[11px] text-dim">priority {g.priority} · due {fmtDate(g.deadline)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(g)}
                    aria-label={`Edit ${g.name}`}
                    className="rounded-lg p-1.5 text-dim transition-colors hover:bg-raise hover:text-snow cursor-pointer"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    onClick={() => {
                      deleteGoal(g.id);
                      toast(`"${g.name}" removed from your plan.`, "info");
                    }}
                    aria-label={`Delete ${g.name}`}
                    className="rounded-lg p-1.5 text-dim transition-colors hover:bg-raise hover:text-coral cursor-pointer"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <ProgressRing
                  pct={m.pct}
                  size={86}
                  stroke={7}
                  color={color}
                  label={<span className="text-base font-bold font-tabular">{Math.round(m.pct)}%</span>}
                />
                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-dim">Saved</span>
                    <span className="font-medium font-tabular">{fmtMoney(g.current)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dim">Target</span>
                    <span className="font-medium font-tabular">{fmtMoney(g.target)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dim">Monthly</span>
                    <span className="font-medium font-tabular">{fmtMoney(g.monthlyContribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dim">Needs</span>
                    <span className="font-medium font-tabular">{fmtMoney(Math.ceil(m.neededMonthly))}/mo</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                {m.pct >= 100 ? (
                  <Badge tone="green"><Icon name="check" size={10} /> Complete</Badge>
                ) : m.onTrack ? (
                  <Badge tone="green">
                    On track · done {m.projectedDate ? fmtDate(m.projectedDate) : "—"}
                  </Badge>
                ) : (
                  <Badge tone="amber">
                    Behind — needs {fmtMoney(Math.ceil(m.neededMonthly))}/mo
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  icon="plus"
                  onClick={() => {
                    setContributing(g);
                    setContribution("");
                  }}
                >
                  Contribute
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* wealth projection */}
      <Card className="rise-in mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Wealth projection</h2>
            <p className="mt-0.5 text-xs text-fog">
              Four paths for your net worth, from today&apos;s {fmtMoney(totals.netWorth)}. The recommended
              path assigns 70% of your unallocated buffer to goals.
            </p>
          </div>
          <div className="flex gap-1 rounded-xl border border-line bg-panel/60 p-1">
            {([1, 3, 5, 10] as const).map((y) => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  years === y ? "bg-teal-500/20 text-pulse" : "text-fog hover:text-snow"
                }`}
              >
                {y}y
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <PulseLine
            data={projection}
            series={[
              { key: "current", label: "Current path" },
              { key: "recommended", label: "Recommended" },
              { key: "aggressive", label: "Aggressive" },
              { key: "conservative", label: "Conservative" },
            ]}
            height={260}
          />
        </div>
        <p className="mt-3 rounded-xl border border-line bg-panel/60 p-3 text-xs leading-relaxed text-fog">
          Reading this: at {years} year{years > 1 ? "s" : ""}, the recommended path ends{" "}
          <span className="font-semibold text-mint">
            {fmtMoney(Number(projection[projection.length - 1].recommended) - Number(projection[projection.length - 1].current))}
          </span>{" "}
          ahead of your current path — the cost of leaving your buffer unassigned. Projections assume
          steady contributions; conservative uses 3.5% growth, aggressive 8%.
        </p>
      </Card>

      {/* add/edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${editing.name}` : "New goal"}>
        <div className="space-y-3.5">
          <Field label="Goal name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New car fund" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon">
              <Select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                <option value="target">Target</option>
                <option value="shield">Shield</option>
                <option value="plane">Plane</option>
                <option value="home">Home</option>
                <option value="unlock">Unlock</option>
                <option value="sunrise">Sunrise</option>
              </Select>
            </Field>
            <Field label="Priority (1 = highest)">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target amount">
              <MoneyInput value={form.target} onValue={(v) => setForm({ ...form, target: v })} placeholder="10000" />
            </Field>
            <Field label="Already saved">
              <MoneyInput value={form.current} onValue={(v) => setForm({ ...form, current: v })} placeholder="0" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline">
              <TextInput type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
            <Field label="Monthly contribution">
              <MoneyInput value={form.monthlyContribution} onValue={(v) => setForm({ ...form, monthlyContribution: v })} placeholder="150" />
            </Field>
          </div>
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-coral">
              <Icon name="alert" size={14} /> {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Add goal"}</Button>
          </div>
        </div>
      </Modal>

      {/* contribute modal */}
      <Modal
        open={!!contributing}
        onClose={() => setContributing(null)}
        title={contributing ? `Add to ${contributing.name}` : ""}
      >
        {contributing && (
          <div className="space-y-4">
            <p className="text-sm text-fog">
              Currently {fmtMoney(contributing.current)} of {fmtMoney(contributing.target)} (
              {Math.round(goalMath(contributing).pct)}%). Contributions update your savings balance and every
              projection instantly.
            </p>
            <Field label="Contribution amount">
              <MoneyInput value={contribution} onValue={setContribution} placeholder="250" autoFocus />
            </Field>
            <div className="flex gap-2">
              {[50, 100, 250].map((a) => (
                <button
                  key={a}
                  onClick={() => setContribution(a)}
                  className="flex-1 rounded-xl border border-line bg-panel/60 py-2 text-sm text-fog transition-colors hover:border-teal-500/40 hover:text-snow cursor-pointer"
                >
                  {fmtMoney(a)}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setContributing(null)}>Cancel</Button>
              <Button
                disabled={contribution === "" || contribution <= 0}
                onClick={() => {
                  const amt = contribution === "" ? 0 : contribution;
                  contributeToGoal(contributing.id, amt);
                  toast(`${fmtMoney(amt)} added to ${contributing.name}. Progress recalculated.`);
                  setContributing(null);
                }}
              >
                Add contribution
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
