import type { PulseState } from "./types";
import {
  debtInterestSavedByAvalanche,
  getHealth,
  getTotals,
  goalMath,
  monthsToPayoff,
  overspentCategories,
  portfolioRisk,
} from "./calc";
import { fmtMoney } from "./format";
import { scoreDecision } from "./decision";

export interface AiResponse {
  topic: string;
  answer: string;
  impact: string;
  riskLevel: "low" | "medium" | "high";
  action: string;
  alternatives: string[];
  projection: string;
  decisionScore?: number;
  /** prefill for Decision Mode when the question is a purchase */
  decisionPrefill?: { name: string; cost: number };
}

const stylePrefix: Record<string, (name: string) => string> = {
  gentle: () => "Here's a kind way to look at it: ",
  direct: () => "",
  analytical: () => "Running the numbers: ",
};

function tone(state: PulseState, s: string): string {
  const prefix = stylePrefix[state.profile.coachingStyle]?.(state.profile.name) ?? "";
  return prefix + s;
}

/** Extract a dollar amount from free text, e.g. "can I afford a $900 laptop". */
function extractAmount(q: string): number | null {
  const m = q.replace(/,/g, "").match(/\$?\s?(\d{2,7})(?:\.\d+)?/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 20 ? n : null;
}

export function answerQuestion(state: PulseState, question: string): AiResponse {
  const q = question.toLowerCase();
  const t = getTotals(state);
  const health = getHealth(state);
  const ef = state.goals.find((g) => g.id === state.emergencyFundGoalId);
  const efm = ef ? goalMath(ef) : null;

  /* ---- purchase / affordability ---- */
  if (/afford|buy|purchase|worth it|should i get/.test(q)) {
    const amount = extractAmount(q) ?? 500;
    const thing =
      q.match(/afford (?:a|an|the)?\s*\$?[\d,]*\s*([a-z ]{3,30})/)?.[1]?.trim() ?? "this purchase";
    const report = scoreDecision(state, {
      name: `Buy ${thing} (${fmtMoney(amount)})`,
      cost: amount,
      monthlyCost: 0,
      category: "Purchase",
      urgency: "medium",
      deadline: "",
      fundingSource: "cash",
      notes: "",
    });
    return {
      topic: `Can I afford ${fmtMoney(amount)}?`,
      answer: tone(
        state,
        `${report.verdict === "Do it now" ? "Yes — comfortably." : report.verdict === "Wait" ? "Yes, but timing matters." : report.verdict === "Modify" ? "Only in a smaller form." : "Not right now."} ${report.explanation}`
      ),
      impact: `${fmtMoney(-amount, { signed: true })} cash now · safe-to-spend drops to ${fmtMoney(report.safeToSpendAfter)}/wk · emergency fund ${report.goalDelayDays > 0 ? `delayed ~${report.goalDelayDays} days` : "unaffected"}`,
      riskLevel: report.riskLevel,
      action:
        report.verdict === "Do it now"
          ? "Fund it from checking after the 15th paycheck and keep your savings transfer unchanged."
          : report.verdict === "Wait"
            ? "Set a 30-day reminder — buy after rent clears and two paychecks land."
            : "Run it through Decision Mode and compare the cheaper option side-by-side.",
      alternatives: report.alternatives,
      projection: `If you skip it entirely and redirect the ${fmtMoney(amount)} to savings, your emergency fund reaches ${efm ? `${Math.min(100, Math.round(efm.pct + (amount / (ef?.target ?? 12000)) * 100))}%` : "full"} this quarter.`,
      decisionScore: report.score,
      decisionPrefill: { name: `Buy ${thing}`, cost: amount },
    };
  }

  /* ---- which debt first ---- */
  if (/debt|loan|card|payoff|interest/.test(q) && /which|first|pay|priorit|order|extra/.test(q)) {
    const sorted = [...state.debts].sort((a, b) => b.apr - a.apr);
    const top = sorted[0];
    const saved = debtInterestSavedByAvalanche(state);
    const months = top ? monthsToPayoff(top.balance, top.apr, t.debtBudget - (sorted[1]?.minPayment ?? 0)) : 0;
    return {
      topic: "Which debt to pay first",
      answer: tone(
        state,
        top
          ? `Pay the ${top.name} first. At ${top.apr}% APR it costs you roughly ${fmtMoney(Math.round((top.balance * top.apr) / 100 / 12))} in interest every month — about ${(top.apr / Math.max(1, sorted[1]?.apr ?? 1)).toFixed(1)}× the rate on your ${sorted[1]?.name ?? "other debt"}. Keep minimums on everything else and aim every extra dollar there.`
          : "You're debt-free — there's nothing to prioritize. Your extra cash flow can go straight to goals."
      ),
      impact: top
        ? `Avalanche order saves ≈ ${fmtMoney(saved)} in interest vs. splitting payments · card cleared in ~${months} months at your current ${fmtMoney(t.debtBudget)}/mo debt budget`
        : "No interest costs to reduce",
      riskLevel: "low",
      action: top
        ? `Direct ${fmtMoney(Math.max(0, t.debtBudget - (sorted[1]?.minPayment ?? 0)))}/mo at the ${top.name}; keep the ${fmtMoney(sorted[1]?.minPayment ?? 0)} minimum on the ${sorted[1]?.name ?? "rest"}.`
        : "Redirect your old debt budget to the emergency fund.",
      alternatives: [
        "Snowball instead (smallest balance first) if you need the motivational win — it costs slightly more in interest.",
        "A 0% balance-transfer card could pause the 24.99% interest, if the transfer fee is under 3%.",
      ],
      projection: top
        ? `After the ${top.name} is gone, rolling its payment into the ${sorted[1]?.name ?? "next debt"} makes you debt-free roughly ${Math.round((months ?? 12) * 0.4)} months sooner than paying evenly.`
        : "Stay the course.",
    };
  }

  /* ---- save more this month ---- */
  if (/save more|saving more|cut|spend less|lower.*spend|how can i save/.test(q)) {
    const over = overspentCategories(state);
    const targets = over.slice(0, 2);
    const recoverable = Math.round(targets.reduce((s, c) => s + c.overBy, 0)) + 34;
    return {
      topic: "How to save more this month",
      answer: tone(
        state,
        targets.length > 0
          ? `Your fastest wins are ${targets.map((c) => c.name.toLowerCase()).join(" and ")} — together they're running ${fmtMoney(Math.round(targets.reduce((s, c) => s + c.overBy, 0)))} over budget on a trailing 30-day basis. Add the $34/month hiding in unused subscriptions and you can free about ${fmtMoney(recoverable)} without touching anything you'd miss.`
          : `Your categories are all inside budget, so the lever is structural: raise your automatic savings transfer. Your free buffer is ${fmtMoney(Math.max(0, t.freeBuffer))}/mo — moving even half of it before you can spend it is the cleanest raise your savings can get.`
      ),
      impact: `≈ ${fmtMoney(recoverable)}/mo recoverable · that's ${fmtMoney(recoverable * 12)} a year, or ${efm && recoverable > 0 ? `${Math.round((efm.remaining / (recoverable + (ef?.monthlyContribution ?? 0))) - (efm.projectedMonths ?? 0)) * -1} months faster` : "months faster"} to a full emergency fund`,
      riskLevel: "low",
      action: "Set weekly caps on the two over-budget categories and cancel the two dormant subscriptions today.",
      alternatives: [
        "Move the savings transfer to payday morning so spending never sees the money.",
        "Try a two-week 'no new shopping' sprint — average recovery is $80–$120.",
      ],
      projection: `Saving an extra ${fmtMoney(recoverable)}/mo lifts your savings rate from ${t.savingsRate.toFixed(0)}% to ${(t.savingsRate + (recoverable / state.monthlyIncome) * 100).toFixed(0)}% and adds ≈ ${fmtMoney(recoverable * 12 * 5)} to net worth over five years.`,
    };
  }

  /* ---- emergency fund on track ---- */
  if (/emergency/.test(q)) {
    if (!ef || !efm)
      return fallback(state, "Emergency fund", "You don't have an emergency fund goal yet — create one in Goals and Pulse will track it.");
    return {
      topic: "Emergency fund progress",
      answer: tone(
        state,
        `You're ${efm.pct.toFixed(0)}% of the way there — ${fmtMoney(ef.current)} of ${fmtMoney(ef.target)}. At ${fmtMoney(ef.monthlyContribution)}/mo you'll finish around ${efm.projectedDate ? new Date(efm.projectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}, which is ${efm.onTrack ? "ahead of" : "behind"} your deadline. ${efm.onTrack ? "You're on track — protect the transfer and this takes care of itself." : `To hit the deadline you'd need ${fmtMoney(Math.ceil(efm.neededMonthly))}/mo instead.`}`
      ),
      impact: `${fmtMoney(efm.remaining)} remaining · covers ${(ef.current / Math.max(1, t.fixedBudget + t.variableBudget)).toFixed(1)} months of expenses today`,
      riskLevel: efm.pct >= 60 ? "low" : "medium",
      action: efm.onTrack
        ? "Keep the automatic transfer — and route any windfall here first."
        : `Raise the monthly transfer to ${fmtMoney(Math.ceil(efm.neededMonthly))} or move the deadline out.`,
      alternatives: [
        "Park the fund in a 4.4% APY high-yield account — it adds ≈ $288/yr by itself.",
        "Pause the travel contribution for 3 months to accelerate — Pulse flags this conflict in Goals.",
      ],
      projection: `Each extra $100/mo pulls the finish date about ${Math.round(((efm.projectedMonths ?? 12) - efm.remaining / (ef.monthlyContribution + 100)) * 30)} days closer.`,
    };
  }

  /* ---- extra $500 ---- */
  if (/extra|windfall|bonus|500|what should i do with/.test(q) && /\$|500|extra|bonus|windfall/.test(q)) {
    const amount = extractAmount(q) ?? 500;
    const cardDebt = state.debts.find((d) => d.apr > 15);
    return {
      topic: `Best use of an extra ${fmtMoney(amount)}`,
      answer: tone(
        state,
        cardDebt
          ? `Split it with purpose: ${fmtMoney(Math.round(amount * 0.6))} at the ${cardDebt.name} (24.99% APR is a guaranteed loss you can switch off) and ${fmtMoney(Math.round(amount * 0.4))} to your emergency fund. That order beats investing right now because no realistic market return outruns a 25% interest rate.`
          : `Your emergency fund is the strongest next move — it's ${efm ? efm.pct.toFixed(0) : 0}% funded. Put the full ${fmtMoney(amount)} there; once it hits 100%, extra cash starts flowing to investments instead.`
      ),
      impact: cardDebt
        ? `≈ ${fmtMoney(Math.round(amount * 0.6 * 0.25))} interest avoided over 12 months + emergency fund moves ${efm ? `${((amount * 0.4) / (ef?.target ?? 12000) * 100).toFixed(0)}%` : ""} closer to done`
        : `Emergency fund jumps ${((amount / (ef?.target ?? 12000)) * 100).toFixed(0)}% in one move`,
      riskLevel: "low",
      action: cardDebt
        ? `Send ${fmtMoney(Math.round(amount * 0.6))} to the ${cardDebt.name} today; auto-transfer the rest to savings.`
        : "Transfer it to savings today, before it becomes spending.",
      alternatives: [
        "100% to the card — fastest interest relief, less safety margin.",
        "100% to savings — maximum cushion, but the card keeps costing ~$66/mo.",
        "Invest it — only compelling once the 24.99% card is gone.",
      ],
      projection: `Repeating this split with future windfalls clears the card ~4 months early and finishes the emergency fund ${efm ? "about 6 weeks sooner" : "sooner"}.`,
    };
  }

  /* ---- investment risk ---- */
  if (/invest|portfolio|risk|allocation|stock/.test(q)) {
    const risk = portfolioRisk(state);
    const a = state.portfolio.allocation;
    const growthShare = a.usStocks + a.intlStocks + a.alternatives;
    return {
      topic: "Is my investment risk right?",
      answer: tone(
        state,
        `Your portfolio is ${growthShare}% growth assets (US stocks ${a.usStocks}%, international ${a.intlStocks}%, alternatives ${a.alternatives}%) — a risk level of ${risk}/100, which reads as ${risk > 65 ? "aggressive" : risk > 45 ? "moderately risky" : "conservative"} against your "${state.profile.riskLevel}" profile. The allocation itself is reasonable for long-term wealth. The sharper issue is sequencing: your emergency fund is ${efm ? efm.pct.toFixed(0) : 0}% funded, so a market dip plus a surprise bill would force selling at the wrong time.`
      ),
      impact: `Risk ${risk}/100 · ${growthShare}% growth / ${a.bonds + a.cash}% defensive · ${fmtMoney(state.portfolio.monthlyContribution)}/mo contributions`,
      riskLevel: risk > 70 ? "medium" : "low",
      action: "Keep the allocation, keep the $300/mo — and finish the emergency fund before raising either.",
      alternatives: [
        "Shift 5–8% from alternatives to bonds if market swings cost you sleep.",
        "Move to a target-date fund to automate rebalancing entirely.",
      ],
      projection: `At your current contribution and a 7% average return, the portfolio reaches ≈ ${fmtMoney(64000, { compact: true })} in 10 years; raising contributions to $400 after debt payoff pushes that past ${fmtMoney(80000, { compact: true })}.`,
    };
  }

  /* ---- improve health score ---- */
  if (/score|health|improve|1000/.test(q)) {
    const weakest = [...health.subs].sort((a, b) => a.score - b.score).slice(0, 3);
    return {
      topic: "Improving your health score",
      answer: tone(
        state,
        `Your score is ${health.total}/1000 (${health.band.toLowerCase()}). The three levers holding it down are ${weakest.map((w) => `${w.label.toLowerCase()} (${w.score}/100)`).join(", ")}. Scores move when structure changes, not willpower — automate the fix once and the points follow.`
      ),
      impact: `Fixing the top item alone is worth roughly +${Math.round((70 - weakest[0].score) * 1.5)} points`,
      riskLevel: "low",
      action: weakest[0].action,
      alternatives: weakest.slice(1).map((w) => w.action),
      projection: `Completing all three actions lifts the score toward ${Math.min(1000, health.total + 90)} within two months — from "${health.band}" toward "${health.total + 90 >= 800 ? "Excellent" : health.total + 90 >= 650 ? "Good" : "Fair"}".`,
    };
  }

  /* ---- budget status ---- */
  if (/budget|spending|overspend|safe to spend/.test(q)) {
    const over = overspentCategories(state);
    return {
      topic: "Budget status",
      answer: tone(
        state,
        over.length > 0
          ? `You have ${fmtMoney(t.safeToSpendWeek)} safe to spend this week. ${over.length} categor${over.length === 1 ? "y is" : "ies are"} running hot: ${over.map((c) => `${c.name.toLowerCase()} (${fmtMoney(Math.round(c.overBy))} over)`).join(", ")}. Everything else is inside plan, so this is a trim, not an overhaul.`
          : `You have ${fmtMoney(t.safeToSpendWeek)} safe to spend this week and every category is inside its budget. Your money is stable this month.`
      ),
      impact: `Safe to spend: ${fmtMoney(t.safeToSpendWeek)}/wk · variable budget ${fmtMoney(t.variableBudget)} with ${fmtMoney(Math.max(0, t.variableBudget - t.variableSpent30d))} of trailing-30-day headroom`,
      riskLevel: over.length > 1 ? "medium" : "low",
      action: over.length > 0 ? `Cap ${over[0].name.toLowerCase()} for the rest of the month and let the other categories run as planned.` : "No action needed — keep the current caps.",
      alternatives: ["Turn on the weekly Friday budget check-in.", "Move $50 of shopping budget to dining if that matches how you actually live."],
      projection: `Holding variable spending to budget for 60 days adds ≈ ${fmtMoney(Math.round(over.reduce((s, c) => s + c.overBy, 0) * 2))} to savings and raises your discipline subscore by ~15 points.`,
    };
  }

  return fallback(state, "Your financial picture", "");
}

function fallback(state: PulseState, topic: string, lead: string): AiResponse {
  const t = getTotals(state);
  const health = getHealth(state);
  const over = overspentCategories(state);
  return {
    topic,
    answer: tone(
      state,
      `${lead}${lead ? " " : ""}Here's where you stand: net worth ${fmtMoney(t.netWorth)}, health score ${health.total}/1000 (${health.band.toLowerCase()}), and ${fmtMoney(t.safeToSpendWeek)} safe to spend this week. ${over.length > 0 ? `The one thing needing attention is ${over[0].name.toLowerCase()} — ${fmtMoney(Math.round(over[0].overBy))} over its 30-day budget.` : "No category is over budget right now."} Ask me about a purchase, your debts, goals, or how to raise the score — I'll run the numbers on your actual data.`
    ),
    impact: `Surplus ${fmtMoney(t.monthlySurplus)}/mo before savings & debt · savings rate ${t.savingsRate.toFixed(0)}%`,
    riskLevel: "low",
    action: over.length > 0 ? `Rein in ${over[0].name.toLowerCase()} this week.` : "Keep contributions automatic.",
    alternatives: [
      "Try: “Can I afford a $900 laptop?”",
      "Try: “Which debt should I pay first?”",
      "Try: “What should I do with an extra $500?”",
    ],
    projection: `On your current path, net worth reaches ≈ ${fmtMoney(t.netWorth + Math.round((t.savingsPlanned + t.investContribution) * 12 * 1.03))} in a year.`,
  };
}

/* ------------------------------ dashboard brief ----------------------------- */

export interface DailyBrief {
  status: string;
  warning: string;
  opportunity: string;
  recommendation: string;
  confidence: number;
  applyAmount: number;
  explanation: string;
}

export function dailyBrief(state: PulseState): DailyBrief {
  const t = getTotals(state);
  const over = overspentCategories(state);
  const ef = state.goals.find((g) => g.id === state.emergencyFundGoalId);
  const efm = ef ? goalMath(ef) : null;
  const applied = state.flags["briefApplied"];

  if (over.length > 0 && !applied) {
    const names = over.slice(0, 2).map((c) => c.name.toLowerCase());
    const overTotal = Math.round(over.reduce((s, c) => s + c.overBy, 0));
    const overPct = Math.round(
      (overTotal / Math.max(1, over.reduce((s, c) => s + c.budget, 0))) * 100
    );
    const delayDays = efm ? Math.round(overTotal / Math.max(1, (ef?.monthlyContribution ?? 430) / 30)) : 0;
    return {
      status: "You are financially stable this month — income, bills, and goal transfers are all on schedule.",
      warning: `Your ${names.join(" and ")} categor${names.length > 1 ? "ies are" : "y is"} trending ${overPct}% above normal. If this continues, your emergency fund goal will be delayed by about ${delayDays} days.`,
      opportunity: "Two dormant subscriptions and a high-yield savings switch are sitting in your Opportunity Feed, worth ≈ $61/mo combined.",
      recommendation: `Pulse recommends moving $250 into savings today and holding flexible spending to ${fmtMoney(t.safeToSpendWeek)} this week.`,
      confidence: 87,
      applyAmount: 250,
      explanation: `How this was calculated: trailing 30-day spend in ${names.join(" + ")} is ${fmtMoney(overTotal)} above budget (${overPct}%). Your emergency fund grows ${fmtMoney(ef?.monthlyContribution ?? 430)}/mo (≈ ${fmtMoney(Math.round((ef?.monthlyContribution ?? 430) / 30))}/day), so an unchecked ${fmtMoney(overTotal)} overrun delays completion by ≈ ${delayDays} days. Moving $250 now offsets the drift; the ${fmtMoney(t.safeToSpendWeek)} weekly cap is your remaining variable budget spread over the weeks left this month.`,
    };
  }

  return {
    status: "Your money is stable and your plan is running itself — transfers, bills, and contributions are all on schedule.",
    warning: over.length > 0 ? `Watch ${over[0].name.toLowerCase()}: still ${fmtMoney(Math.round(over[0].overBy))} over its 30-day pace.` : "No spending categories are over budget right now.",
    opportunity: "Your Opportunity Feed has unclaimed wins — the 4.4% APY savings switch alone is worth ≈ $288/yr.",
    recommendation: `Keep this week's flexible spending at ${fmtMoney(t.safeToSpendWeek)} and let the automatic transfers do the work.`,
    confidence: 91,
    applyAmount: 0,
    explanation: `How this was calculated: income minus budgeted expenses leaves ${fmtMoney(t.monthlySurplus)}/mo, which currently covers your ${fmtMoney(t.savingsPlanned)} savings plan, ${fmtMoney(t.debtBudget)} debt budget, and ${fmtMoney(t.investContribution)} investing with ${fmtMoney(Math.max(0, t.freeBuffer))} to spare. The weekly figure is your remaining variable budget divided across the weeks left this month.`,
  };
}

export const SUGGESTED_PROMPTS = [
  "Can I afford a $900 laptop?",
  "Which debt should I pay first?",
  "How can I save more this month?",
  "Am I on track for my emergency fund?",
  "What should I do with an extra $500?",
  "Is my investment risk too high?",
  "How do I improve my financial health score?",
];
