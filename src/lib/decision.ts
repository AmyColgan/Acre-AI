import type { DecisionInput, DecisionReport, PulseState } from "./types";
import { getTotals, goalMath, overspentCategories } from "./calc";
import { clamp, fmtMoney, todayISO, uid } from "./format";

export const QUICK_DECISIONS: DecisionInput[] = [
  {
    name: "Buy a $900 laptop",
    cost: 900,
    monthlyCost: 0,
    category: "Technology",
    urgency: "medium",
    deadline: "",
    fundingSource: "cash",
    notes: "Current laptop is slowing down but still works.",
  },
  {
    name: "Take a $1,800 trip",
    cost: 1800,
    monthlyCost: 0,
    category: "Travel",
    urgency: "low",
    deadline: "",
    fundingSource: "savings",
    notes: "One-week trip with friends this fall.",
  },
  {
    name: "Pay an extra $500 toward debt",
    cost: 500,
    monthlyCost: 0,
    category: "Debt payoff",
    urgency: "medium",
    deadline: "",
    fundingSource: "cash",
    notes: "Lump sum at the 24.99% card.",
  },
  {
    name: "Move apartments",
    cost: 2400,
    monthlyCost: 180,
    category: "Housing",
    urgency: "low",
    deadline: "",
    fundingSource: "savings",
    notes: "Deposit + movers now, ~$180/mo more in rent.",
  },
  {
    name: "Start investing $300/month more",
    cost: 0,
    monthlyCost: 300,
    category: "Investing",
    urgency: "low",
    deadline: "",
    fundingSource: "cash",
    notes: "Raise index fund contribution from $300 to $600.",
  },
  {
    name: "Buy a $22,000 car",
    cost: 3500,
    monthlyCost: 385,
    category: "Transportation",
    urgency: "low",
    deadline: "",
    fundingSource: "credit",
    notes: "$3,500 down, ~$385/mo financing for 60 months.",
  },
];

