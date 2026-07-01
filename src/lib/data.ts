// Mock data for the Acre product demo. All figures are illustrative.

export type Range = "1M" | "6M" | "1Y" | "5Y";

const NET_WORTH_5Y = [
  312000, 318500, 322100, 329800, 335200, 340100, 347600, 352300, 358900,
  365200, 371800, 379500, 388200, 394700, 401300, 408900, 417200, 423600,
  430100, 438700, 447300, 452900, 461400, 470200, 478800, 486300, 493700,
  501200, 508900, 516400, 524800, 532100, 539700, 547300, 553900, 561200,
  568700, 574300, 581900, 589400, 596800, 603200, 609700, 617300, 624900,
  632400, 639800, 647100, 654700, 662300, 668900, 676400, 683900, 691200,
  698700, 706300, 713800, 721200, 728700, 736100,
];

const NET_WORTH_LABELS_5Y = (() => {
  const labels: string[] = [];
  const start = new Date(2021, 6, 1);
  for (let i = 0; i < NET_WORTH_5Y.length; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
  }
  return labels;
})();

export function netWorthSeries(range: Range) {
  const counts: Record<Range, number> = { "1M": 4, "6M": 6, "1Y": 12, "5Y": 60 };
  const n = counts[range];
  const values = NET_WORTH_5Y.slice(-n);
  const labels =
    range === "1M"
      ? ["Week 1", "Week 2", "Week 3", "Week 4"]
      : NET_WORTH_LABELS_5Y.slice(-n);
  return values.map((value, i) => ({ label: labels[i], value }));
}

export const netWorthNow = NET_WORTH_5Y[NET_WORTH_5Y.length - 1];
export const netWorthDeltaYear =
  (NET_WORTH_5Y[NET_WORTH_5Y.length - 1] - NET_WORTH_5Y[NET_WORTH_5Y.length - 13]) /
  NET_WORTH_5Y[NET_WORTH_5Y.length - 13];

export const dashboardStats = {
  income: 14200,
  expenses: 8460,
  savingsRate: 0.404,
  netWorth: netWorthNow,
  netWorthDelta: netWorthDeltaYear,
  healthScore: 82,
};

export const upcomingBills = [
  { name: "Mortgage, 14 Birchwood Ln", amount: 3120, due: "Jul 3" },
  { name: "Private school tuition", amount: 2400, due: "Jul 5" },
  { name: "Umbrella insurance", amount: 340, due: "Jul 9" },
  { name: "Audi Q7 lease", amount: 612, due: "Jul 12" },
];

export const budgetCategories = [
  { name: "Housing", value: 3120, colorVar: "--color-chart-1" },
  { name: "Investing", value: 2000, colorVar: "--color-chart-2" },
  { name: "Dining & lifestyle", value: 1180, colorVar: "--color-chart-4" },
  { name: "Transport", value: 840, colorVar: "--color-chart-3" },
  { name: "Family & education", value: 720, colorVar: "--color-chart-6" },
  { name: "Travel", value: 400, colorVar: "--color-chart-7" },
  { name: "Other", value: 200, colorVar: "--color-chart-8" },
];

export const budgetTotal = budgetCategories.reduce((s, c) => s + c.value, 0);

export const cashFlowMonths = [
  { label: "Feb", income: 13800, expenses: 9100 },
  { label: "Mar", income: 13800, expenses: 8700 },
  { label: "Apr", income: 14200, expenses: 9400 },
  { label: "May", income: 14200, expenses: 8100 },
  { label: "Jun", income: 14200, expenses: 8900 },
  { label: "Jul", income: 14200, expenses: 8460 },
];

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  monthly: number;
  targetDate: string;
  category: "Emergency fund" | "Home" | "Education" | "Retirement" | "Travel" | "Legacy";
};

export const initialGoals: Goal[] = [
  {
    id: "emergency",
    name: "Emergency reserve",
    target: 60000,
    saved: 52400,
    monthly: 1200,
    targetDate: "Oct 2026",
    category: "Emergency fund",
  },
  {
    id: "lakehouse",
    name: "Lake house down payment",
    target: 240000,
    saved: 96800,
    monthly: 3500,
    targetDate: "2029",
    category: "Home",
  },
  {
    id: "education",
    name: "Children's education fund",
    target: 380000,
    saved: 141200,
    monthly: 1800,
    targetDate: "2036",
    category: "Education",
  },
  {
    id: "retirement",
    name: "Retirement by 58",
    target: 4200000,
    saved: 1180000,
    monthly: 4200,
    targetDate: "2049",
    category: "Retirement",
  },
];

