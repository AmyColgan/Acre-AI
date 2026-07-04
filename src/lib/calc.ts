import type { CategoryId, Goal, PulseState } from "./types";
import { clamp, daysBetween, todayISO } from "./format";

/* ---------------------------------- totals --------------------------------- */

export interface Totals {
  fixedBudget: number;
  variableBudget: number;
  totalBudget: number;
  variableSpent30d: number;
  monthToDateVariable: number;
  debtTotal: number;
  debtMinPayments: number;
  debtBudget: number;
  investContribution: number;
  savingsPlanned: number;
  monthlySurplus: number; // income − all budgets
  freeBuffer: number; // surplus − debt − invest − savings plan
  netWorth: number;
  savingsRate: number; // % of income directed to savings+invest+extra debt
  safeToSpendWeek: number;
  weeklyAllowance: number;
  avgApr: number;
}

export function spentByCategory(
  state: PulseState,
  windowDays = 30
): Record<CategoryId, number> {
  const out = {} as Record<CategoryId, number>;
  for (const c of state.categories) out[c.id] = 0;
  const today = todayISO();
  for (const t of state.transactions) {
    if (t.type !== "expense") continue;
    const age = daysBetween(t.date, today);
    if (age < 0 || age >= windowDays) continue;
    const id = t.category as CategoryId;
    if (id in out) out[id] += t.amount;
  }
  for (const k of Object.keys(out) as CategoryId[]) out[k] = Math.round(out[k] * 100) / 100;
  return out;
}

export function getTotals(state: PulseState): Totals {
  const spent = spentByCategory(state);
  const fixedBudget = state.categories
    .filter((c) => c.kind === "fixed")
    .reduce((s, c) => s + c.budget, 0);
  const variableBudget = state.categories
    .filter((c) => c.kind === "variable")
    .reduce((s, c) => s + c.budget, 0);
  const variableSpent30d = state.categories
    .filter((c) => c.kind === "variable")
    .reduce((s, c) => s + spent[c.id], 0);

  // month-to-date variable spend (calendar month)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  let monthToDateVariable = 0;
  for (const t of state.transactions) {
    if (t.type !== "expense" || t.date < monthStart) continue;
    const cat = state.categories.find((c) => c.id === t.category);
    if (cat?.kind === "variable") monthToDateVariable += t.amount;
  }

  const debtTotal = state.debts.reduce((s, d) => s + d.balance, 0);
  const debtMinPayments = state.debts.reduce((s, d) => s + d.minPayment, 0);
  const debtGoal = state.goals.find((g) => g.name.toLowerCase().includes("debt"));
  const debtBudget = Math.max(debtMinPayments, debtGoal?.monthlyContribution ?? 0);
  const investContribution = state.portfolio.monthlyContribution;
  const savingsPlanned = state.goals
    .filter((g) => g.id !== debtGoal?.id && !g.name.toLowerCase().includes("retirement"))
    .reduce((s, g) => s + g.monthlyContribution, 0);

  const monthlySurplus = state.monthlyIncome - fixedBudget - variableBudget;
  const freeBuffer = monthlySurplus - debtBudget - investContribution - savingsPlanned;
  const netWorth = state.savingsBalance + state.portfolio.totalValue - debtTotal;
  const extraDebt = Math.max(0, debtBudget - debtMinPayments);
  const savingsRate =
    ((savingsPlanned + investContribution + extraDebt) / Math.max(1, state.monthlyIncome)) * 100;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const weeksLeft = Math.max(1, daysLeft / 7);
  const weeklyAllowance = variableBudget / (daysInMonth / 7);
  const safeToSpendWeek = Math.max(
    0,
    Math.round((variableBudget - monthToDateVariable) / weeksLeft)
  );

  const avgApr =
    debtTotal > 0
      ? state.debts.reduce((s, d) => s + d.apr * d.balance, 0) / debtTotal
      : 0;

  return {
    fixedBudget,
    variableBudget,
    totalBudget: fixedBudget + variableBudget,
    variableSpent30d: Math.round(variableSpent30d),
    monthToDateVariable: Math.round(monthToDateVariable),
    debtTotal,
    debtMinPayments,
    debtBudget,
    investContribution,
    savingsPlanned,
    monthlySurplus,
    freeBuffer,
    netWorth,
    savingsRate,
    safeToSpendWeek,
    weeklyAllowance: Math.round(weeklyAllowance),
    avgApr,
  };
}

