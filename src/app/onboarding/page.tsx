"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Icon, type IconName } from "@/components/ui/icons";
import { Button, Field, MoneyInput, Segmented, TextInput } from "@/components/ui/core";
import { usePulse } from "@/lib/store";
import { createSeedState } from "@/lib/seed";
import { fmtMoney, uid, todayISO } from "@/lib/format";
import type { CoachingStyle, RiskLevel } from "@/lib/types";

interface Form {
  name: string;
  income: number | "";
  housing: number | "";
  utilities: number | "";
  groceries: number | "";
  transportation: number | "";
  subscriptions: number | "";
  entertainment: number | "";
  savings: number | "";
  investments: number | "";
  creditCard: number | "";
  loan: number | "";
  efTarget: number | "";
  travelTarget: number | "";
  homeTarget: number | "";
  risk: RiskLevel;
  coaching: CoachingStyle;
}

const DEMO: Form = {
  name: "Amy",
  income: 4850,
  housing: 1450,
  utilities: 195,
  groceries: 420,
  transportation: 280,
  subscriptions: 85,
  entertainment: 140,
  savings: 7850,
  investments: 18420,
  creditCard: 3200,
  loan: 6400,
  efTarget: 12000,
  travelTarget: 4000,
  homeTarget: 45000,
  risk: "balanced",
  coaching: "direct",
};

const STEP_TITLES = [
  "Welcome",
  "Income",
  "Expenses",
  "Savings & Investments",
  "Debt",
  "Goals",
  "Risk Comfort",
  "Coaching Style",
  "Review",
];

const BUILD_STEPS = [
  "Analyzing income",
  "Mapping expenses",
  "Detecting cash flow risks",
  "Calculating health score",
  "Building recommendations",
  "Preparing dashboard",
];

