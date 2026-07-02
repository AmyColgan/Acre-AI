"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/icons";
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  Field,
  Modal,
  MoneyInput,
  PageHead,
  ProgressBar,
  Select,
  TextInput,
} from "@/components/ui/core";
import { PulseArea, PulseBars, PulsePie, SERIES } from "@/components/charts";
import { usePulse } from "@/lib/store";
import {
  calendarEvents,
  cashFlowProjection,
  getTotals,
  lowBalanceDays,
  spentByCategory,
} from "@/lib/calc";
import { fmtDate, fmtMoney, todayISO } from "@/lib/format";
import type { BudgetCategory, CategoryId, Transaction } from "@/lib/types";

export default function Budget() {
  const { state, updateCategory, addTransaction, deleteTransaction, toast } = usePulse();
  // deep links from the header: /budget?q=<search> and /budget?add=1
  const [search, setSearch] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? ""
  );
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editCat, setEditCat] = useState<BudgetCategory | null>(null);
  const [editBudget, setEditBudget] = useState<number | "">("");
  const [txOpen, setTxOpen] = useState(
    () => typeof window !== "undefined" && !!new URLSearchParams(window.location.search).get("add")
  );
  const [txForm, setTxForm] = useState({ name: "", amount: "" as number | "", category: "groceries" as CategoryId, date: todayISO() });
  const [txError, setTxError] = useState("");

  const totals = useMemo(() => getTotals(state), [state]);
  const spent = useMemo(() => spentByCategory(state), [state]);
  const events = useMemo(() => calendarEvents(state), [state]);
  const projection = useMemo(() => cashFlowProjection(state), [state]);
  const dangerDays = useMemo(() => lowBalanceDays(state), [state]);

  const transactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.transactions
      .filter((t) => (filterCat === "all" ? true : t.category === filterCat))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) || t.category.includes(q) : true))
      .slice(0, 40);
  }, [state.transactions, search, filterCat]);

  const submitTx = () => {
    if (!txForm.name.trim()) return setTxError("Give the transaction a name.");
    const amount = txForm.amount === "" ? 0 : txForm.amount;
    if (amount <= 0) return setTxError("Amount must be above zero.");
    addTransaction({
      name: txForm.name.trim(),
      amount,
      category: txForm.category,
      date: txForm.date || todayISO(),
      type: "expense",
    });
    toast(`${fmtMoney(amount)} logged to ${state.categories.find((c) => c.id === txForm.category)?.name ?? txForm.category}. Budgets updated.`);
    setTxForm({ name: "", amount: "", category: txForm.category, date: todayISO() });
    setTxError("");
    setTxOpen(false);
  };

  const budgetVsActual = state.categories
    .filter((c) => c.kind === "variable")
    .map((c) => ({ label: c.name.slice(0, 6), budget: c.budget, actual: Math.round(spent[c.id]) }));

  const fixedVsVariable = useMemo(() => {
    const out: { label: string; fixed: number; variable: number }[] = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const wob = (n: number) => Math.round(n * (0.93 + ((i * 37) % 13) / 100));
      out.push({
        label: new Date(d.getFullYear(), d.getMonth() - i, 1).toLocaleDateString("en-US", { month: "short" }),
        fixed: totals.fixedBudget,
        variable: i === 0 ? totals.variableSpent30d : wob(totals.variableBudget),
      });
    }
    return out;
  }, [totals]);

  const pieData = state.categories
    .map((c, i) => ({ name: c.name, value: Math.round(spent[c.id]), color: SERIES[i % SERIES.length] }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const rest = state.categories.reduce((s, c) => s + spent[c.id], 0) - pieData.reduce((s, d) => s + d.value, 0);
  if (rest > 1) pieData.push({ name: "Everything else", value: Math.round(rest), color: "#3a4368" });
  const pieFinal = pieData.map((d, i) => ({ ...d, color: d.name === "Everything else" ? "#3a4368" : SERIES[i % SERIES.length] }));

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const today = new Date().getDate();
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div>
      <PageHead
        title="Budget & Cash Flow"
        sub="One number to trust, eleven categories under it, and a calendar that sees trouble coming."
        actions={<Button icon="plus" onClick={() => setTxOpen(true)}>Add transaction</Button>}
      />

      {/* safe to spend hero */}
      <Card className="rise-in relative overflow-hidden p-6">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-dim">Safe to spend this week</div>
            <div className="mt-1 text-5xl font-bold tracking-tight">
              <AnimatedNumber value={totals.safeToSpendWeek} format={(n) => fmtMoney(Math.round(n))} />
            </div>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-fog">
            This is what you can spend without hurting bills, goals, savings, or debt payoff. It&apos;s your
            remaining {monthName} variable budget spread across the weeks left — it moves the moment you
            log a transaction.
          </p>
        </div>
      </Card>

      {/* budget summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Income", value: state.monthlyIncome, note: "monthly take-home" },
          { label: "Fixed expenses", value: totals.fixedBudget, note: "rent, bills, plans" },
          { label: "Variable expenses", value: totals.variableBudget, note: "the flexible part" },
          { label: "Savings planned", value: totals.savingsPlanned, note: "to goals monthly" },
          { label: "Debt payments", value: totals.debtBudget, note: "minimums + extra" },
          { label: "Remaining", value: Math.max(0, totals.freeBuffer), note: "unassigned buffer" },
        ].map((c) => (
          <Card key={c.label} className="p-3.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-dim">{c.label}</div>
            <div className="mt-1 text-lg font-bold font-tabular">{fmtMoney(c.value)}</div>
            <div className="text-[10px] text-dim">{c.note}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        {/* categories */}
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Spending categories</h2>
          <p className="mt-0.5 text-xs text-fog">Trailing 30 days against budget. Arrows compare to last month.</p>
          <div className="mt-4 space-y-3">
            {state.categories.map((c, i) => {
              const s = spent[c.id];
              const pct = c.budget > 0 ? (s / c.budget) * 100 : 0;
              const remaining = c.budget - s;
              const trendUp = s > c.lastMonth * 1.03;
              const trendDown = s < c.lastMonth * 0.97;
              const over = remaining < 0;
              return (
                <div key={c.id} className="group">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                    <span className="font-medium">{c.name}</span>
                    <span className="rounded-md border border-line px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-dim">{c.kind}</span>
                    {trendUp && <Icon name="trendingUp" size={13} className="text-coral" />}
                    {trendDown && <Icon name="trendingDown" size={13} className="text-mint" />}
                    {over && (
                      <Badge tone="rose" className="hidden sm:inline-flex">
                        <Icon name="alert" size={10} /> {fmtMoney(Math.round(-remaining))} over
                      </Badge>
                    )}
                    <button
                      onClick={() => {
                        setEditCat(c);
                        setEditBudget(c.budget);
                      }}
                      aria-label={`Edit ${c.name} budget`}
                      className="ml-auto rounded-lg p-1.5 text-dim opacity-0 transition-all hover:bg-raise hover:text-snow group-hover:opacity-100 cursor-pointer"
                    >
                      <Icon name="edit" size={13} />
                    </button>
                    <span className="font-tabular text-xs text-fog">
                      {fmtMoney(Math.round(s))} <span className="text-dim">/ {fmtMoney(c.budget)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <ProgressBar pct={pct} tone={over ? "rose" : pct > 85 ? "amber" : "blue"} className="flex-1" />
                    <span className={clsx("w-20 text-right text-[11px] font-tabular", over ? "text-coral" : "text-dim")}>
                      {over ? "over budget" : `${fmtMoney(Math.round(remaining))} left`}
                    </span>
                  </div>
                  {over && (
                    <p className="mt-1 text-[11px] text-gold">
                      Pulse: cap {c.name.toLowerCase()} at {fmtMoney(Math.round(s / 4.33))}/week to land back on plan next month.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* transactions */}
        <Card className="rise-in flex flex-col p-5">
          <h2 className="text-sm font-semibold">Transactions</h2>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions…"
                className="w-full rounded-xl border border-line bg-panel/70 py-2 pl-9 pr-3 text-sm text-snow placeholder:text-dim outline-none focus:border-blue-500/50"
              />
            </div>
            <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-36">
              <option value="all">All categories</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="income">Income</option>
              <option value="savings">Savings</option>
              <option value="debt">Debt</option>
            </Select>
          </div>
          <div className="mt-3 max-h-[430px] flex-1 space-y-0.5 overflow-y-auto pr-1">
            {transactions.length === 0 && (
              <p className="py-10 text-center text-sm text-dim">No transactions match — clear the search or add one.</p>
            )}
            {transactions.map((t) => (
              <TxRow key={t.id} t={t} onDelete={() => {
                deleteTransaction(t.id);
                toast("Transaction removed — budgets recalculated.", "info");
              }} catName={state.categories.find((c) => c.id === t.category)?.name ?? t.category} />
            ))}
          </div>
        </Card>
      </div>

      {/* cash flow calendar */}
      <Card className="rise-in mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Cash flow calendar · {monthName}</h2>
            <p className="mt-0.5 text-xs text-fog">
              Paydays, bills, transfers, and debt payments.{" "}
              {dangerDays.length > 0 ? (
                <span className="text-gold">
                  Low cash risk on {monthName} {dangerDays.slice(0, 2).join(" & ")} — plan around it.
                </span>
              ) : (
                "No low-balance days projected this month."
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-dim">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-mint" /> money in</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-coral" /> money out</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gold" /> low-cash day</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayEvents = events.filter((e) => e.day === day);
            const danger = dangerDays.includes(day);
            return (
              <div
                key={day}
                title={dayEvents.map((e) => `${e.name}: ${fmtMoney(e.amount, { signed: true })}`).join("\n") || undefined}
                className={clsx(
                  "min-h-[54px] rounded-lg border p-1.5 text-[10px] transition-colors",
                  danger
                    ? "border-amber-500/40 bg-amber-500/10"
                    : day === today
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-line bg-panel/40",
                  dayEvents.length > 0 && "hover:border-line-strong"
                )}
              >
                <span className={clsx("font-tabular font-medium", day === today ? "text-pulse" : "text-dim")}>{day}</span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div key={e.name} className={clsx("truncate leading-tight", e.amount > 0 ? "text-mint" : "text-coral")}>
                      {e.amount > 0 ? "+" : ""}{fmtMoney(e.amount, { compact: true })}
                    </div>
                  ))}
                  {danger && <Icon name="alert" size={10} className="text-gold" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Spending by category</h2>
          <p className="mt-0.5 mb-3 text-xs text-fog">Trailing 30 days — the top slice is the first lever.</p>
          <PulsePie
            data={pieFinal}
            height={190}
            center={
              <>
                <span className="text-base font-bold font-tabular">{fmtMoney(pieFinal.reduce((s, d) => s + d.value, 0), { compact: true })}</span>
                <span className="text-[10px] text-dim">total</span>
              </>
            }
          />
        </Card>
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Budget vs actual</h2>
          <p className="mt-0.5 mb-3 text-xs text-fog">Variable categories only — where plans meet reality.</p>
          <PulseBars
            data={budgetVsActual}
            series={[
              { key: "budget", label: "Budget", color: "#3a4368" },
              { key: "actual", label: "Actual", color: SERIES[0] },
            ]}
            height={190}
          />
        </Card>
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Projected balance</h2>
          <p className="mt-0.5 mb-3 text-xs text-fog">
            Checking balance through {monthName}, given every scheduled event and normal daily spending.
          </p>
          <PulseArea
            data={projection.map((p) => ({ label: `${p.day}`, balance: p.balance }))}
            dataKey="balance"
            label="Projected balance"
            height={190}
            color={SERIES[2]}
            refLineY={250}
            refLineLabel="low-cash line"
          />
        </Card>
        <Card className="rise-in p-5">
          <h2 className="text-sm font-semibold">Fixed vs variable</h2>
          <p className="mt-0.5 mb-3 text-xs text-fog">
            Fixed costs are the floor; the variable layer is where your choices live.
          </p>
          <PulseBars
            data={fixedVsVariable}
            series={[
              { key: "fixed", label: "Fixed", color: SERIES[2] },
              { key: "variable", label: "Variable", color: SERIES[0] },
            ]}
            height={190}
            stacked
          />
        </Card>
      </div>

      {/* edit category modal */}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={editCat ? `${editCat.name} budget` : ""}>
        {editCat && (
          <div className="space-y-4">
            <p className="text-sm text-fog">
              Spent {fmtMoney(Math.round(spent[editCat.id]))} in the last 30 days against a{" "}
              {fmtMoney(editCat.budget)} budget. Changing the budget updates your safe-to-spend and health
              score immediately.
            </p>
            <Field label="Monthly budget">
              <MoneyInput value={editBudget} onValue={setEditBudget} autoFocus />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditCat(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  updateCategory(editCat.id, { budget: editBudget === "" ? 0 : editBudget });
                  toast(`${editCat.name} budget set to ${fmtMoney(editBudget === "" ? 0 : editBudget)}.`);
                  setEditCat(null);
                }}
              >
                Save budget
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* add transaction modal */}
      <Modal open={txOpen} onClose={() => setTxOpen(false)} title="Add transaction">
        <div className="space-y-3.5">
          <Field label="Description">
            <TextInput
              value={txForm.name}
              onChange={(e) => setTxForm({ ...txForm, name: e.target.value })}
              placeholder="Coffee at Verde Roasters"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <MoneyInput value={txForm.amount} onValue={(v) => setTxForm({ ...txForm, amount: v })} placeholder="12.50" />
            </Field>
            <Field label="Category">
              <Select
                value={txForm.category}
                onChange={(e) => setTxForm({ ...txForm, category: e.target.value as CategoryId })}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Date">
            <TextInput type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
          </Field>
          {txError && (
            <p className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-coral">
              <Icon name="alert" size={14} /> {txError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setTxOpen(false)}>Cancel</Button>
            <Button onClick={submitTx}>Log transaction</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TxRow({ t, catName, onDelete }: { t: Transaction; catName: string; onDelete: () => void }) {
  const isIn = t.type === "income";
  const isTransfer = t.type === "transfer";
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-raise/50">
      <span
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isIn ? "bg-emerald-500/12 text-mint" : isTransfer ? "bg-violet-500/12 text-iris" : "bg-blue-500/10 text-pulse"
        )}
      >
        <Icon name={isIn ? "trendingUp" : isTransfer ? "refresh" : "wallet"} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{t.name}</div>
        <div className="text-[11px] capitalize text-dim">
          {catName} · {fmtDate(t.date, "monthDay")}
        </div>
      </div>
      <span className={clsx("font-tabular text-sm font-medium", isIn ? "text-mint" : "text-snow")}>
        {isIn ? "+" : "−"}
        {fmtMoney(t.amount)}
      </span>
      <button
        onClick={onDelete}
        aria-label={`Delete ${t.name}`}
        className="rounded-lg p-1.5 text-dim opacity-0 transition-all hover:bg-raise hover:text-coral group-hover:opacity-100 cursor-pointer"
      >
        <Icon name="trash" size={13} />
      </button>
    </div>
  );
}