/** Categories currently over their trailing-30-day budget, worst first. */
export function overspentCategories(state: PulseState) {
  const spent = spentByCategory(state);
  return state.categories
    .map((c) => ({ ...c, spent: spent[c.id], overBy: spent[c.id] - c.budget }))
    .filter((c) => c.overBy > 0)
    .sort((a, b) => b.overBy - a.overBy);
}

/* ------------------------------- health score ------------------------------ */

export interface SubScore {
  key: string;
  label: string;
  score: number; // 0–100
  status: "Strong" | "Stable" | "Needs attention" | "At risk";
  explanation: string;
  improved: string;
  worsened: string;
  action: string;
}

export interface HealthReport {
  total: number; // 0–1000
  band: "Excellent" | "Good" | "Fair" | "Needs work";
  subs: SubScore[];
  topFixes: string[];
  changeNote: string;
}

function statusFor(score: number): SubScore["status"] {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Stable";
  if (score >= 40) return "Needs attention";
  return "At risk";
}

export function getHealth(state: PulseState): HealthReport {
  const t = getTotals(state);
  const spent = spentByCategory(state);
  const monthlyExpenses = t.fixedBudget + t.variableBudget;

  // Cash flow: surplus as % of income; 25%+ = 100
  const surplusPct = (t.monthlySurplus / Math.max(1, state.monthlyIncome)) * 100;
  const cashFlow = clamp(Math.round((surplusPct / 25) * 100), 0, 100);

  // Debt health: debt-to-annual-income + APR pressure
  const dti = t.debtTotal / Math.max(1, state.monthlyIncome * 12);
  const aprPenalty = clamp((t.avgApr - 5) * 2.2, 0, 40);
  const debtHealth = clamp(Math.round(100 - dti * 180 - aprPenalty), 0, 100);

  // Savings stability: months of expenses covered; 6 months = 100
  const monthsCovered = state.savingsBalance / Math.max(1, monthlyExpenses);
  const savingsStability = clamp(Math.round((monthsCovered / 6) * 100), 0, 100);

  // Investment growth: contribution rate (15% of income = 100) + having a base
  const contribPct = (t.investContribution / Math.max(1, state.monthlyIncome)) * 100;
  const baseBoost = clamp(state.portfolio.totalValue / 1000, 0, 20);
  const investmentGrowth = clamp(Math.round((contribPct / 15) * 80 + baseBoost), 0, 100);

  // Risk protection: emergency fund progress
  const ef = state.goals.find((g) => g.id === state.emergencyFundGoalId);
  const efPct = ef ? clamp((ef.current / Math.max(1, ef.target)) * 100, 0, 100) : 0;
  const riskProtection = clamp(Math.round(efPct * 0.9 + (monthsCovered >= 3 ? 10 : 0)), 0, 100);

  // Spending discipline: penalize over-budget variable categories
  const variableCats = state.categories.filter((c) => c.kind === "variable");
  let overPenalty = 0;
  for (const c of variableCats) {
    const over = spent[c.id] - c.budget;
    if (over > 0) overPenalty += clamp((over / Math.max(1, c.budget)) * 55, 4, 30);
  }
  const spendingDiscipline = clamp(Math.round(88 - overPenalty), 0, 100);

  // Future readiness: blend of savings rate + goals with contributions
  const goalsFunded = state.goals.filter((g) => g.monthlyContribution > 0).length;
  const futureReadiness = clamp(
    Math.round(t.savingsRate * 2.4 + goalsFunded * 6 + efPct * 0.25),
    0,
    100
  );

  const subs: SubScore[] = [
    {
      key: "cashFlow",
      label: "Cash Flow",
      score: cashFlow,
      status: statusFor(cashFlow),
      explanation: `You keep ${surplusPct.toFixed(0)}% of income after budgeted expenses — $${Math.round(t.monthlySurplus).toLocaleString()} a month before savings and debt payments.`,
      improved: "Income has stayed steady across the last two pay cycles.",
      worsened: overspentCategories(state).length > 0 ? "Variable spending is eating into the monthly surplus." : "No pressure detected this month.",
      action: "Protect the surplus: keep variable spending inside its budget this week.",
    },
    {
      key: "debtHealth",
      label: "Debt Health",
      score: debtHealth,
      status: statusFor(debtHealth),
      explanation: `Total debt is $${t.debtTotal.toLocaleString()} at a weighted ${t.avgApr.toFixed(1)}% APR. The 24.99% card is the expensive part.`,
      improved: "Balances fell with this month's payments.",
      worsened: t.avgApr > 10 ? "High-interest card debt is still compounding against you." : "APR pressure is manageable.",
      action: "Send every extra debt dollar to the highest-APR card first.",
    },
    {
      key: "savingsStability",
      label: "Savings Stability",
      score: savingsStability,
      status: statusFor(savingsStability),
      explanation: `Savings cover ${monthsCovered.toFixed(1)} months of expenses. Three months is the safety floor; six is the target.`,
      improved: "Automatic transfers ran on schedule this month.",
      worsened: monthsCovered < 3 ? "Coverage is below the 3-month safety floor." : "Coverage is holding steady.",
      action: "Route spare cash to the emergency fund until it reaches 3 months of expenses.",
    },
    {
      key: "investmentGrowth",
      label: "Investment Growth",
      score: investmentGrowth,
      status: statusFor(investmentGrowth),
      explanation: `You invest ${contribPct.toFixed(1)}% of income ($${t.investContribution}/mo) on a $${state.portfolio.totalValue.toLocaleString()} base. 15% is the long-term benchmark.`,
      improved: "Contributions have not missed a month.",
      worsened: contribPct < 10 ? "Contribution rate is below the wealth-building benchmark." : "Contribution rate is on benchmark.",
      action: "Plan to raise contributions once high-interest debt is cleared.",
    },
    {
      key: "riskProtection",
      label: "Risk Protection",
      score: riskProtection,
      status: statusFor(riskProtection),
      explanation: ef
        ? `Your emergency fund is ${efPct.toFixed(0)}% funded ($${ef.current.toLocaleString()} of $${ef.target.toLocaleString()}).`
        : "No emergency fund goal is set.",
      improved: "Emergency fund balance grew this month.",
      worsened: efPct < 60 ? "A large surprise bill would still force borrowing." : "Shock absorbers look adequate.",
      action: "Make the emergency fund the first claim on every surplus dollar.",
    },
    {
      key: "spendingDiscipline",
      label: "Spending Discipline",
      score: spendingDiscipline,
      status: statusFor(spendingDiscipline),
      explanation:
        overspentCategories(state).length > 0
          ? `${overspentCategories(state).length} categor${overspentCategories(state).length === 1 ? "y is" : "ies are"} over budget on a trailing 30-day basis: ${overspentCategories(state).map((c) => c.name).join(", ")}.`
          : "Every category is inside its budget on a trailing 30-day basis.",
      improved: "Groceries and entertainment stayed under budget.",
      worsened:
        overspentCategories(state).length > 0
          ? `${overspentCategories(state)[0].name} is the biggest leak, $${Math.round(overspentCategories(state)[0].overBy)} over.`
          : "No leaks detected.",
      action: "Set a weekly cap on the most-over category and check it each Friday.",
    },
    {
      key: "futureReadiness",
      label: "Future Readiness",
      score: futureReadiness,
      status: statusFor(futureReadiness),
      explanation: `You direct ${t.savingsRate.toFixed(0)}% of income to savings, investing, and extra debt payoff, across ${goalsFunded} funded goals.`,
      improved: "All five goals have an active monthly contribution.",
      worsened: t.savingsRate < 20 ? "Below the 20% future-allocation benchmark." : "On the 20% benchmark.",
      action: "After the card is paid, roll its payment into goals to pass 20%.",
    },
  ];

  const weights: Record<string, number> = {
    cashFlow: 0.18,
    debtHealth: 0.16,
    savingsStability: 0.16,
    investmentGrowth: 0.13,
    riskProtection: 0.15,
    spendingDiscipline: 0.12,
    futureReadiness: 0.1,
  };
  const total = Math.round(
    subs.reduce((s, sub) => s + sub.score * (weights[sub.key] ?? 0.14), 0) * 10
  );

  const band =
    total >= 800 ? "Excellent" : total >= 650 ? "Good" : total >= 480 ? "Fair" : "Needs work";

  const weakest = [...subs].sort((a, b) => a.score - b.score).slice(0, 3);

  return {
    total,
    band,
    subs,
    topFixes: weakest.map((w) => w.action),
    changeNote:
      overspentCategories(state).length > 0
        ? `Your score is being held down mainly by ${weakest[0].label.toLowerCase()} — ${weakest[0].explanation}`
        : "Your score is steady. Keeping contributions automatic is what protects it.",
  };
}

