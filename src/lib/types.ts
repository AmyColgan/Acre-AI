export type RiskLevel = "cautious" | "balanced" | "growth";
export type CoachingStyle = "gentle" | "direct" | "analytical";

export interface Profile {
  name: string;
  currency: string;
  riskLevel: RiskLevel;
  coachingStyle: CoachingStyle;
  onboarded: boolean;
  joinedAt: string; // ISO date
}

export type CategoryId =
  | "housing"
  | "utilities"
  | "groceries"
  | "transportation"
  | "subscriptions"
  | "dining"
  | "shopping"
  | "entertainment"
  | "health"
  | "education"
  | "other";

export interface BudgetCategory {
  id: CategoryId;
  name: string;
  budget: number;
  kind: "fixed" | "variable";
  /** last-month spend, used for trend arrows */
  lastMonth: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  name: string;
  category: CategoryId | "income" | "savings" | "debt";
  amount: number; // positive = money out, income stored positive too (type disambiguates)
  type: "expense" | "income" | "transfer";
}

export interface Goal {
  id: string;
  name: string;
  icon: string; // emoji-free label key rendered as SVG icon name
  target: number;
  current: number;
  deadline: string; // ISO date
  priority: number; // 1 = highest
  monthlyContribution: number;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // percent
  minPayment: number;
}

export type AssetClass = "usStocks" | "intlStocks" | "bonds" | "cash" | "alternatives";

export interface Portfolio {
  totalValue: number;
  monthlyContribution: number;
  allocation: Record<AssetClass, number>; // percents summing to 100
  /** trailing 12-month synthetic growth baseline */
  startValue: number;
}

export type TaskBucket = "today" | "week" | "month" | "longTerm";

export interface ActionTask {
  id: string;
  title: string;
  detail: string;
  bucket: TaskBucket;
  priority: "high" | "medium" | "low";
  impact: number; // estimated $ impact
  due: string;
  timeNeeded: string;
  category: string;
  status: "open" | "done" | "dismissed";
  /** applied to state when completed */
  effect?: TaskEffect;
}

export type TaskEffect =
  | { kind: "moveToSavings"; amount: number; goalId?: string }
  | { kind: "payDebt"; amount: number; debtId?: string }
  | { kind: "cutCategoryBudget"; category: CategoryId; amount: number }
  | { kind: "none" };

export interface Opportunity {
  id: string;
  title: string;
  gain: number; // estimated $ / month or one-off
  gainLabel: string;
  difficulty: "easy" | "medium" | "hard";
  time: string;
  impact: "low" | "medium" | "high";
  why: string;
  calculation: string;
  badges: string[];
  status: "new" | "accepted" | "dismissed" | "saved";
  effect?: TaskEffect;
}

export interface DecisionInput {
  name: string;
  cost: number;
  monthlyCost: number;
  category: string;
  urgency: "low" | "medium" | "high";
  deadline: string;
  fundingSource: "cash" | "savings" | "credit";
  notes: string;
}

export interface DecisionReport {
  id: string;
  createdAt: string;
  input: DecisionInput;
  score: number;
  verdict: "Do it now" | "Wait" | "Modify" | "Avoid";
  explanation: string;
  immediateCashImpact: number;
  monthlyCashFlowImpact: number;
  savingsImpact: string;
  debtImpact: string;
  goalDelayDays: number;
  travelDelayDays: number;
  riskLevel: "low" | "medium" | "high";
  alternatives: string[];
  safeToSpendAfter: number;
}

export interface SavedRecommendation {
  id: string;
  createdAt: string;
  topic: string;
  summary: string;
  detail: string;
  source: "planner" | "assistant" | "dashboard" | "investments";
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: "info" | "good" | "warn";
}

export interface LearnState {
  xp: number;
  /** unitId → indexes of completed lessons */
  lessonsDone: Record<string, number[]>;
  /** unitId → quiz passed */
  quizPassed: Record<string, boolean>;
}

export interface PulseState {
  version: number;
  profile: Profile;
  monthlyIncome: number;
  savingsBalance: number;
  emergencyFundGoalId: string;
  categories: BudgetCategory[];
  transactions: Transaction[];
  goals: Goal[];
  debts: Debt[];
  portfolio: Portfolio;
  tasks: ActionTask[];
  opportunities: Opportunity[];
  decisions: DecisionReport[];
  recommendations: SavedRecommendation[];
  notifications: Notification[];
  learn: LearnState;
  /** one-time flags, e.g. dashboard recommendation applied */
  flags: Record<string, boolean>;
}