export default function Onboarding() {
  const router = useRouter();
  const { patch, toast } = usePulse();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({ ...DEMO, name: "" });
  const [building, setBuilding] = useState(false);
  const [buildIdx, setBuildIdx] = useState(0);
  const [error, setError] = useState("");

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  const num = (v: number | "") => (v === "" ? 0 : v);

  const validate = (): string => {
    if (step === 0 && !form.name.trim()) return "Tell Pulse your name so it can talk to you properly.";
    if (step === 1 && num(form.income) <= 0) return "Monthly income needs to be above zero.";
    if (step === 3 && form.savings === "") return "Enter a savings balance — 0 is a valid answer.";
    return "";
  };

  const next = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (step < STEP_TITLES.length - 1) setStep(step + 1);
    else startBuild(form);
  };

  const skipToDemo = () => startBuild({ ...DEMO });

  const startBuild = (f: Form) => {
    setBuilding(true);
    // assemble state from the form
    const seed = createSeedState({ name: f.name.trim() || "Amy", riskLevel: f.risk, coachingStyle: f.coaching });
    const today = todayISO();

    seed.monthlyIncome = num(f.income) || DEMO.income as number;
    seed.savingsBalance = num(f.savings);
    seed.portfolio.totalValue = num(f.investments);
    seed.portfolio.startValue = Math.round(num(f.investments) * 0.86);

    const budgetOverride: Record<string, number> = {
      housing: num(f.housing),
      utilities: num(f.utilities),
      groceries: num(f.groceries),
      transportation: num(f.transportation),
      subscriptions: num(f.subscriptions),
      entertainment: num(f.entertainment),
    };
    seed.categories = seed.categories.map((c) =>
      c.id in budgetOverride && budgetOverride[c.id] > 0 ? { ...c, budget: budgetOverride[c.id] } : c
    );

    seed.debts = [];
    if (num(f.creditCard) > 0)
      seed.debts.push({ id: uid("debt"), name: "Sapphire Rewards Card", balance: num(f.creditCard), apr: 24.99, minPayment: Math.max(35, Math.round(num(f.creditCard) * 0.03)) });
    if (num(f.loan) > 0)
      seed.debts.push({ id: uid("debt"), name: "Federal Student Loan", balance: num(f.loan), apr: 6.2, minPayment: Math.max(50, Math.round(num(f.loan) * 0.017)) });

    const totalDebt = seed.debts.reduce((s, d) => s + d.balance, 0);
    seed.goals = seed.goals
      .map((g) => {
        if (g.id === seed.emergencyFundGoalId)
          return { ...g, target: num(f.efTarget) || 12000, current: Math.min(num(f.savings), Math.round((num(f.efTarget) || 12000) * 0.51)) };
        if (g.name === "Travel Fund") return { ...g, target: num(f.travelTarget) || 4000, current: Math.min(1350, num(f.travelTarget) || 4000) };
        if (g.name === "Home Down Payment") return { ...g, target: num(f.homeTarget) || 45000 };
        if (g.name === "Debt Freedom")
          return totalDebt > 0
            ? { ...g, target: Math.round(totalDebt * 1.17), current: Math.round(totalDebt * 0.17) }
            : null;
        if (g.name === "Retirement") return { ...g, current: num(f.investments) };
        return g;
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    seed.flags = { launched: true };
    seed.profile.joinedAt = today;

    patch(() => seed);
  };

  // build screen sequencing
  useEffect(() => {
    if (!building) return;
    if (buildIdx >= BUILD_STEPS.length) {
      const t = setTimeout(() => {
        toast(`Welcome to Pulse, ${form.name.trim() || "Amy"}. Your plan is live.`);
        router.push("/dashboard");
      }, 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBuildIdx((i) => i + 1), 620);
    return () => clearTimeout(t);
  }, [building, buildIdx, router, toast, form.name]);

  const progress = ((step + 1) / STEP_TITLES.length) * 100;

  const expensesTotal = useMemo(
    () =>
      num(form.housing) + num(form.utilities) + num(form.groceries) + num(form.transportation) + num(form.subscriptions) + num(form.entertainment),
    [form]
  );

  /* ------------------------------ build screen ------------------------------ */
  if (building) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="orb orb-drift left-[-10%] top-[-10%] h-[480px] w-[480px] bg-teal-600/12" />
          <div className="orb orb-drift-slow right-[-8%] bottom-[-10%] h-[420px] w-[420px] bg-indigo-600/9" />
          <div className="bg-grid absolute inset-0" />
        </div>
        <div className="glass-strong relative w-full max-w-md rounded-2xl p-8 text-center scale-in">
          <span className="ai-pulse mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <Icon name="sparkles" size={28} />
          </span>
          <h1 className="font-display mt-6 text-xl">Building your financial intelligence system…</h1>
          <div className="mt-8 space-y-3 text-left">
            {BUILD_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                {i < buildIdx ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-mint">
                    <Icon name="check" size={11} strokeWidth={2.5} />
                  </span>
                ) : i === buildIdx ? (
                  <span className="ai-breathe h-5 w-5 rounded-full border-2 border-pulse" />
                ) : (
                  <span className="h-5 w-5 rounded-full border border-line" />
                )}
                <span className={i <= buildIdx ? "text-snow" : "text-dim"}>{s}</span>
                {i === buildIdx && <span className="ml-auto text-[10px] text-pulse">working…</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- step content ------------------------------ */
  const stepBody = () => {
    switch (step) {
      case 0:
        return (
          <>
            <StepIntro
              icon="sparkles"
              title={`Welcome to PULSE AI`}
              body="In about two minutes, Pulse builds a living plan from your real numbers. Everything stays in your browser — nothing is uploaded anywhere."
            />
            <Field label="What should Pulse call you?">
              <TextInput
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your first name"
                autoFocus
                maxLength={24}
              />
            </Field>
          </>
        );
      case 1:
        return (
          <>
            <StepIntro
              icon="dollar"
              title="Your income"
              body="Take-home pay after taxes. Pulse uses this as the anchor for every budget, goal, and recommendation."
            />
            <Field label="Monthly take-home income">
              <MoneyInput value={form.income} onValue={(v) => set("income", v)} placeholder="4850" />
            </Field>
          </>
        );
      case 2:
        return (
          <>
            <StepIntro
              icon="wallet"
              title="Your monthly expenses"
              body="Rough numbers are fine — you can refine every category later in Budget. Pulse fills sensible defaults for anything you skip."
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Housing / rent">
                <MoneyInput value={form.housing} onValue={(v) => set("housing", v)} placeholder="1450" />
              </Field>
              <Field label="Utilities">
                <MoneyInput value={form.utilities} onValue={(v) => set("utilities", v)} placeholder="195" />
              </Field>
              <Field label="Groceries">
                <MoneyInput value={form.groceries} onValue={(v) => set("groceries", v)} placeholder="420" />
              </Field>
              <Field label="Transportation">
                <MoneyInput value={form.transportation} onValue={(v) => set("transportation", v)} placeholder="280" />
              </Field>
              <Field label="Subscriptions">
                <MoneyInput value={form.subscriptions} onValue={(v) => set("subscriptions", v)} placeholder="85" />
              </Field>
              <Field label="Entertainment">
                <MoneyInput value={form.entertainment} onValue={(v) => set("entertainment", v)} placeholder="140" />
              </Field>
            </div>
            {expensesTotal > 0 && (
              <p className="text-xs text-fog">
                Listed so far: <span className="font-semibold text-snow font-tabular">{fmtMoney(expensesTotal)}</span>/mo
                {num(form.income) > 0 && (
                  <> — {Math.round((expensesTotal / num(form.income)) * 100)}% of income</>
                )}
              </p>
            )}
          </>
        );
      case 3:
        return (
          <>
            <StepIntro
              icon="bank"
              title="Savings & investments"
              body="Your current balances. These power your net worth, emergency-fund math, and wealth projections."
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Savings balance">
                <MoneyInput value={form.savings} onValue={(v) => set("savings", v)} placeholder="7850" />
              </Field>
              <Field label="Investment balance">
                <MoneyInput value={form.investments} onValue={(v) => set("investments", v)} placeholder="18420" />
              </Field>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <StepIntro
              icon="unlock"
              title="Your debt"
              body="Pulse treats high-interest debt as a fire to put out and low-interest debt as a schedule to keep. Enter 0 if none."
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Credit card debt" hint="assumed ~24.99% APR">
                <MoneyInput value={form.creditCard} onValue={(v) => set("creditCard", v)} placeholder="3200" />
              </Field>
              <Field label="Loan debt" hint="assumed ~6.2% APR">
                <MoneyInput value={form.loan} onValue={(v) => set("loan", v)} placeholder="6400" />
              </Field>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <StepIntro
              icon="target"
              title="Your goals"
              body="Three starter goals — you can add, edit, or remove goals any time. Pulse detects when they compete for the same dollars."
            />
            <div className="space-y-3">
              <Field label="Emergency fund target">
                <MoneyInput value={form.efTarget} onValue={(v) => set("efTarget", v)} placeholder="12000" />
              </Field>
              <Field label="Travel goal target">
                <MoneyInput value={form.travelTarget} onValue={(v) => set("travelTarget", v)} placeholder="4000" />
              </Field>
              <Field label="Home down-payment target">
                <MoneyInput value={form.homeTarget} onValue={(v) => set("homeTarget", v)} placeholder="45000" />
              </Field>
            </div>
          </>
        );
      case 6:
        return (
          <>
            <StepIntro
              icon="gauge"
              title="Risk comfort"
              body="This shapes how Pulse projects your investments and how strongly it warns you about volatility."
            />
            <Segmented
              value={form.risk}
              onChange={(v) => set("risk", v)}
              options={[
                { value: "cautious", label: "Cautious", hint: "protect first" },
                { value: "balanced", label: "Balanced", hint: "steady growth" },
                { value: "growth", label: "Growth", hint: "maximize upside" },
              ]}
            />
          </>
        );
      case 7:
        return (
          <>
            <StepIntro
              icon="sparkles"
              title="Coaching style"
              body="How should Pulse talk to you? Same math either way — different voice."
            />
            <Segmented
              value={form.coaching}
              onChange={(v) => set("coaching", v)}
              options={[
                { value: "gentle", label: "Gentle", hint: "encouraging" },
                { value: "direct", label: "Direct", hint: "straight answers" },
                { value: "analytical", label: "Analytical", hint: "show the math" },
              ]}
            />
          </>
        );
      case 8: {
        const rows = [
          ["Name", form.name.trim() || "Amy"],
          ["Monthly income", fmtMoney(num(form.income))],
          ["Listed expenses", fmtMoney(expensesTotal) + "/mo"],
          ["Savings", fmtMoney(num(form.savings))],
          ["Investments", fmtMoney(num(form.investments))],
          ["Total debt", fmtMoney(num(form.creditCard) + num(form.loan))],
          ["Emergency fund target", fmtMoney(num(form.efTarget))],
          ["Risk / coaching", `${form.risk} · ${form.coaching}`],
        ];
        return (
          <>
            <StepIntro
              icon="checkCircle"
              title="Review your setup"
              body="Everything editable later in Settings. If it looks right, Pulse will build your plan."
            />
            <div className="overflow-hidden rounded-xl border border-line">
              {rows.map(([k, v], i) => (
                <div key={k} className={clsx("flex items-center justify-between px-4 py-2.5 text-sm", i % 2 === 0 && "bg-panel/50")}>
                  <span className="text-fog">{k}</span>
                  <span className="font-medium capitalize font-tabular">{v}</span>
                </div>
              ))}
            </div>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-5 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="orb orb-drift left-[-10%] top-[-10%] h-[480px] w-[480px] bg-teal-600/12" />
        <div className="orb orb-drift-slow right-[-8%] bottom-[-10%] h-[420px] w-[420px] bg-indigo-600/9" />
        <div className="bg-grid absolute inset-0" />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        {/* progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-dim">
            <span>
              Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
            </span>
            <button onClick={skipToDemo} className="text-pulse transition-colors hover:text-snow cursor-pointer">
              Skip — use demo data
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raise">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div key={step} className="glass rise-in flex-1 rounded-2xl p-6 sm:p-8">
          <div className="space-y-5">{stepBody()}</div>
          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-coral">
              <Icon name="alert" size={14} /> {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" icon="chevronLeft" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          <Button size="lg" onClick={next}>
            {step === STEP_TITLES.length - 1 ? "Build my plan" : "Next"}
            <Icon name="arrowRight" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepIntro({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-emerald-500/15 text-pulse">
        <Icon name={icon} size={21} />
      </span>
      <h1 className="font-display mt-4 text-[1.4rem] tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-fog">{body}</p>
    </div>
  );
}