/* --------------------------------- series ---------------------------------- */

/** Deterministic pseudo-random in [0,1) from an integer seed. */
function prand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function netWorthSeries(state: PulseState): { label: string; value: number }[] {
  const t = getTotals(state);
  const points: { label: string; value: number }[] = [];
  let v = t.netWorth;
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    points.unshift({
      label: new Date(d.getFullYear(), d.getMonth() - i, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
      value: Math.round(v),
    });
    // walk backwards: past months were lower by ~monthly progress ± noise
    v -= 620 + Math.round((prand(i + 3) - 0.35) * 520);
  }
  return points;
}

export function incomeExpenseSeries(state: PulseState): {
  label: string;
  income: number;
  expenses: number;
}[] {
  const t = getTotals(state);
  const out: { label: string; income: number; expenses: number }[] = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const noise = Math.round((prand(i + 11) - 0.5) * 260);
    out.push({
      label: new Date(d.getFullYear(), d.getMonth() - i, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
      income: state.monthlyIncome,
      expenses: clamp(t.fixedBudget + t.variableBudget + noise, 2600, state.monthlyIncome - 200),
    });
  }
  // current month: reflect real over/under pace
  const over = overspentCategories(state).reduce((s, c) => s + c.overBy, 0);
  out[out.length - 1].expenses = Math.round(t.fixedBudget + t.variableSpent30d + over * 0.2);
  return out;
}