export function scoreDecision(state: PulseState, input: DecisionInput): DecisionReport {
  const t = getTotals(state);
  const ef = state.goals.find((g) => g.id === state.emergencyFundGoalId);
  const efm = ef ? goalMath(ef) : null;
  const travel = state.goals.find((g) => g.name.toLowerCase().includes("travel"));

  let score = 100;
  const cost = Math.max(0, input.cost);
  const monthly = Math.max(0, input.monthlyCost);

  // --- one-time cost pressure vs liquid savings
  const liquidity = state.savingsBalance;
  const costRatio = liquidity > 0 ? cost / liquidity : 1;
  score -= clamp(costRatio * 80, 0, 50);

  // --- recurring cost pressure vs free monthly buffer
  const buffer = Math.max(50, t.freeBuffer);
  const monthlyRatio = monthly / buffer;
  score -= clamp(monthlyRatio * 38, 0, 42);

  // --- emergency fund incomplete → spending big cash hurts more
  const efPct = efm ? efm.pct : 100;
  if (cost > 400 && efPct < 100) score -= clamp(((100 - efPct) / 100) * 26, 0, 26);

  // --- active overspending means discretionary purchases carry extra risk
  if (cost > 300 && overspentCategories(state).length > 0) score -= 5;

  // --- funding source
  if (input.fundingSource === "credit") score -= 16;
  if (input.fundingSource === "savings" && efPct < 100) score -= 8;

  // --- urgency helps
  if (input.urgency === "high") score += 10;
  if (input.urgency === "low") score -= 4;

  // --- special cases: money that works for you
  const isDebtPayoff = /debt|card|loan/i.test(input.category) || /debt|card|loan/i.test(input.name);
  const isInvesting = /invest/i.test(input.category) || /invest/i.test(input.name);
  if (isDebtPayoff) score = clamp(score + 38, 0, 96);
  if (isInvesting) {
    // investing more is good, but not before high-APR debt is gone
    const hasHighApr = state.debts.some((d) => d.apr > 15);
    score = clamp(score + (hasHighApr ? 12 : 30), 0, 92);
  }

  score = clamp(Math.round(score), 5, 98);

  const verdict: DecisionReport["verdict"] =
    score >= 78 ? "Do it now" : score >= 58 ? "Wait" : score >= 38 ? "Modify" : "Avoid";

  // --- impacts
  const efContribution = ef?.monthlyContribution ?? 430;
  const dailyEfPace = efContribution / 30.44;
  // a comfortable purchase funded from cash flow doesn't raid the emergency fund
  const raidsGoals = verdict !== "Do it now" || input.fundingSource !== "cash";
  const goalDelayDays =
    cost > 0 && efPct < 100 && raidsGoals ? Math.round(cost / Math.max(1, dailyEfPace)) : 0;
  const travelPace = (travel?.monthlyContribution ?? 120) / 30.44;
  const travelDelayDays =
    cost > 0 && travel && travel.current < travel.target
      ? Math.round((cost * 0.35) / Math.max(1, travelPace))
      : 0;

  const safeToSpendAfter = Math.max(
    0,
    t.safeToSpendWeek - Math.round(cost * 0.18) - Math.round(monthly / 4.33)
  );

  const riskLevel: DecisionReport["riskLevel"] =
    score >= 70 ? "low" : score >= 45 ? "medium" : "high";

  // --- narrative
  let explanation: string;
  if (isDebtPayoff) {
    explanation = `Sending ${fmtMoney(cost || monthly)} at your highest-interest debt is one of the highest-return moves available to you — the Sapphire card charges 24.99% APR, so every dollar paid is a guaranteed ~25% saved. Your savings can absorb it without touching bills.`;
  } else if (isInvesting) {
    const hasHighApr = state.debts.some((d) => d.apr > 15);
    explanation = hasHighApr
      ? `Investing more builds wealth, but your 24.99% card debt is a guaranteed loss that outpaces likely market returns. Pulse suggests clearing the card first, then raising contributions — same habit, better order.`
      : `With no high-interest debt in the way, raising contributions is a clean win. Your cash flow supports it with room to spare.`;
  } else if (verdict === "Do it now") {
    explanation = `It uses just ${(costRatio * 100).toFixed(0)}% of your savings${monthly > 0 ? ` plus ${fmtMoney(monthly)}/mo of buffer` : ""}, funded without touching goals — no timeline moves by more than a week.`;
  } else if (verdict === "Wait") {
    explanation = `You can afford this, but buying now delays your emergency fund by about ${goalDelayDays} days. Waiting until after rent clears on the 1st keeps your cash flow safer — the purchase gets cheaper in risk terms, not just in price.`;
  } else if (verdict === "Modify") {
    explanation = `At full price this crowds out your goals: ${fmtMoney(cost)} is ${(costRatio * 100).toFixed(0)}% of your savings${monthly > 0 ? ` plus a recurring ${fmtMoney(monthly)}/mo commitment` : ""}. A smaller version — or a 30-day pause to fund it deliberately — keeps the plan intact.`;
  } else {
    explanation = `This would strain your finances: it takes ${(costRatio * 100).toFixed(0)}% of your savings${monthly > 0 ? ` and locks in ${fmtMoney(monthly)}/mo you don't currently have free` : ""}, while your emergency fund sits at ${efPct.toFixed(0)}%. The cost isn't the price — it's the safety you give up.`;
  }

  const alternatives: string[] = [];
  if (isDebtPayoff) {
    alternatives.push("Split it: $350 to the card now, $150 after the 15th paycheck.");
    alternatives.push("Automate an extra $125/mo instead — same result in four months, smoother cash flow.");
  } else if (isInvesting) {
    alternatives.push("Raise contributions by $100 now, the rest after the card is paid off.");
    alternatives.push("Direct the same amount at the 24.99% card — a guaranteed return no fund matches.");
  } else {
    if (cost >= 500)
      alternatives.push(`Wait 30 days — your next two paychecks rebuild the buffer first.`);
    alternatives.push(
      `A ~${fmtMoney(Math.round(cost * 0.7))} version covers the need at 70% of the cost.`
    );
    if (input.fundingSource !== "cash")
      alternatives.push("Fund it from monthly cash flow over 2–3 months instead of savings.");
    else alternatives.push("Skip it and redirect the amount to your emergency fund.");
  }

  return {
    id: uid("dec"),
    createdAt: todayISO(),
    input,
    score,
    verdict,
    explanation,
    immediateCashImpact: -cost,
    monthlyCashFlowImpact: -monthly,
    savingsImpact:
      input.fundingSource === "savings" && cost > 0
        ? `Savings drop to ${fmtMoney(Math.max(0, state.savingsBalance - cost))} (${(costRatio * 100).toFixed(0)}% drawdown)`
        : cost > 0
          ? "No direct savings drawdown — funded from cash flow"
          : "No savings impact",
    debtImpact: isDebtPayoff
      ? `Debt falls to ${fmtMoney(Math.max(0, t.debtTotal - cost))} and payoff moves ~${Math.round(cost / 90)} weeks closer`
      : input.fundingSource === "credit"
        ? `Adds ${fmtMoney(cost + monthly * 12)} of first-year credit exposure`
        : "No debt impact",
    goalDelayDays,
    travelDelayDays,
    riskLevel,
    alternatives: alternatives.slice(0, 3),
    safeToSpendAfter,
  };
}