export const portfolio = {
  value: 1247300,
  ytdReturn: 0.114,
  allocation: [
    { name: "Global equities", value: 561285, colorVar: "--color-chart-3" },
    { name: "Fixed income", value: 311825, colorVar: "--color-chart-1" },
    { name: "Private markets", value: 199568, colorVar: "--color-chart-5" },
    { name: "Real assets", value: 124730, colorVar: "--color-chart-2" },
    { name: "Cash & equivalents", value: 49892, colorVar: "--color-chart-8" },
  ],
};

const PORTFOLIO_1Y = [
  1119400, 1128900, 1141200, 1135800, 1152300, 1164700, 1158200, 1172900,
  1189400, 1203100, 1214800, 1226300, 1235700, 1229100, 1241600, 1247300,
];

export function portfolioSeries(range: Range) {
  const counts: Record<Range, number> = { "1M": 4, "6M": 8, "1Y": 16, "5Y": 16 };
  const n = counts[range];
  const values = PORTFOLIO_1Y.slice(-n);
  return values.map((value, i) => ({ label: `W${i + 1}`, value }));
}

export const holdings = [
  { name: "Global Equity Index", ticker: "ACGE", value: 412300, weight: 0.331, ytd: 0.132 },
  { name: "Investment Grade Bonds", ticker: "ACIG", value: 311825, weight: 0.25, ytd: 0.041 },
  { name: "Private Growth Fund III", ticker: "ACPG", value: 199568, weight: 0.16, ytd: 0.187 },
  { name: "Real Assets Trust", ticker: "ACRA", value: 124730, weight: 0.1, ytd: 0.062 },
  { name: "Emerging Markets", ticker: "ACEM", value: 148992, weight: 0.119, ytd: 0.089 },
  { name: "Cash & Treasuries", ticker: "ACCT", value: 49892, weight: 0.04, ytd: 0.021 },
];

export const healthBreakdown = [
  { label: "Emergency reserve coverage", score: 92, note: "8.4 months of expenses covered" },
  { label: "Debt-to-income ratio", score: 78, note: "24%, within a healthy range" },
  { label: "Savings rate", score: 88, note: "40.4% of income saved monthly" },
  { label: "Portfolio diversification", score: 71, note: "Slightly concentrated in equities" },
  { label: "Insurance & protection", score: 65, note: "Umbrella policy renewal recommended" },
];

export const healthActions = [
  {
    title: "Rebalance toward fixed income",
    detail: "Equities have drifted to 46% of the portfolio, above your 40% target band.",
    impact: "+4 pts",
  },
  {
    title: "Increase umbrella coverage",
    detail: "Net worth growth has outpaced your liability coverage since last review.",
    impact: "+3 pts",
  },
  {
    title: "Automate the lake house transfer",
    detail: "A standing transfer keeps the 2029 target on pace without manual entries.",
    impact: "+2 pts",
  },
];

export const plannerSuggestions = [
  "How is my portfolio positioned for a downturn?",
  "Can I retire by 58 at this savings rate?",
  "Where is my spending drifting this quarter?",
  "What would selling the RSU grant net after tax?",
];

export function plannerResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("retire") || q.includes("retirement")) {
    return "At $4,200 a month and a 6.8% blended return, the retirement fund hits $4.2M in 2049, the year you turn 58. A 5% drawdown in any single year pushes that back about four months, not the target year itself.";
  }
  if (q.includes("downturn") || q.includes("risk") || q.includes("crash")) {
    return "Your portfolio carries a 0.87 beta to global equities. In a modeled 20% drawdown, the balanced allocation would decline approximately 14.6% before fixed income and real assets dampen the fall.";
  }
  if (q.includes("spend") || q.includes("budget") || q.includes("drift")) {
    return "Dining & lifestyle spending is running 12% above your 90-day average this month, concentrated in the last three weekends. Every other category is within its usual band.";
  }
  if (q.includes("rsu") || q.includes("sell") || q.includes("stock") || q.includes("tax")) {
    return "At current vest value and your marginal bracket, an RSU sale nets approximately 63% after federal, state, and NIIT. Spreading the sale across two tax years could recover roughly $8,400.";
  }
  if (q.includes("goal") || q.includes("house") || q.includes("home")) {
    return "The lake house fund sits at 40%, with 3.5 years to go. At the current rate you land within two months of the 2029 date. Nothing to change here.";
  }
  return "That's tracking within the normal range for your accounts right now. Tell me what you're actually deciding between and I'll run the numbers on it.";
}