export interface CalendarEvent {
  day: number; // day of current month
  name: string;
  amount: number; // + inflow, − outflow
  kind: "income" | "bill" | "subscription" | "savings" | "debt";
}

export function calendarEvents(state: PulseState): CalendarEvent[] {
  const t = getTotals(state);
  const housing = state.categories.find((c) => c.id === "housing")?.budget ?? 0;
  const utilities = state.categories.find((c) => c.id === "utilities")?.budget ?? 0;
  const subs = state.categories.find((c) => c.id === "subscriptions")?.budget ?? 0;
  const events: CalendarEvent[] = [
    { day: 1, name: "Paycheck", amount: state.monthlyIncome / 2, kind: "income" },
    { day: 1, name: "Rent", amount: -housing, kind: "bill" },
    { day: 5, name: "Savings transfer", amount: -Math.round(t.savingsPlanned / 2), kind: "savings" },
    { day: 8, name: "Streaming & software", amount: -Math.round(subs * 0.55), kind: "subscription" },
    { day: 12, name: "Internet", amount: -Math.round(utilities * 0.33), kind: "bill" },
    { day: 15, name: "Paycheck", amount: state.monthlyIncome / 2, kind: "income" },
    { day: 17, name: "Power & light", amount: -Math.round(utilities * 0.45), kind: "bill" },
    { day: 19, name: "Savings transfer", amount: -Math.round(t.savingsPlanned / 2), kind: "savings" },
    { day: 21, name: "Music & fitness", amount: -Math.round(subs * 0.45), kind: "subscription" },
    { day: 22, name: "Debt payments", amount: -t.debtBudget, kind: "debt" },
    { day: 26, name: "Investment contribution", amount: -t.investContribution, kind: "savings" },
    { day: 28, name: "Water utility", amount: -Math.round(utilities * 0.22), kind: "bill" },
  ];
  return events.sort((a, b) => a.day - b.day);
}

