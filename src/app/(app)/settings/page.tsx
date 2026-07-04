"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  Button,
  Card,
  Field,
  Modal,
  MoneyInput,
  PageHead,
  Segmented,
  Select,
  TextInput,
} from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { getTotals } from "@/lib/calc";
import { fmtMoney } from "@/lib/format";
import { STORAGE_KEY } from "@/lib/seed";

export default function Settings() {
  const { state, patch, updateProfile, setMonthlyIncome, resetDemo, clearAll, importState, toast } = usePulse();
  const totals = useMemo(() => getTotals(state), [state]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(state.profile.name);
  const [income, setIncome] = useState<number | "">(state.monthlyIncome);
  const [savings, setSavings] = useState<number | "">(state.savingsBalance);
  const [investments, setInvestments] = useState<number | "">(state.portfolio.totalValue);
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null);

  const [debtDrafts, setDebtDrafts] = useState<Record<string, number | "">>(
    Object.fromEntries(state.debts.map((d) => [d.id, d.balance]))
  );

  const saveCore = () => {
    if (!name.trim()) {
      toast("Name can't be empty.", "warn");
      return;
    }
    updateProfile({ name: name.trim() });
    setMonthlyIncome(income === "" ? 0 : income);
    patch((s) => ({
      ...s,
      savingsBalance: savings === "" ? 0 : savings,
      portfolio: { ...s.portfolio, totalValue: investments === "" ? 0 : investments },
      debts: s.debts.map((d) => ({
        ...d,
        balance: debtDrafts[d.id] === "" || debtDrafts[d.id] === undefined ? d.balance : Number(debtDrafts[d.id]),
      })),
    }));
    toast("Profile and balances saved — every screen recalculated.");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-ai-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data exported as JSON.");
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importState(String(reader.result ?? ""));
      toast(ok ? "Data imported — welcome back." : "That file doesn't look like a Pulse export.", ok ? "success" : "warn");
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <PageHead
        title="Settings & Data Manager"
        sub="Everything Pulse knows lives in your browser. Edit it, export it, or erase it."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* profile & money */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Profile & balances</h2>
          <div className="mt-4 space-y-3.5">
            <Field label="Name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly income">
                <MoneyInput value={income} onValue={setIncome} />
              </Field>
              <Field label="Savings balance">
                <MoneyInput value={savings} onValue={setSavings} />
              </Field>
            </div>
            <Field label="Investment balance">
              <MoneyInput value={investments} onValue={setInvestments} />
            </Field>
            {state.debts.map((d) => (
              <Field key={d.id} label={`${d.name} balance (${d.apr}% APR)`}>
                <MoneyInput
                  value={debtDrafts[d.id] ?? d.balance}
                  onValue={(v) => setDebtDrafts((x) => ({ ...x, [d.id]: v }))}
                />
              </Field>
            ))}
            <Button icon="check" onClick={saveCore}>Save changes</Button>
            <p className="text-[11px] text-dim">
              Expenses are edited per-category in{" "}
              <Link href="/budget" className="text-pulse hover:text-snow">Budget</Link>, goals in{" "}
              <Link href="/goals" className="text-pulse hover:text-snow">Goals</Link>.
            </p>
          </div>
        </Card>

        {/* preferences */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Preferences</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-fog">Risk level</span>
                <Segmented
                  value={state.profile.riskLevel}
                  onChange={(v) => {
                    updateProfile({ riskLevel: v });
                    toast(`Risk level set to ${v}.`);
                  }}
                  options={[
                    { value: "cautious", label: "Cautious" },
                    { value: "balanced", label: "Balanced" },
                    { value: "growth", label: "Growth" },
                  ]}
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-fog">Coaching style</span>
                <Segmented
                  value={state.profile.coachingStyle}
                  onChange={(v) => {
                    updateProfile({ coachingStyle: v });
                    toast(`Pulse will now be ${v} with you.`);
                  }}
                  options={[
                    { value: "gentle", label: "Gentle" },
                    { value: "direct", label: "Direct" },
                    { value: "analytical", label: "Analytical" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Theme">
                  <Select
                    value={state.flags["themeCharcoal"] ? "charcoal" : "midnight"}
                    onChange={(e) => {
                      patch((s) => ({ ...s, flags: { ...s.flags, themeCharcoal: e.target.value === "charcoal" } }));
                      toast(`Theme set to ${e.target.value === "charcoal" ? "Charcoal" : "Graphite"}.`);
                    }}
                  >
                    <option value="midnight">Graphite (default)</option>
                    <option value="charcoal">Charcoal</option>
                  </Select>
                </Field>
                <Field label="Currency">
                  <Select
                    value={state.profile.currency}
                    onChange={(e) => {
                      updateProfile({ currency: e.target.value });
                      toast(`Currency preference saved (${e.target.value}). Display stays in $ for this demo dataset.`);
                    }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          {/* data manager */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold">Data manager</h2>
            <p className="mt-1 text-xs text-fog">
              Stored locally under <code className="rounded bg-raise px-1.5 py-0.5 font-mono text-[10px]">{STORAGE_KEY}</code> —{" "}
              {state.transactions.length} transactions, {state.goals.length} goals, {state.decisions.length} decisions,{" "}
              {state.recommendations.length} saved recommendations.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" icon="download" onClick={exportJson}>
                Export JSON
              </Button>
              <Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>
                Import JSON
              </Button>
              <Button variant="secondary" icon="refresh" onClick={() => setConfirm("reset")}>
                Reset demo data
              </Button>
              <Button variant="danger" icon="trash" onClick={() => setConfirm("clear")}>
                Clear all data
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.target.value = "";
              }}
            />
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Snapshot</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
              {[
                { label: "Net worth", value: fmtMoney(totals.netWorth) },
                { label: "Monthly surplus", value: `+${fmtMoney(totals.monthlySurplus)}` },
                { label: "Total debt", value: fmtMoney(totals.debtTotal) },
                { label: "Savings rate", value: `${totals.savingsRate.toFixed(0)}%` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-line bg-panel/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-dim">{s.label}</div>
                  <div className="mt-0.5 font-bold font-tabular">{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* confirm modal */}
      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === "reset" ? "Reset demo data?" : "Clear all data?"}
      >
        <p className="text-sm leading-relaxed text-fog">
          {confirm === "reset"
            ? "This replaces everything with the original demo profile — Amy's income, goals, transactions, and tasks. Your current edits will be lost."
            : "This wipes localStorage completely and reloads the seeded demo. There is no undo — export first if you want a backup."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={confirm === "reset" ? "refresh" : "trash"}
            onClick={() => {
              if (confirm === "reset") {
                resetDemo();
                setName("Amy");
                setIncome(4850);
                setSavings(7850);
                setInvestments(18420);
                toast("Demo data restored.");
              } else {
                clearAll();
                toast("Local data cleared — fresh demo loaded.", "info");
              }
              setConfirm(null);
            }}
          >
            {confirm === "reset" ? "Reset data" : "Clear everything"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