/** Daily projected checking balance for the current month, from calendar events + daily variable burn. */
export function cashFlowProjection(state: PulseState): {
  day: number;
  balance: number;
  danger: boolean;
}[] {
  const t = getTotals(state);
  const events = calendarEvents(state);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyVariable = t.variableBudget / daysInMonth;
  let balance = 1650; // working checking buffer
  const out: { day: number; balance: number; danger: boolean }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    for (const e of events.filter((e) => e.day === day)) balance += e.amount;
    balance -= dailyVariable;
    out.push({ day, balance: Math.round(balance), danger: balance < 250 });
  }
  return out;
}

export function lowBalanceDays(state: PulseState): number[] {
  return cashFlowProjection(state)
    .filter((d) => d.danger)
    .map((d) => d.day);
}

/* ------------------------------- goal math --------------------------------- */

export interface GoalMath {
  pct: number;
  remaining: number;
  monthsToDeadline: number;
  neededMonthly: number;
  projectedMonths: number | null;
  projectedDate: string | null;
  onTrack: boolean;
}

export function goalMath(goal: Goal): GoalMath {
  const today = todayISO();
  const remaining = Math.max(0, goal.target - goal.current);
  const daysToDeadline = Math.max(0, daysBetween(today, goal.deadline));
  const monthsToDeadline = Math.max(0.25, daysToDeadline / 30.44);
  const neededMonthly = remaining <= 0 ? 0 : remaining / monthsToDeadline;
  const projectedMonths =
    goal.monthlyContribution > 0 ? remaining / goal.monthlyContribution : null;
  let projectedDate: string | null = null;
  if (projectedMonths !== null) {
    const d = new Date();
    d.setDate(d.getDate() + Math.round(projectedMonths * 30.44));
    projectedDate = d.toISOString().slice(0, 10);
  }
  return {
    pct: clamp((goal.current / Math.max(1, goal.target)) * 100, 0, 100),
    remaining,
    monthsToDeadline,
    neededMonthly,
    projectedMonths,
    projectedDate,
    onTrack: remaining <= 0 || goal.monthlyContribution >= neededMonthly * 0.98,
  };
}

/* ----------------------------- wealth projection ---------------------------- */

export type PathKey = "current" | "recommended" | "aggressive" | "conservative";

export function wealthProjection(state: PulseState, years: number) {
  const t = getTotals(state);
  const start = Math.max(0, t.netWorth);
  const paths: Record<PathKey, { monthly: number; annualReturn: number }> = {
    current: { monthly: t.savingsPlanned + t.investContribution, annualReturn: 0.055 },
    recommended: {
      monthly: t.savingsPlanned + t.investContribution + Math.max(0, t.freeBuffer) * 0.7,
      annualReturn: 0.065,
    },
    aggressive: {
      monthly: t.savingsPlanned + t.investContribution + Math.max(0, t.freeBuffer),
      annualReturn: 0.08,
    },
    conservative: {
      monthly: (t.savingsPlanned + t.investContribution) * 0.75,
      annualReturn: 0.035,
    },
  };
  const out: Array<Record<string, number | string>> = [];
  const balances: Record<PathKey, number> = {
    current: start,
    recommended: start,
    aggressive: start,
    conservative: start,
  };
  const startYear = new Date().getFullYear();
  out.push({ label: `${startYear}`, current: start, recommended: start, aggressive: start, conservative: start });
  for (let y = 1; y <= years; y++) {
    for (const key of Object.keys(paths) as PathKey[]) {
      const p = paths[key];
      const r = p.annualReturn / 12;
      for (let m = 0; m < 12; m++) balances[key] = balances[key] * (1 + r) + p.monthly;
    }
    out.push({
      label: `${startYear + y}`,
      current: Math.round(balances.current),
      recommended: Math.round(balances.recommended),
      aggressive: Math.round(balances.aggressive),
      conservative: Math.round(balances.conservative),
    });
  }
  return out;
}

/* ------------------------------ portfolio math ------------------------------ */

export function portfolioGrowthSeries(state: PulseState) {
  const { startValue, totalValue } = state.portfolio;
  const out: { label: string; value: number }[] = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const progress = (11 - i) / 11;
    const base = startValue + (totalValue - startValue) * progress;
    const wobble = i === 0 ? 0 : Math.round((prand(i + 21) - 0.45) * 480);
    out.push({
      label: new Date(d.getFullYear(), d.getMonth() - i, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
      value: Math.round(base + wobble),
    });
  }
  return out;
}

export function contributionProjection(state: PulseState, years = 10) {
  const { totalValue, monthlyContribution } = state.portfolio;
  const riskReturn: Record<string, number> = { cautious: 0.05, balanced: 0.07, growth: 0.085 };
  const r = (riskReturn[state.profile.riskLevel] ?? 0.07) / 12;
  const out: { label: string; invested: number; projected: number }[] = [];
  let bal = totalValue;
  let invested = totalValue;
  const startYear = new Date().getFullYear();
  out.push({ label: `${startYear}`, invested: Math.round(invested), projected: Math.round(bal) });
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + r) + monthlyContribution;
      invested += monthlyContribution;
    }
    out.push({ label: `${startYear + y}`, invested: Math.round(invested), projected: Math.round(bal) });
  }
  return out;
}

/** 0–100 how well allocation matches the stated risk level. */
export function investmentAlignment(state: PulseState): number {
  const targets: Record<string, { growth: number; defensive: number }> = {
    cautious: { growth: 45, defensive: 55 },
    balanced: { growth: 65, defensive: 35 },
    growth: { growth: 85, defensive: 15 },
  };
  const a = state.portfolio.allocation;
  const growthShare = a.usStocks + a.intlStocks + a.alternatives;
  const target = targets[state.profile.riskLevel] ?? targets.balanced;
  const gap = Math.abs(growthShare - target.growth);
  return clamp(Math.round(100 - gap * 2.2), 0, 100);
}

/** Portfolio risk 0–100 from allocation. */
export function portfolioRisk(state: PulseState): number {
  const a = state.portfolio.allocation;
  const score =
    a.usStocks * 0.65 + a.intlStocks * 0.75 + a.alternatives * 1.0 + a.bonds * 0.25 + a.cash * 0.05;
  return clamp(Math.round(score), 0, 100);
}

/* ------------------------------ debt payoff math ---------------------------- */

export function debtInterestSavedByAvalanche(state: PulseState): number {
  // rough: extra dollars to highest APR first vs split evenly, over 12 months
  const t = getTotals(state);
  const extra = Math.max(0, t.debtBudget - t.debtMinPayments);
  if (extra <= 0 || state.debts.length < 2) return 0;
  const sorted = [...state.debts].sort((a, b) => b.apr - a.apr);
  const aprSpread = (sorted[0].apr - sorted[sorted.length - 1].apr) / 100;
  return Math.round(extra * 12 * aprSpread * 1.35);
}

export function monthsToPayoff(balance: number, apr: number, payment: number): number {
  if (payment <= 0) return Infinity;
  const r = apr / 100 / 12;
  if (r === 0) return Math.ceil(balance / payment);
  if (payment <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - (balance * r) / payment) / Math.log(1 + r));
}
